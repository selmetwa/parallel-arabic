import type { PageServerLoad } from './$types';
import { commonWords } from '$lib/constants/common-words';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

// Type for the new API response format
interface ApiWordResponse {
	english: string;
	arabic: string;
	transliteration: string;
	audioUrl?: string;
}

export const load: PageServerLoad = async ({ params }) => {
	// Handle special case: most_common uses local data
	if (params.section === 'most_common') {
		const _words = commonWords.map(
			(word) => ({
				english: word.en,
				arabic: word.word,
				transliteration: word.franco,
				audioUrl: undefined
			})
		);
		return {
			words: _words,
			section: 'most_common'
		};
	}

	const section = params.section;
	
	// All other sections use the new API format: /vocab/egyptian/{section}
	const apiUrl = `${API_URL}/vocab/egyptian/${section}`;
	const response = await fetch(apiUrl);
	const json: ApiWordResponse[] = await response.json();

	// The API already returns the correct format, just ensure audioUrl is defined
	const transformedWords = json.map((word) => ({
		english: word.english,
		arabic: word.arabic,
		transliteration: word.transliteration,
		audioUrl: word.audioUrl || undefined
	}));

	return {
		words: transformedWords.slice(1, transformedWords.length - 1),
		section
	};
};
