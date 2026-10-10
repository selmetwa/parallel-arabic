import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getVoiceConfig } from '$lib/utils/voice-config';
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

let client: ElevenLabsClient | null = null;

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

	if (!env.ELEVENLABS_API_KEY) return new Response('Audio unavailable', { status: 503 });
	client ??= new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });

	try {
		const voice = getVoiceConfig(dialect);
		const stream = await client.generate({
			voice: voice.voice,
			model_id: 'eleven_turbo_v2_5',
			// A trailing question mark makes some voices trail off.
			text: spellForSpeech(text.replace(/[؟?]+$/, '').trim(), dialect),
			// Short clips: the same small format as the Room Hunt recordings.
			output_format: 'mp3_22050_32',
			voice_settings: { stability: voice.stability, similarity_boost: voice.similarity_boost }
		});
		const chunks: Uint8Array[] = [];
		for await (const chunk of stream) chunks.push(chunk);

		return new Response(Buffer.concat(chunks), {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Cache-Control': `public, max-age=${YEAR}, immutable`,
				'CDN-Cache-Control': `public, max-age=${YEAR}, immutable`,
				'X-Robots-Tag': 'noindex'
			}
		});
	} catch (err) {
		console.error('[game-audio] generation failed:', err);
		return new Response('Audio unavailable', { status: 502 });
	}
};
