/**
 * Cached TTS playback for the listening game.
 *
 * The rest of the app fetches `/api/text-to-speech` fresh on every play, which is
 * fine when a play is a deliberate click. A listening round is different: the
 * audio *is* the question, so it autoplays, gets replayed, and gets replayed
 * slowly — three plays of the same sentence would otherwise be three ElevenLabs
 * calls and three 1-2s waits, against a free quota of five.
 *
 * So each sentence is fetched once and kept as an object URL for the life of the
 * round. Replays are instant and free, and the next question can be warmed while
 * the learner is still answering the current one.
 */

import { Howl } from 'howler';

/** The app plays TTS slightly slow across the board; a listening round keeps that baseline. */
export const NORMAL_RATE = 0.9;
/** "Slower" replay, for catching a word that went by too fast. */
export const SLOW_RATE = 0.7;

/** Thrown when TTS refuses for a reason the caller should surface rather than log. */
export class TtsAccessError extends Error {
	constructor(
		public readonly reason: 'subscription' | 'auth',
		message: string
	) {
		super(message);
		this.name = 'TtsAccessError';
	}
}

const cache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();

function keyFor(text: string, dialect: string): string {
	return `${dialect}|${text}`;
}

async function fetchAudioUrl(text: string, dialect: string): Promise<string> {
	const res = await fetch('/api/text-to-speech', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text, dialect })
	});

	if (!res.ok) {
		// The game's old inline player swallowed these, leaving a dead button. With
		// autoplay it would be silence with nothing to click, so they surface now.
		if (res.status === 401) {
			throw new TtsAccessError('auth', 'Sign in to play audio.');
		}
		if (res.status === 403) {
			const body = await res.json().catch(() => ({}));
			if (body?.requiresSubscription) {
				throw new TtsAccessError('subscription', 'Audio plays are limited on the free plan.');
			}
		}
		throw new Error(`TTS request failed: ${res.statusText}`);
	}

	return URL.createObjectURL(await res.blob());
}

/**
 * The object URL for `text`, fetched once and cached.
 *
 * Concurrent callers for the same text share one request — autoplay and a prefetch
 * can otherwise race on the same sentence and burn two quota calls for one blob.
 */
export async function getAudioUrl(text: string, dialect: string): Promise<string> {
	const key = keyFor(text, dialect);

	const cached = cache.get(key);
	if (cached) return cached;

	const pending = inFlight.get(key);
	if (pending) return pending;

	const request = fetchAudioUrl(text, dialect)
		.then((url) => {
			cache.set(key, url);
			return url;
		})
		.finally(() => {
			inFlight.delete(key);
		});

	inFlight.set(key, request);
	return request;
}

/** Warm the cache without playing, so the next question starts instantly. */
export function prefetch(text: string, dialect: string): void {
	if (!text) return;
	// Prefetch failures are not the learner's problem — the real play will report.
	void getAudioUrl(text, dialect).catch(() => {});
}

let currentSound: Howl | null = null;

/** Stop whatever is playing. Safe to call when nothing is. */
export function stopPlayback(): void {
	currentSound?.stop();
	currentSound = null;
}

/**
 * Play `text`, fetching it if this is the first time. Resolves when playback has
 * started (not when it ends); `onEnd` fires on completion.
 *
 * Throws `TtsAccessError` when the caller should show a paywall or sign-in prompt.
 */
export async function play(
	text: string,
	dialect: string,
	options: { rate?: number; onEnd?: () => void } = {}
): Promise<void> {
	const { rate = NORMAL_RATE, onEnd } = options;

	const src = await getAudioUrl(text, dialect);

	stopPlayback();

	const sound = new Howl({
		src: [src],
		format: ['mp3', 'wav'],
		rate,
		onend: () => {
			if (currentSound === sound) currentSound = null;
			onEnd?.();
		},
		onloaderror: () => {
			if (currentSound === sound) currentSound = null;
			onEnd?.();
		},
		onplayerror: () => {
			if (currentSound === sound) currentSound = null;
			onEnd?.();
		}
	});

	currentSound = sound;
	sound.play();
}

/**
 * Drop every cached blob. Call on destroy — a 20-question round holds 20 object
 * URLs, and nothing else ever revokes them.
 */
export function releaseAll(): void {
	stopPlayback();
	for (const url of cache.values()) {
		URL.revokeObjectURL(url);
	}
	cache.clear();
	inFlight.clear();
}
