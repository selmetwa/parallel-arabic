import type { PageServerLoad } from './$types';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

// Type for the new API response format
interface ApiWordResponse {
	english: string;
	arabic: string;
	transliteration: string;
	audioUrl?: string;
}

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get subscription status from layout (no DB query needed!)
	const { isSubscribed } = await parent();
	
	const section = params.section;
	
	// Use the new API format: /vocab/darija/{section}
	const apiUrl = `${API_URL}/vocab/darija/${section}`;
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
		section,
		isSubscribed  // Pass subscription status
	};
};
