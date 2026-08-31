import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { PHRASE_DIALECTS } from '$lib/constants/phrase-seeds';
import { getPhrase, phraseSlugsFor } from '$lib/data/phrases/manifest';

export const prerender = true;

// Only the files the generator actually produced — a missing dialect/phrase
// combination should 404, not fail the build.
export const entries: EntryGenerator = () =>
	PHRASE_DIALECTS.flatMap((dialect) =>
		phraseSlugsFor(dialect).map((phrase) => ({ dialect, phrase }))
	);

export const load: PageServerLoad = async ({ params }) => {
	const phrase = getPhrase(params.dialect, params.phrase);
	if (!phrase) throw error(404, `Phrase "${params.phrase}" not found for ${params.dialect}.`);

	// The same phrase in the other dialects — the cross-links are half the value.
	const otherDialects = PHRASE_DIALECTS.filter((d) => d !== params.dialect).flatMap((dialect) => {
		const entry = getPhrase(dialect, params.phrase);
		if (!entry) return [];
		return [{ dialect, arabic: entry.arabic, transliteration: entry.transliteration }];
	});

	return { phrase, dialect: params.dialect, otherDialects };
};
