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
    
    const enhancedQuestion = `You are an expert Arabic language teacher specializing in dialectal Arabic. Your task is to provide clear, structured definitions for Arabic words and phrases.

${data.question}

REQUIREMENTS:
1. Provide the Arabic script (in the "arabic" field) of the exact word/phrase being defined.
2. Provide the transliteration (in the "transliteration" field) using only Latin characters.
3. Give a concise, clear English definition (in the "definition" field) that explains what the word/phrase means.
4. If the word/phrase consists of multiple words, provide a breakdown array where each item includes:
   - The Arabic script of that word
   - The transliteration of that word
   - The meaning of that word
   - Optional context if needed
5. Explain the contextual meaning (in the "contextualMeaning" field) - how this word/phrase is used in the specific sentence context provided.

CRITICAL FORMATTING REQUIREMENTS:
- You MUST return a valid JSON object exactly matching this schema:
${JSON.stringify(jsonSchema, null, 2)}
- Return PURE JSON only - no markdown code blocks, no explanations, no additional text.
- Do NOT wrap the response in \`\`\`json ... \`\`\` code fences.
- The response must be valid JSON that can be parsed directly by JSON.parse().`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-flash-preview",
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