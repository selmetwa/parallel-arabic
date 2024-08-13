import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

import OpenAI from "openai";

export const POST: RequestHandler = async ({ request }) => {
  const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
  const data = await request.json();

  try {
      const mp3 = await openai.audio.speech.create({
          model: 'tts-1-hd',
          voice: 'alloy',
          input: data.text,
      });

      // Convert the response to a buffer
      const buffer = Buffer.from(await mp3.arrayBuffer());

      // Return the buffer as a streaming response
      return new Response(buffer, {
          headers: {
              'Content-Type': 'audio/mpeg', // or the correct MIME type for the audio format
              'Content-Disposition': 'attachment; filename="speech.mp3"'
          }
      });
  } catch (error) {
      console.error('Error generating speech:', error);
      return new Response('Failed to generate speech', { status: 500 });
  }
};