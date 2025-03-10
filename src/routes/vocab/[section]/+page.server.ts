import type { PageServerLoad } from './$types';
import { commonWords } from '$lib/constants/common-words';
const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

export const load: PageServerLoad = async ({ params }) => {
  if (params.section === 'most_common') {
		const _words = commonWords.map(
			(word) => ({
				english: word.en,
				egyptianArabic: word.word,
				standardArabic: word.word,
				standardArabicTransliteration: word.franco,
				egyptianArabicTransliteration: word.franco
			})
		);
		return {
			words: _words,
			section: 'most_common'
		};
	}

  const section = params.section;
  const response = await fetch(`${API_URL}/vocab/${section}`);
  const json = await response.json();

  return {
    words: json,
    section
  };
};
