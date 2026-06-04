import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';
import { textWithTranslationSchema } from '$lib/utils/gemini-schemas';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { zodToJsonSchema } from 'zod-to-json-schema';

const DIALECT_NAMES: Record<string, string> = {
	'egyptian-arabic': 'Egyptian Arabic (colloquial, not MSA)',
	fusha: 'Modern Standard Arabic (Fusha)',
	levantine: 'Levantine Arabic',
	darija: 'Moroccan Darija'
};

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) {
		return error(500, { message: 'GEMINI_API_KEY is not configured' });
	}

	const ai = new GoogleGenAI({ apiKey });

	const { form, english, dialect } = await request.json();

	if (!form || typeof form !== 'string') {
		return error(400, { message: 'A conjugated verb form is required' });
	}

	const dialectName = DIALECT_NAMES[dialect] ?? DIALECT_NAMES['egyptian-arabic'];
	const jsonSchema = zodToJsonSchema(textWithTranslationSchema);

	const prompt = `Write ONE short, natural, beginner-friendly everyday sentence in ${dialectName} that
uses the exact conjugated verb form "${form}"${english ? ` (meaning "${english}")` : ''}. The sentence
must keep this verb form unchanged (same person, tense, and affirmative/negative).

Return JSON with:
- arabic: the sentence in Arabic script
- transliteration: ASCII romanization (use 3 for ع, 7 for ح, gh for غ, kh for خ, sh for ش; no accents/diacritics)
- english: the English translation

CRITICAL: Return a valid JSON object exactly matching this schema:
${JSON.stringify(jsonSchema, null, 2)}

Return PURE JSON only. No markdown code blocks. No explanations.`;

	try {
		const response = await generateContentWithRetry(ai, {
			model: 'gemini-2.5-flash',
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				responseJsonSchema: jsonSchema
			}
		});

		const parsed = parseJsonFromGeminiResponse(response.text || '{}', textWithTranslationSchema);
		return json(parsed);
	} catch (e) {
		if (e instanceof GeminiApiError && e.is503) {
			return error(503, { message: 'The AI model is currently overloaded. Please try again.' });
		}
		console.error('Error generating conjugation example:', e);
		const message = e instanceof Error ? e.message : 'Failed to generate example sentence.';
		return error(500, { message });
	}
};
