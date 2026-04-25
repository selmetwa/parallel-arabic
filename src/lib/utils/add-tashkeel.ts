import type { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { generateContentWithRetry } from './gemini-api-retry';

const TASHKEEL_REGEX = /[ً-ٟؐ-ؚۖ-ۜ۟-۪ۤۧۨ-ۭ]/g;

export function hasTashkeelDiacritics(text: string): boolean {
	return TASHKEEL_REGEX.test(text);
}

function stripTashkeel(text: string): string {
	return text.replace(TASHKEEL_REGEX, '');
}

function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

const tashkeelResponseSchema = z.object({
	sentences: z.array(z.string())
});

/**
 * Add tashkeel to a batch of Arabic sentences via a dedicated Gemini call.
 * Returns null for any sentence where the result is missing, has no diacritics,
 * or has a word count mismatch — callers should keep their original value in that case.
 */
export async function addTashkeelToSentences(
	arabicSentences: string[],
	ai: GoogleGenAI
): Promise<(string | null)[]> {
	if (arabicSentences.length === 0) return [];

	const prompt = `You are an Arabic linguistics expert. Add full tashkeel (diacritical marks: fathah ـَ, kasrah ـِ, dammah ـُ, sukoon ـْ, shadda ـّ, tanwin) to each Arabic sentence below.

CRITICAL RULES:
1. Do NOT add, remove, or reorder any words in any sentence
2. Do NOT change any word's spelling — only add diacritical marks above or below the letters
3. Return exactly ${arabicSentences.length} sentences in the "sentences" array, in the same order
4. Every word in the output must contain diacritical marks

Sentences:
${arabicSentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

	try {
		const response = await generateContentWithRetry(ai, {
			model: 'gemini-2.5-flash',
			contents: prompt,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.1,
				maxOutputTokens: 4000,
				responseMimeType: 'application/json',
				responseJsonSchema: zodToJsonSchema(tashkeelResponseSchema)
			}
		});

		const result = response.text;
		if (!result) {
			console.error('[addTashkeel] Empty response from Gemini');
			return arabicSentences.map(() => null);
		}

		const parsed = JSON.parse(result) as { sentences: string[] };
		if (!Array.isArray(parsed.sentences)) {
			console.error('[addTashkeel] Response missing sentences array:', result.substring(0, 200));
			return arabicSentences.map(() => null);
		}

		if (parsed.sentences.length !== arabicSentences.length) {
			console.warn(
				`[addTashkeel] Length mismatch: expected ${arabicSentences.length}, got ${parsed.sentences.length}`
			);
		}

		return arabicSentences.map((original, i) => {
			const tashkeelText = parsed.sentences[i];
			if (!tashkeelText) return null;

			if (!hasTashkeelDiacritics(tashkeelText)) {
				console.warn(`[addTashkeel] No diacritics in sentence ${i}: "${tashkeelText}"`);
				return null;
			}

			const originalWordCount = wordCount(stripTashkeel(original));
			const resultWordCount = wordCount(stripTashkeel(tashkeelText));
			if (Math.abs(originalWordCount - resultWordCount) > 1) {
				console.warn(
					`[addTashkeel] Word count mismatch for sentence ${i}: ${originalWordCount} vs ${resultWordCount}`
				);
				return null;
			}

			return tashkeelText;
		});
	} catch (err) {
		console.error('[addTashkeel] Failed:', err);
		return arabicSentences.map(() => null);
	}
}
