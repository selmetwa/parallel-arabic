import { supabase } from '$lib/supabaseClient';

/**
 * Fetches user's review words from the database
 * @param userId - The user's ID
 * @param source - 'all' to fetch all saved words, 'due-for-review' to fetch only words due for review
 * @returns Array of words with arabic, english, and transliteration
 */
export async function fetchUserReviewWords(
	userId: string,
	source: 'all' | 'due-for-review'
): Promise<Array<{ arabic: string; english: string; transliteration: string }>> {
	try {
		let query = supabase
			.from('saved_word')
			.select('arabic_word, english_word, transliterated_word')
			.eq('user_id', userId);

		// If fetching only words due for review, add the same filter logic as review-words endpoint
		if (source === 'due-for-review') {
			const now = Date.now();
			query = query.or(`is_learning.eq.true,next_review_date.is.null,next_review_date.lte.${now}`);
		}

		const { data, error } = await query.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching review words:', error);
			return [];
		}

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

