import type { PageServerLoad } from './$types';
import { phraseSlugsFor } from '$lib/data/phrases/manifest';
import { wordSlugsFor } from '$lib/data/words/manifest';
import { DIALECT_LANDING } from '$lib/constants/dialect-landing';

export const load: PageServerLoad = () => ({
  hasPhrases: phraseSlugsFor('levantine').length > 0,
  hasWords: wordSlugsFor('levantine').length > 0,
  // Surfaced so the layout can emit FAQPage structured data.
  faqs: DIALECT_LANDING['levantine'].faqs
});
