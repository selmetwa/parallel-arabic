import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { createFillTheGapSchema } from '$lib/utils/gemini-schemas';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';
import { checkGameAccess } from '$lib/server/games/access';
import { gameErrorResponse, generateValidated, parseGameRequest } from '$lib/server/games/generate';
import {
	ITEMS_PER_ROUND,
	MAX_SAVED_WORDS,
	fillTheGapPrompt,
	validateItem
} from '$lib/server/games/fill-the-gap';

/** The learner's most recent saved words in this dialect, Arabic only. */
async function savedWordsFor(userId: string, dialect: string): Promise<string[]> {
	const { data, error } = await supabase
		.from('saved_word')
		.select('arabic_word')
		.eq('user_id', userId)
		.eq('dialect', dialect)
		.order('created_at', { ascending: false })
		.limit(MAX_SAVED_WORDS * 3);
	if (error || !data) return [];
	// Single words only, without tashkeel; these go into the prompt.
	const words = data
		.map((r) => stripArabicDiacritics(r.arabic_word ?? '').trim())
		.filter((w) => /^[ء-ي]{2,15}$/.test(w));
	return [...new Set(words)].slice(0, MAX_SAVED_WORDS);
}

/** A fresh round of Fill the Gap. Two free rounds, then Premium. */
export const POST: RequestHandler = async (event) => {
	const access = await checkGameAccess(event, 'fill-the-gap');
	if ('denied' in access) return access.denied;
	const { request, locals } = event;

	const body = await request.json().catch(() => ({}));
	const { dialect, level } = parseGameRequest(body);
	const userId = (locals as { user?: { id?: string } | null }).user?.id;
	const saved = body?.useSaved === true && userId ? await savedWordsFor(userId, dialect) : [];
	const seen = new Set<string>();

	try {
		const items = await generateValidated({
			prompt: fillTheGapPrompt(dialect, level, saved),
			schema: createFillTheGapSchema(),
			items: (parsed) => parsed.items,
			validate: (raw) => validateItem(raw, seen),
			want: ITEMS_PER_ROUND,
			temperature: 0.7,
			thinkingBudget: 1024
		});
		await access.charge();
		return json({ items, usedSavedWords: saved.length > 0 });
	} catch (err) {
		return gameErrorResponse(err);
	}
};
