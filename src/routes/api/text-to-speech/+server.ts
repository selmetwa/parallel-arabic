import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
	throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
}

const client = new ElevenLabsClient({
	apiKey: ELEVENLABS_API_KEY
});

// Dialect-specific voice configuration
const getVoiceConfig = (dialect: string) => {
  switch (dialect) {
    case 'fusha':
      return {
        voice: 'Mona',
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'egyptian-arabic':
      return {
        voice: 'Haytham',
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'levantine':
      return {
        voice: 'Sara - Kind & Expressive',
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    case 'darija':
      return {
        voice: 'Ghizlane - Moroccan Darija Dialect',
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
    default:
      // Default to Egyptian voice for backwards compatibility
      return {
        voice: 'Haytham',
        speed: 0.9,
        stability: 0.9,
        similarity_boost: 0.9
      };
  }
};

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
      'X-Playback-Rate': voiceConfig.speed.toString()
    }
  });
};
