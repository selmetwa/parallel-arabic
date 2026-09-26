import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOddOneOutSchema } from '$lib/utils/gemini-schemas';
import { checkGameAccess } from '$lib/server/games/access';
import { gameErrorResponse, generateValidated, parseGameRequest } from '$lib/server/games/generate';
import {
	oddOneOutPrompt,
	PUZZLES_PER_ROUND,
	sortByDifficulty,
	validatePuzzle
} from '$lib/server/games/odd-one-out';

/** A fresh round of Odd One Out. Two free rounds, then Premium. */
export const POST: RequestHandler = async (event) => {
	const access = await checkGameAccess(event, 'odd-one-out');
	if ('denied' in access) return access.denied;
	const { request } = event;

	const { dialect, level } = parseGameRequest(await request.json().catch(() => ({})));
	const seen = new Set<string>();

	try {
		const items = await generateValidated({
			prompt: oddOneOutPrompt(dialect, level),
			schema: createOddOneOutSchema(),
			items: (parsed) => parsed.puzzles,
			validate: (raw) => validatePuzzle(raw, seen),
			want: PUZZLES_PER_ROUND,
			temperature: 0.7,
			// Roots and gender are easy to get subtly wrong without a moment's thought.
			thinkingBudget: 2048
		});
		await access.charge();
		return json({ items: sortByDifficulty(items) });
	} catch (err) {
		return gameErrorResponse(err);
	}
};
