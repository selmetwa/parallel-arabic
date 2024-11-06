// import { env } from '$env/dynamic/private';
// import type { RequestHandler } from './$types';
// import OpenAI from "openai";

// export const POST: RequestHandler = async ({ request }) => {
//   const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
//   const data = await request.json();

//   // const filePath = path.join('/static', 'audio', 'audio-cache', `${data.text}.mp3`);
//   try {
//       const mp3 = await openai.audio.speech.create({
//           model: 'tts-1-hd',
//           voice: 'echo',
//           input: `... ${data.text}`,
//           rate: 0.1
//       });

//       // Convert the response to a buffer
//       const buffer = Buffer.from(await mp3.arrayBuffer());
//       // fs.writeFile(filePath, buffer);

//       // Return the buffer as a streaming response
//       return new Response(buffer, {
//           headers: {
//               'Content-Type': 'audio/mpeg', // or the correct MIME type for the audio format
//               'Content-Disposition': 'attachment; filename="speech.mp3"'
//           }
//       });
//   } catch (error) {
//       console.error('Error generating speech:', error);
//       return new Response('Failed to generate speech', { status: 500 });
//   }
// };

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
		text: data.text
	});

	const chunks: Buffer[] = [];
	for await (const chunk of audioStream) {
		chunks.push(chunk);
	}

	const content = Buffer.concat(chunks);
  return new Response(content)
};
