import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const data = await request.json();

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: data.question
    });
  
    return json({ message: { content: response.text } });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}