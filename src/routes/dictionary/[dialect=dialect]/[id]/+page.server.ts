import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDictionaryWord } from '$lib/server/dictionary';
import { formatDialectName } from '$lib/utils/seo';

export const load: PageServerLoad = async ({ params }) => {
	const word = await getDictionaryWord(params.dialect, params.id);
	if (!word) throw error(404, 'Word not found');

	const dialectName = formatDialectName(params.dialect);
	return {
		dialect: params.dialect,
		word,
		seo: {
			title: `${word.english} in ${dialectName}: ${word.arabic} | Parallel Arabic Dictionary`,
			description: `How to say "${word.english}" in ${dialectName}: ${word.arabic} (${word.transliteration}), with audio, grammar and example sentences.`
		}
	};
};
