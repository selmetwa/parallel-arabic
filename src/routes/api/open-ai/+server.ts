import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const data = await request.json();

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-flash-preview",
      contents: data.question
    });
  
    console.log({ response, candidates: response.candidates, text: response.text });
    return json({ message: { message: { content: response.text } } });

  } catch (e) {
    console.error(e);
    
    // Check if it's a 503 error (model overloaded)
    if (e instanceof GeminiApiError && e.is503) {
      return error(503, { 
        message: 'The AI model is currently overloaded. Please try again in a few moments. We\'re working to handle the high demand.' 
      });
    }
    
    return error(500, { message: 'Something went wrong' });
  }
}
