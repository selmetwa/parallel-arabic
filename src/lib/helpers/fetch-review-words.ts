/**
 * Fetches the signed-in user's review words (via the server, which uses the session user)
 * @param source - 'all' to fetch all saved words, 'due-for-review' to fetch only words due for review
 * @returns Array of words with arabic, english, and transliteration
 */
export async function fetchUserReviewWords(
	source: 'all' | 'due-for-review'
): Promise<Array<{ arabic: string; english: string; transliteration: string }>> {
	try {
		const res = await fetch(`/api/review-words-list?source=${source}`);
		if (!res.ok) {
			console.error('Error fetching review words:', res.status);
			return [];
		}
		const { words: data }: {
			words: Array<{ arabic_word: string | null; english_word: string | null; transliterated_word: string | null }>;
		} = await res.json();

		if (!data || data.length === 0) {
			return [];
		}

		// Format and filter out any invalid entries
		// Require at least arabic and english; transliteration is optional but preferred
		return data
			.map((word) => ({
				arabic: word.arabic_word?.trim() || '',
				english: word.english_word?.trim() || '',
				transliteration: word.transliterated_word?.trim() || word.arabic_word?.trim() || '' // Fallback to arabic if no transliteration
			}))
			.filter((word) => word.arabic && word.english); // Only require arabic and english
	} catch (error) {
		console.error('Exception fetching review words:', error);
		return [];
	}
}

