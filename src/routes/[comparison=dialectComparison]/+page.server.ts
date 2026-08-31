import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import {
	COMPARISON_SLUGS,
	CONTRAST_DIMENSIONS,
	DIALECT_CONTRASTS,
	findComparison
} from '$lib/constants/dialect-comparisons';
import { PHRASE_SEEDS } from '$lib/constants/phrase-seeds';
import { getPhrase } from '$lib/data/phrases/manifest';

export const prerender = true;

export const entries: EntryGenerator = () =>
	COMPARISON_SLUGS.map((comparison) => ({ comparison }));

export const load: PageServerLoad = async ({ params }) => {
	const pair = findComparison(params.comparison);
	if (!pair) throw error(404, 'Unknown dialect comparison');

	const rows = CONTRAST_DIMENSIONS.map((dimension) => ({
		label: dimension.label,
		a: DIALECT_CONTRASTS[pair.a][dimension.key],
		b: DIALECT_CONTRASTS[pair.b][dimension.key]
	}));

	// Side-by-side phrases, drawn from whatever the phrasebook actually has for
	// both dialects, so the table never shows a half-empty row.
	const phrases = PHRASE_SEEDS.map((seed) => {
		const a = getPhrase(pair.a, seed.slug);
		const b = getPhrase(pair.b, seed.slug);
		if (!a || !b) return null;
		return {
			slug: seed.slug,
			english: seed.english,
			a: { arabic: a.arabicPlain || a.arabic, transliteration: a.transliteration },
			b: { arabic: b.arabicPlain || b.arabic, transliteration: b.transliteration }
		};
	})
		.filter((row): row is NonNullable<typeof row> => row !== null)
		.slice(0, 12);

	return { pair, rows, phrases };
};
