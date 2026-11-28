import type { PageServerLoad, EntryGenerator } from './$types';
import { PHRASE_DIALECTS } from '$lib/constants/phrase-seeds';
import { TRANSLATOR_EXAMPLE_SLUGS, translatorCopy } from '$lib/constants/translator';
import { getPhrase } from '$lib/data/phrases/manifest';

// The page is static; only the translation itself runs at request time, via /api/translate.
export const prerender = true;

export const entries: EntryGenerator = () => PHRASE_DIALECTS.map((dialect) => ({ dialect }));

export const load: PageServerLoad = async ({ params }) => {
	const copy = translatorCopy(params.dialect);

	// Worked examples from the phrasebook, so every page has real, checked content.
	const examples = TRANSLATOR_EXAMPLE_SLUGS.flatMap((slug) => {
		const p = getPhrase(params.dialect, slug);
		return p ? [{ slug, english: p.english, arabic: p.arabic, transliteration: p.transliteration }] : [];
	});

	return { dialect: params.dialect, copy, examples, faqs: copy.faqs };
};
