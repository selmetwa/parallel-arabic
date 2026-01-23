import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { createWordDefinitionSchema } from '$lib/utils/gemini-schemas';

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const data = await request.json();

  try {
    const { jsonSchema } = createWordDefinitionSchema();

    const enhancedQuestion = `You are an expert Arabic language teacher specializing in dialectal Arabic.

${data.question}

Provide a structured definition with:
- arabic: The exact Arabic word/phrase being defined
- transliteration: Latin character transliteration
- definition: Clear, concise English definition
- breakdown: For multi-word phrases only, provide word-by-word breakdown with:
  - arabic: The Arabic word
  - englishLabel: Short English label (1-3 words)
  - transliteration: Transliteration
  - meaning: English meaning
  Use an empty array [] for single words.
- contextualMeaning: How this word/phrase is used in the given sentence context`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.0-flash",
      contents: enhancedQuestion,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: jsonSchema
      }
    });
  
    return json({ message: { content: response.text } });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}