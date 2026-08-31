import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { WORD_DIALECTS, wordIndexFor } from '$lib/data/words/manifest';

export const prerender = true;

export const entries: EntryGenerator = () => WORD_DIALECTS.map((dialect) => ({ dialect }));

export const load: PageServerLoad = async ({ params }) => {
	const words = wordIndexFor(params.dialect);
	if (!words.length) throw error(404, `No word pages for "${params.dialect}" yet.`);

	return { dialect: params.dialect, words };
};
