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
- contextualMeaning: How this word/phrase is used in the given sentence context

MAKE SURE THAT THE RESPONSE IS JSON FORMAT USING THE FOLOWING STRUCTURE

	const schema = z.object({
		arabic: z.string().describe('The Arabic word or phrase being defined'),
		transliteration: z.string().describe('Latin character transliteration of the Arabic'),
		definition: z.string().describe('Clear English definition of the word/phrase'),
		breakdown: z.array(z.object({
			arabic: z.string().describe('The Arabic word'),
			englishLabel: z.string().describe('Short English label for this word (1-3 words)'),
			transliteration: z.string().describe('Transliteration of this word'),
			meaning: z.string().describe('English meaning of this word'),
			context: z.string().optional().describe('Optional usage context')
		})).describe('Word-by-word breakdown for multi-word phrases. Empty array for single words.'),
		contextualMeaning: z.string().describe('How this word/phrase is used in the specific sentence context')
	});
`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-flash-preview",
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

    // Strip markdown code blocks if present
    if (responseText.includes('```')) {
      responseText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
    }

    // Extract just the JSON object if there's extra text before/after
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

    let normalizedObject: {
      arabic: string;
      transliteration: string;
      definition: string;
      breakdown: Array<{ arabic: string; englishLabel?: string; word?: string; transliteration: string; meaning: string }>;
      contextualMeaning?: string;
    };

    try {
      const parsed = JSON.parse(responseText);
      normalizedObject = {
        arabic: typeof parsed.arabic === 'string' ? parsed.arabic : '',
        transliteration: typeof parsed.transliteration === 'string' ? parsed.transliteration : '',
        definition: typeof parsed.definition === 'string' ? parsed.definition : '',
        breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown : [],
        ...(parsed.contextualMeaning != null && parsed.contextualMeaning !== '' && { contextualMeaning: String(parsed.contextualMeaning) })
      };
    } catch {
      // Fallback: parse markdown-style list (e.g. *   **arabic:** مطعم)
      const knownKeys = ['arabic', 'transliteration', 'definition', 'breakdown', 'contextualmeaning'];
      const bulletRegex = /^[*-]\s*\*\*(\w+)\*\*:\s*(.*)/;
      const lines = responseText.split(/\r?\n/);
      const result: Record<string, string> = {};
      let currentKey: string | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(bulletRegex);
        if (match) {
          const key = match[1].toLowerCase().replace(/\s+/g, '');
          const value = match[2].trim();
          if (knownKeys.includes(key)) {
            currentKey = key === 'contextualmeaning' ? 'contextualMeaning' : key;
            result[currentKey] = value;
          }
        } else if (currentKey === 'contextualMeaning' && result.contextualMeaning != null) {
          result.contextualMeaning += (result.contextualMeaning ? '\n' : '') + line;
        }
      }

      let breakdown: Array<{ arabic: string; englishLabel?: string; word?: string; transliteration: string; meaning: string }> = [];
      const rawBreakdown = result.breakdown?.trim() ?? '';
      if (rawBreakdown === '[]' || rawBreakdown === '') {
        breakdown = [];
      } else if (rawBreakdown.startsWith('[')) {
        try {
          const parsedBreakdown = JSON.parse(rawBreakdown);
          breakdown = Array.isArray(parsedBreakdown) ? parsedBreakdown : [];
        } catch {
          breakdown = [];
        }
      }

      normalizedObject = {
        arabic: result.arabic ?? '',
        transliteration: result.transliteration ?? '',
        definition: result.definition ?? '',
        breakdown,
        ...(result.contextualMeaning != null && result.contextualMeaning !== '' && { contextualMeaning: result.contextualMeaning })
      };
    }

    const contentString = JSON.stringify(normalizedObject);

    return json({
      message: {
        content: contentString,
        message: {
          content: contentString
        }
      }
    });

  } catch (e) {
    console.error('Definition API error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Something went wrong';
    return error(500, { message: errorMessage });
  }
}