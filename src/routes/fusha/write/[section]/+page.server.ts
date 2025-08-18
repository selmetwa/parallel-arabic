import type { PageServerLoad } from './$types';
import { fetchVocabularyData } from '$lib/utils/dialect-api';

export const load: PageServerLoad = async ({ params }) => {
  const section = params.section;
  
  // Fetch vocabulary data for Fusha dialect
  const words = await fetchVocabularyData('fusha', section);

  return {
    words: words.slice(1, words.length - 1),
    section,
    dialect: 'fusha'
  };
};
