import type { PageServerLoad } from './$types';
import {
	categoryLabel,
	dictionaryCategories,
	searchDictionary,
	wordsInCategory
} from '$lib/server/dictionary';
import { formatDialectName } from '$lib/utils/seo';

export const load: PageServerLoad = async ({ params, url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const category = url.searchParams.get('category') ?? '';

	const [categories, results] = await Promise.all([
		dictionaryCategories(params.dialect),
		q
			? searchDictionary(params.dialect, q)
			: category
				? wordsInCategory(params.dialect, category)
				: Promise.resolve([])
	]);

	const dialectName = formatDialectName(params.dialect);
	return {
		dialect: params.dialect,
		q,
		category,
		categories: categories.map((c) => ({ value: c, label: categoryLabel(c) })),
		results,
		seo: {
			title: `${dialectName} Dictionary - English to Arabic with Audio | Parallel Arabic`,
			description: `Look up any word in ${dialectName}: search in English, Arabic or transliteration, with gender, plurals, roots, audio and example sentences.`,
			// Search and category result pages are thin duplicates of the dictionary itself.
			noindex: Boolean(q || category)
		}
	};
};
