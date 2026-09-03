import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import {
	WORD_DIALECTS,
	getWord,
	practiceWordsFor,
	relatedWords,
	wordSlugsFor
} from '$lib/data/words/manifest';

export const prerender = true;

export const entries: EntryGenerator = () =>
	WORD_DIALECTS.flatMap((dialect) => wordSlugsFor(dialect).map((word) => ({ dialect, word })));

export const load: PageServerLoad = async ({ params }) => {
	const word = getWord(params.dialect, params.word);
	if (!word) throw error(404, `Word "${params.word}" not found for ${params.dialect}.`);

	return {
		word,
		dialect: params.dialect,
		related: relatedWords(params.dialect, params.word),
		practiceWords: practiceWordsFor(params.dialect, params.word)
	};
};
