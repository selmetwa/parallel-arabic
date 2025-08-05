import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getVoiceConfig } from '$lib/utils/voice-config';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
	throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
}

const client = new ElevenLabsClient({
	apiKey: ELEVENLABS_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
  const { text, dialect } = data;

  const voiceConfig = getVoiceConfig(dialect);

	const audioStream = await client.generate({
		voice: voiceConfig.voice,
		model_id: 'eleven_turbo_v2_5',
		text: text,
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
