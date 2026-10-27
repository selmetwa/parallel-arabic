import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isDialect } from '$lib/constants/dialects';
import { getDictionaryDetails, getDictionaryWord } from '$lib/server/dictionary';

// A dictionary entry's grammar details. Slow only the first time a word is
// opened, while they're generated; cached in word_details after that.
export const GET: RequestHandler = async ({ params }) => {
	if (!isDialect(params.dialect)) throw error(404, 'Unknown dialect');
	const word = await getDictionaryWord(params.dialect, params.id);
	if (!word) throw error(404, 'Word not found');

	try {
		return json(await getDictionaryDetails(params.dialect, word));
	} catch (e) {
		console.error('[dictionary] details failed:', e);
		throw error(502, 'Could not load the details for this word');
	}
};
