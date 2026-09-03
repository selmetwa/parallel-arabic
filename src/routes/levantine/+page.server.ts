import type { PageServerLoad } from './$types';
import { phraseIndexFor, phraseSlugsFor } from '$lib/data/phrases/manifest';
import { PHRASE_SEEDS } from '$lib/constants/phrase-seeds';
import { wordSlugsFor } from '$lib/data/words/manifest';
import { DIALECT_LANDING } from '$lib/constants/dialect-landing';

export const load: PageServerLoad = () => ({
	hasPhrases: phraseSlugsFor('levantine').length > 0,
	hasWords: wordSlugsFor('levantine').length > 0,
	// Surfaced so the layout can emit FAQPage structured data.
	faqs: DIALECT_LANDING['levantine'].faqs,
	// The phrasebook doubles as the practice set for the landing page.
	practiceWords: phraseIndexFor(
		'levantine',
		PHRASE_SEEDS.map((seed) => seed.slug)
	).map((phrase) => ({
		arabic: phrase.arabic,
		english: phrase.english,
		transliteration: phrase.transliteration
	}))
});
