import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getVoiceConfig } from '$lib/utils/voice-config';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;

/** When true: only strip Arabic ؟ from text, keep diacritics, no pronunciation mapping. Set in .env.local to test. */
const STRIP_ARABIC_QM_ONLY = false;

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

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const { text, dialect } = data;

	const voiceConfig = getVoiceConfig(dialect);


	const textForTTS = STRIP_ARABIC_QM_ONLY
		? text.replace(/؟/g, '')  // only strip Arabic question mark; keep diacritics, no mapping
		: applyPronunciationFixes(normalizeForTTS(text), dialect);


		console.log({
			text,
			STRIP_ARABIC_QM_ONLY,
			textForTTS
		})
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
  return new Response(content, {
    headers: {
      'Content-Type': 'audio/mpeg',
    }
  });
};
