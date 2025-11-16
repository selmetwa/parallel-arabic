import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const data = await request.json();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: data.question
    });
  
    console.log({ response, candidates: response.candidates, text: response.text });
    return json({ message: { message: { content: response.text } } });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}
