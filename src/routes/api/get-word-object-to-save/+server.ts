import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';

export const POST: RequestHandler = async ({ request, locals }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const session = await locals.auth.validate();

  if (!session?.sessionId) {
    return error(401, { message: 'You must have an account do that' });
  }

  const data = await request.json();

  try {
    const enhancedQuestion = `${data.question}

IMPORTANT: 
1. Return PURE JSON only.
2. Do NOT wrap the response in markdown code blocks (no \`\`\`json ... \`\`\`).`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-flash-preview",
      contents: enhancedQuestion,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
  
    return json({ message: { content: response.text } });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}
