import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getVoiceConfig } from '$lib/utils/voice-config';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { getUserTtsCount } from '$lib/helpers/get-user-tts-count';
import { supabase } from '$lib/supabaseClient';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;

/** When true: only strip Arabic ؟ from text, keep diacritics, no pronunciation mapping. Set in .env.local to test. */
const STRIP_ARABIC_QM_ONLY = false;

const FREE_TTS_LIMIT = 5;

if (!ELEVENLABS_API_KEY) {
	throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
}

const client = new ElevenLabsClient({
	apiKey: ELEVENLABS_API_KEY
});

// Spelling that TTS misreads → spelling that sounds right (per dialect). Exact key match only; no stripping so male/female stay distinct.
const TTS_PRONUNCIATION_FIXES: Record<string, Record<string, string>> = {
	'egyptian-arabic': {
		'إزيك': 'Izzayak',   // male
		'إزيكَ': 'Izzayak',  // male (with fatha)
		'إزيكِ': 'Izzayik'   // female
	}
};

function normalizeForTTS(text: string): string {
	return text.replace(/[؟?]/g, '').trim();
}

/** 1:1 map: only substitute when cleaned text exactly matches a key. No diacritic stripping. */
function applyPronunciationFixes(cleaned: string, dialect: string): string {
	const fixes = TTS_PRONUNCIATION_FIXES[dialect];
	if (!fixes) return cleaned;
	return fixes[cleaned] ?? cleaned;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	// Auth check
	const { sessionId, user } = await locals?.auth?.validate() || {};
	if (!sessionId || !user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const userId = user.id;

	// Paywall check — parallelize for speed
	const [hasActiveSubscription, ttsCount] = await Promise.all([
		getUserHasActiveSubscription(userId),
		getUserTtsCount(userId)
	]);

	if (!hasActiveSubscription && ttsCount >= FREE_TTS_LIMIT) {
		return new Response(JSON.stringify({
			error: 'Subscription required',
			message: `You've reached the free limit of ${FREE_TTS_LIMIT} audio plays. Subscribe to continue.`,
			requiresSubscription: true,
			ttsCount
		}), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const data = await request.json();
		const { text, dialect } = data;

		if (!text) {
			return new Response(JSON.stringify({ error: 'Missing required field: text' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const voiceConfig = getVoiceConfig(dialect);

		const textForTTS = STRIP_ARABIC_QM_ONLY
			? text.replace(/؟/g, '')
			: applyPronunciationFixes(normalizeForTTS(text), dialect);

		const audioStream = await client.generate({
			voice: voiceConfig.voice,
			model_id: 'eleven_turbo_v2_5',
			text: textForTTS,
			voice_settings: {
				stability: voiceConfig.stability,
				similarity_boost: voiceConfig.similarity_boost
			}
		});

		const chunks: Uint8Array[] = [];
		for await (const chunk of audioStream) {
			chunks.push(chunk);
		}

		const content = Buffer.concat(chunks);

		// Increment counter for free users after successful generation
		if (!hasActiveSubscription) {
			await supabase
				.from('user')
				.update({ tts_calls_count: ttsCount + 1 })
				.eq('id', userId);
		}

		return new Response(content, {
			headers: { 'Content-Type': 'audio/mpeg' }
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[text-to-speech] Error:', message, err);
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
