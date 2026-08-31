import type { PageServerLoad } from './$types';
import { phraseSlugsFor } from '$lib/data/phrases/manifest';
import { DIALECT_LANDING } from '$lib/constants/dialect-landing';

export const load: PageServerLoad = () => ({
  hasPhrases: phraseSlugsFor('fusha').length > 0,
  // Surfaced so the layout can emit FAQPage structured data.
  faqs: DIALECT_LANDING['fusha'].faqs
});
