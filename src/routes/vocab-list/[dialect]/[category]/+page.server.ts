import { sections } from '$lib/constants/sections';
import { fushaSections } from '$lib/constants/fusha-sections';
import { levantineSections } from '$lib/constants/levantine-sections';
import { darijaSections } from '$lib/constants/darija-sections';
import { supabase } from '$lib/supabaseClient';
import type { PageServerLoad } from './$types';

export const prerender = true;

const DIALECT_SECTIONS: Record<string, { name: string; path: string }[]> = {
	'egyptian-arabic': sections,
	fusha: fushaSections,
	levantine: levantineSections,
	darija: darijaSections
};

const DIALECT_NAMES: Record<string, string> = {
	'egyptian-arabic': 'Egyptian Arabic',
	fusha: 'Modern Standard Arabic',
	levantine: 'Levantine Arabic',
	darija: 'Moroccan Darija'
};

export async function entries() {
	const result: { dialect: string; category: string }[] = [];
	for (const [dialect, cats] of Object.entries(DIALECT_SECTIONS)) {
		for (const cat of cats) {
			if (cat.path === 'all') continue;
			result.push({ dialect, category: cat.path });
		}
	}
	return result;
}

const PAGE_SIZE = 1000;

const PAGINATED_CATEGORIES: Record<string, { dbCategory: string; page: number }> = {
	most_common: { dbCategory: 'most_common', page: 0 },
	most_common_2: { dbCategory: 'most_common', page: 1 }
};

export const load: PageServerLoad = async ({ params }) => {
	const { dialect, category } = params;

	const dialectSections = DIALECT_SECTIONS[dialect] ?? [];
	const section = dialectSections.find((s) => s.path === category);
	const categoryName = section?.name ?? category.replace(/_/g, ' ');
	const dialectName = DIALECT_NAMES[dialect] ?? dialect;

	const pagination = PAGINATED_CATEGORIES[category];
	const dbCategory = pagination?.dbCategory ?? category;

	let query = supabase
		.from('word')
		.select('arabic_word, english_word, transliterated_word')
		.eq('dialect', dialect)
		.eq('category', dbCategory)
		.order('frequency', { ascending: false });

	if (pagination) {
		const from = pagination.page * PAGE_SIZE;
		const to = from + PAGE_SIZE - 1;
		query = query.range(from, to);
	}

	const { data: words } = await query;

	return {
		words: words ?? [],
		dialect,
		dialectName,
		category,
		categoryName
	};
};
