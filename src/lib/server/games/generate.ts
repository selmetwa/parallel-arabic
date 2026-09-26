/**
 * The shared Gemini call behind the Premium puzzle games: ask for a batch, parse
 * it, keep only the items that pass the game's own validator.
 */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import type { z } from 'zod';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { isGameDialect, type GameDialect } from '$lib/games/themes';
import { GAME_LEVELS, type GameLevel } from '$lib/games/levels';

export const LEVEL_GUIDE: Record<GameLevel, string> = {
	beginner: 'a beginner (CEFR A1–A2): very common everyday words, short simple sentences',
	intermediate: 'an intermediate learner (CEFR B1–B2): everyday topics, some less common words',
	advanced: 'an advanced learner (CEFR C1): richer vocabulary and more complex sentences'
};

/**
 * Only whitelisted values reach the prompt. Free text is not accepted, which
 * keeps the endpoints narrow and prompt injection out.
 */
export function parseGameRequest(body: unknown): { dialect: GameDialect; level: GameLevel } {
	const { dialect, level } = (body ?? {}) as { dialect?: unknown; level?: unknown };
	return {
		dialect: isGameDialect(dialect) ? dialect : 'egyptian-arabic',
		level: (GAME_LEVELS as readonly unknown[]).includes(level) ? (level as GameLevel) : 'beginner'
	};
}

export class NotEnoughItemsError extends Error {}

/** The fewest usable items worth sending back as a round. */
const MIN_ITEMS = 3;

export async function generateValidated<Parsed, Item>({
	prompt,
	schema,
	items,
	validate,
	want,
	temperature = 0.9,
	thinkingBudget = 0
}: {
	prompt: string;
	schema: { zodSchema: z.ZodSchema<Parsed>; jsonSchema: unknown };
	/** Pull the raw item list out of the parsed response. */
	items: (parsed: Parsed) => unknown[];
	/** Clean one raw item, or return null to drop it. */
	validate: (raw: unknown) => Item | null;
	/** How many items a round should have. */
	want: number;
	temperature?: number;
	/** Let the model reason first — worth it where correctness is subtle. */
	thinkingBudget?: number;
}): Promise<Item[]> {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
	const ai = new GoogleGenAI({ apiKey });

	const kept: Item[] = [];

	// One retry when too few items survive validation.
	for (let attempt = 0; attempt < 2 && kept.length < want; attempt++) {
		const response = await generateContentWithRetry(ai, {
			model: 'gemini-2.5-flash',
			contents: prompt,
			config: {
				temperature,
				maxOutputTokens: 8192 + thinkingBudget,
				thinkingConfig: { thinkingBudget },
				responseMimeType: 'application/json',
				responseJsonSchema: schema.jsonSchema
			}
		});

		const text = response.text;
		if (!text) continue;

		for (const raw of items(parseJsonFromGeminiResponse(text, schema.zodSchema))) {
			const item = validate(raw);
			if (item) kept.push(item);
			if (kept.length >= want) break;
		}
	}

	if (kept.length < MIN_ITEMS) throw new NotEnoughItemsError();
	return kept;
}

/** Map a failure to a response. User-facing copy never mentions the model. */
export function gameErrorResponse(err: unknown): Response {
	if (err instanceof GeminiApiError && err.is503) {
		return json({ error: 'Busy right now. Try again in a moment.' }, { status: 503 });
	}
	if (err instanceof NotEnoughItemsError) {
		return json({ error: "We couldn't put a round together. Try again." }, { status: 502 });
	}
	console.error('Game generation failed:', err);
	return json({ error: 'Something went wrong. Try again.' }, { status: 500 });
}
