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

/** How long after completing onboarding its scripted conversation can bypass the TTS paywall. */
const ONBOARDING_BYPASS_WINDOW_MS = 60 * 60 * 1000;

/** Per-browser audio plays allowed before signing in. */
const ANON_TTS_LIMIT = 6;
const ANON_TTS_COOKIE = 'anon_tts_plays';

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

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const { sessionId, user } = await locals?.auth?.validate() || {};
	const userId = sessionId && user ? user.id : null;

	const data = await request.json();
	const { text, dialect, context } = data;

	if (!text) {
		return new Response(JSON.stringify({ error: 'Missing required field: text' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let hasActiveSubscription = false;
	let ttsCount = 0;
	let anonPlays = 0;

	// The onboarding conversation is a fixed, one-time scripted exercise — it
	// shouldn't burn through (or be blocked by) the general free-plays paywall.
	// The bypass only holds for a short window right after the user actually
	// completes onboarding, so it can't be used for unlimited free TTS.
	let isOnboardingBypass = false;
	if (userId && context === 'onboarding') {
		const { data: userRow } = await supabase
			.from('user')
			.select('onboarding_completed_at')
			.eq('id', userId)
			.single();
		const completedAt = userRow?.onboarding_completed_at;
		isOnboardingBypass = !!completedAt && Date.now() - completedAt < ONBOARDING_BYPASS_WINDOW_MS;
	}

	if (!isOnboardingBypass) {
		if (userId) {
			// Paywall check — parallelize for speed
			[hasActiveSubscription, ttsCount] = await Promise.all([
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
		} else {
			// Signed-out visitors get a small per-browser allowance so someone landing
			// on /tutor from search can hear the words in the free scenario steps
			// before being asked to sign up.
			anonPlays = Number(cookies.get(ANON_TTS_COOKIE)) || 0;

			if (anonPlays >= ANON_TTS_LIMIT) {
				return new Response(JSON.stringify({
					error: 'Subscription required',
					message: `You've reached the free limit of ${ANON_TTS_LIMIT} audio plays. Subscribe to continue.`,
					requiresSubscription: true
				}), {
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}
	}

	try {
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

		// Increment counter for free users after successful generation (skipped
		// entirely for the onboarding bypass — those plays don't count against
		// the free quota).
		if (!isOnboardingBypass) {
			if (userId && !hasActiveSubscription) {
				await supabase
					.from('user')
					.update({ tts_calls_count: ttsCount + 1 })
					.eq('id', userId);
			} else if (!userId) {
				cookies.set(ANON_TTS_COOKIE, String(anonPlays + 1), {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: true,
					maxAge: 60 * 60 * 24 * 30
				});
			}
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
