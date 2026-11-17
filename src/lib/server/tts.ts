import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import { NUR_ENABLED } from '$lib/constants/feature-flags';
import { nurVoiceFor, type VarietyInfo } from '$lib/constants/varieties';
import { getVoiceConfig } from '$lib/utils/voice-config';

const EESI_SPEECH_URL = 'https://api.eesi.ai/v1/audio/speech';

let elevenlabs: ElevenLabsClient | null = null;

interface SpeechOptions {
	/** Already spelled for speech. */
	text: string;
	dialect: string;
	variety?: VarietyInfo;
	/** Short game clips use ElevenLabs' small format; EESI has one mp3 format. */
	small?: boolean;
}

/** MP3 audio of `text` in the dialect's voice: Nur (EESI) when NUR_ENABLED, else ElevenLabs. */
export async function synthesizeSpeech({ text, dialect, variety, small }: SpeechOptions): Promise<Buffer> {
	if (NUR_ENABLED && env.EESI_API_KEY) return nurSpeech(text, dialect, variety);
	// A missing key shouldn't silence every audio button in the app.
	if (NUR_ENABLED) console.warn('[tts] NUR_ENABLED but EESI_API_KEY is not set; using ElevenLabs');
	return elevenLabsSpeech(text, dialect, small);
}

async function nurSpeech(text: string, dialect: string, variety?: VarietyInfo): Promise<Buffer> {
	const { voice, language } = nurVoiceFor(dialect, variety);
	const res = await fetch(EESI_SPEECH_URL, {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.EESI_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ model: 'nur-v1', voice, input: text, speed: 0.9, ...(language && { language }) })
	});
	if (!res.ok) throw new Error(`EESI speech failed (${res.status}): ${await res.text()}`);
	return Buffer.from(await res.arrayBuffer());
}

async function elevenLabsSpeech(text: string, dialect: string, small?: boolean): Promise<Buffer> {
	if (!env.ELEVENLABS_API_KEY) throw new Error('Missing ELEVENLABS_API_KEY');
	elevenlabs ??= new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });
	const voice = getVoiceConfig(dialect);
	const stream = await elevenlabs.generate({
		voice: voice.voice,
		model_id: 'eleven_turbo_v2_5',
		text,
		...(small && { output_format: 'mp3_22050_32' as const }),
		voice_settings: { stability: voice.stability, similarity_boost: voice.similarity_boost }
	});
	const chunks: Uint8Array[] = [];
	for await (const chunk of stream) chunks.push(chunk);
	return Buffer.concat(chunks);
}
