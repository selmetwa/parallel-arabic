import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { createWordDefinitionSchema } from '$lib/utils/gemini-schemas';

const dialectNames: Record<string, string> = {
  fusha: 'Modern Standard Arabic',
  levantine: 'Levantine Arabic',
  darija: 'Moroccan Darija',
  'egyptian-arabic': 'Egyptian Arabic',
  iraqi: 'Iraqi Arabic',
  khaleeji: 'Khaleeji Arabic'
};

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured');
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }

  const ai = new GoogleGenAI({ apiKey });

  let data;
  try {
    data = await request.json();
  } catch (parseError) {
    console.error('Failed to parse request body:', parseError);
    return error(400, { message: 'Invalid request body' });
  }

  // Build the question from either format
  let question: string;

  if (data.question) {
    // Format 1: { question: string }
    question = data.question;
  } else if (data.word && data.sentence) {
    // Format 2: { word, type, sentence: { arabic, english, transliteration }, dialect }
    const dialectName = dialectNames[data.dialect] || data.dialect || 'Arabic';
    const wordType = data.type || 'arabic';

    if (wordType === 'english') {
      question = `What is the word for "${data.word}" in ${dialectName}? Considering the following sentences:
		Arabic: "${data.sentence.arabic}"
		English: "${data.sentence.english}"
		Transliteration: "${data.sentence.transliteration}"

		Please provide the Arabic word/phrase and its definition based on the context.`;
    } else {
      question = `What does ${data.word} mean in ${dialectName}? Considering the following sentences:
		Arabic: "${data.sentence.arabic}"
		English: "${data.sentence.english}"
		Transliteration: "${data.sentence.transliteration}"

		Please provide a definition based on the context.`;
    }
  } else {
    return error(400, { message: 'Either question or word+sentence is required' });
  }

  try {
    const { jsonSchema } = createWordDefinitionSchema();

    const enhancedQuestion = `You are an expert Arabic language teacher specializing in dialectal Arabic.

${question}

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

    // Get the text content from the response
    let responseText = response.text;

    if (!responseText) {
      console.error('Empty response from Gemini API');
      return error(500, { message: 'Empty response from AI' });
    }

    // Clean up the response to extract only the JSON
    // Sometimes Gemini adds markdown code blocks or extra text after the JSON

    // Strip markdown code blocks if present
    if (responseText.includes('```')) {
      responseText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
    }

    // Extract just the JSON object (in case there's extra text after it)
    // Look for the first { and find the matching }
    const jsonStartIndex = responseText.indexOf('{');
    if (jsonStartIndex !== -1) {
      let braceCount = 0;
      let jsonEndIndex = jsonStartIndex;

      for (let i = jsonStartIndex; i < responseText.length; i++) {
        if (responseText[i] === '{') braceCount++;
        if (responseText[i] === '}') braceCount--;
        if (braceCount === 0) {
          jsonEndIndex = i + 1;
          break;
        }
      }

      responseText = responseText.substring(jsonStartIndex, jsonEndIndex);
    }

    // Validate it's proper JSON
    try {
      JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      return error(500, { message: 'Invalid response format from AI' });
    }

    // Return in a format compatible with both old and new consumers
    return json({
      message: {
        content: responseText,
        message: {
          content: responseText
        }
      }
    });

  } catch (e) {
    console.error('Definition API error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Something went wrong';
    return error(500, { message: errorMessage });
  }
}