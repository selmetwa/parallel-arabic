import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSpotTheMistakeSchema } from '$lib/utils/gemini-schemas';
import { requireSubscriber } from '$lib/server/games/access';
import { gameErrorResponse, generateValidated, parseGameRequest } from '$lib/server/games/generate';
import {
	ITEMS_PER_ROUND,
	spotTheMistakePrompt,
	validateItem
} from '$lib/server/games/spot-the-mistake';

/** A fresh round of Spot the Mistake. Premium only. */
export const POST: RequestHandler = async ({ request, locals }) => {
	const denied = await requireSubscriber(locals);
	if (denied) return denied;

	const { dialect, level } = parseGameRequest(await request.json().catch(() => ({})));
	const seen = new Set<string>();

	try {
		const items = await generateValidated({
			prompt: spotTheMistakePrompt(dialect, level),
			schema: createSpotTheMistakeSchema(),
			items: (parsed) => parsed.items,
			validate: (raw) => validateItem(raw, seen),
			want: ITEMS_PER_ROUND,
			temperature: 0.6,
			thinkingBudget: 2048
		});
		return json({ items });
	} catch (err) {
		return gameErrorResponse(err);
	}
};
