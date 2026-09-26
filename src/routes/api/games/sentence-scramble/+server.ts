import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSentenceScrambleSchema } from '$lib/utils/gemini-schemas';
import { requireSubscriber } from '$lib/server/games/access';
import { gameErrorResponse, generateValidated, parseGameRequest } from '$lib/server/games/generate';
import {
	SENTENCES_PER_ROUND,
	sentenceScramblePrompt,
	validateSentence
} from '$lib/server/games/sentence-scramble';

/** A fresh round of Sentence Scramble. Premium only. */
export const POST: RequestHandler = async ({ request, locals }) => {
	const denied = await requireSubscriber(locals);
	if (denied) return denied;

	const { dialect, level } = parseGameRequest(await request.json().catch(() => ({})));
	const seen = new Set<string>();

	try {
		const items = await generateValidated({
			prompt: sentenceScramblePrompt(dialect, level),
			schema: createSentenceScrambleSchema(),
			items: (parsed) => parsed.sentences,
			validate: (raw) => validateSentence(raw, level, seen),
			want: SENTENCES_PER_ROUND
		});
		return json({ items });
	} catch (err) {
		return gameErrorResponse(err);
	}
};
