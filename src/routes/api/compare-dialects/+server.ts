import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { createDialectComparisonSchema } from '$lib/utils/gemini-schemas';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const { text, currentDialect, transliteration } = await request.json();

  if (!text) {
      return error(400, { message: 'Text is required' });
  }

  // Map current dialect to schema key
  const dialectMap: Record<string, string> = {
    'egyptian-arabic': 'egyptian',
    'darija': 'darija',
    'levantine': 'levantine',
    'fusha': 'fusha'
  };

  const currentDialectKey = currentDialect ? dialectMap[currentDialect] : null;
  const dialectsToTranslate = ['egyptian', 'darija', 'levantine', 'fusha'].filter(d => d !== currentDialectKey);

  const { jsonSchema, zodSchema } = createDialectComparisonSchema();

  // Build the prompt based on which dialects need translation
  let prompt = `Translate the following text into the following Arabic dialects: ${dialectsToTranslate.map(d => {
    const names: Record<string, string> = {
      'egyptian': 'Egyptian Arabic',
      'darija': 'Moroccan Darija',
      'levantine': 'Levantine Arabic',
      'fusha': 'Modern Standard Arabic (Fusha)'
    };
    return names[d];
  }).join(', ')}.\n\n`;
  
  if (currentDialectKey) {
    const currentDialectName: Record<string, string> = {
      'egyptian': 'Egyptian Arabic',
      'darija': 'Moroccan Darija',
      'levantine': 'Levantine Arabic',
      'fusha': 'Modern Standard Arabic (Fusha)'
    };
    prompt += `For ${currentDialectName[currentDialectKey]}, use the original Arabic text exactly as provided: "${text}". `;
    if (transliteration) {
      prompt += `Use the provided transliteration: "${transliteration}". `;
    } else {
      prompt += `Provide the transliteration for this text. `;
    }
    prompt += `Do not translate it.\n\n`;
  }
  
  prompt += `Original text: "${text}"\n\n`;
  prompt += `Provide the Arabic script and transliteration for each dialect.\n`;
  prompt += `Return the response in JSON format matching the schema.`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-pro-preview",
      contents: prompt,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema
      }
    });
  
    console.log('compare dialects response', response.text);
    // Parse the response text as JSON using the helper that handles markdown blocks
    const parsedResponse = parseJsonFromGeminiResponse(response.text || '{}', zodSchema);
    return json(parsedResponse);

  } catch (e) {
    console.error('Error comparing dialects:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to compare dialects. Please try again.';
    return error(500, { message: errorMessage });
  }
}
