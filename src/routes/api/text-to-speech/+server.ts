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

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	const audioStream = await client.generate({
		voice: 'Haytham',
		model_id: 'eleven_turbo_v2_5',
		text: data.text,
    voice_settings: {
      stability: 0.9,
      similarity_boost: 0.9,
      speed      : 0.7,
    }

	});

	const chunks: Buffer[] = [];
	for await (const chunk of audioStream) {
		chunks.push(chunk);
	}

	const content = Buffer.concat(chunks);
  return new Response(content)
};
