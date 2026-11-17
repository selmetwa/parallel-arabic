import type { RequestHandler } from './$types';
import { synthesizeSpeech } from '$lib/server/tts';
import { resolveVariety } from '$lib/constants/varieties';
import { NUR_ENABLED } from '$lib/constants/feature-flags';
import { learnerVariety } from '$lib/server/learner-variety';
import { spellForSpeech } from '$lib/utils/speech-spelling';
import { isGameDialect } from '$lib/games/themes';
import { MAX_GAME_AUDIO_CHARS } from '$lib/games/game-audio';
import { consumeRateLimit } from '$lib/server/redis';

/**
 * Spoken audio for game words and sentences that have no recording, free for
 * every player. A GET, so the CDN caches each (dialect, text) for a year and a
 * word costs one generation however many people hear it. Cache misses are
 * capped per IP; the text is capped in length so this can't read essays.
 */
const MISSES_PER_HOUR = 150;
const YEAR = 60 * 60 * 24 * 365;
const HOUR = 60 * 60;

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	const dialect = url.searchParams.get('d');
	const text = (url.searchParams.get('t') ?? '').trim();

	if (!isGameDialect(dialect) || !text || text.length > MAX_GAME_AUDIO_CHARS) {
		return new Response('Bad request', { status: 400 });
	}
	if (!/[؀-ۿ]/.test(text)) {
		return new Response('Arabic text only', { status: 400 });
	}

	const { allowed } = await consumeRateLimit(
		`game-audio:ip:${getClientAddress()}`,
		MISSES_PER_HOUR,
		60 * 60
	);
	if (!allowed) return new Response('Too many requests', { status: 429 });

	try {
		// Shared through the CDN, so always the dialect's default voice.
		const { audio, provider } = await synthesizeSpeech({
			// A trailing question mark makes some voices trail off.
			text: spellForSpeech(text.replace(/[؟?]+$/, '').trim(), dialect),
			dialect,
			variety: resolveVariety(dialect),
			// Short clips: the same small format as the Room Hunt recordings.
			small: true
		});

		// A fallback clip in the old voice is only cached briefly, so the URL gets the
		// Nur recording once Nur is answering again.
		const maxAge = NUR_ENABLED && provider !== 'nur' ? HOUR : YEAR;
		return new Response(audio, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Cache-Control': `public, max-age=${maxAge}${maxAge === YEAR ? ', immutable' : ''}`,
				'CDN-Cache-Control': `public, max-age=${maxAge}${maxAge === YEAR ? ', immutable' : ''}`,
				'X-Robots-Tag': 'noindex'
			}
		});
	} catch (err) {
		console.error('[game-audio] generation failed:', err);
		return new Response('Audio unavailable', { status: 502 });
	}
};
