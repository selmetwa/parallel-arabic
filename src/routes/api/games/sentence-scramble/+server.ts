import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSentenceScrambleSchema } from '$lib/utils/gemini-schemas';
import { checkGameAccess } from '$lib/server/games/access';
import { gameErrorResponse, generateValidated, parseGameRequest } from '$lib/server/games/generate';
import {
	SENTENCES_PER_ROUND,
	sentenceScramblePrompt,
	validateSentence
} from '$lib/server/games/sentence-scramble';

/** A fresh round of Sentence Scramble. Two free rounds, then Premium. */
export const POST: RequestHandler = async (event) => {
	const access = await checkGameAccess(event, 'sentence-scramble');
	if ('denied' in access) return access.denied;
	const { request } = event;

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
		await access.charge();
		return json({ items });
	} catch (err) {
		return gameErrorResponse(err);
	}
};
