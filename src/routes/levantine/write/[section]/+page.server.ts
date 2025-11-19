import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get subscription status from layout (no DB query needed!)
	const { isSubscribed } = await parent();
	
	const section = params.section;
	const dialect = 'levantine';

	// Query words from database
	// Sort by frequency (highest first) for proper ordering
	const { data: words, error } = await supabase
		.from('word')
		.select('arabic_word, english_word, transliterated_word, audio_url, frequency')
		.eq('dialect', dialect)
		.eq('category', section)
		.order('frequency', { ascending: false, nullsFirst: false });

	if (error) {
		console.error('Error fetching words from database:', error);
		// Fallback to empty array if query fails
		return {
			words: [],
			section,
			isSubscribed
		};
	}

	// Transform database format to component format
	const transformedWords = (words || []).map((word) => ({
		english: word.english_word,
		arabic: word.arabic_word,
		transliteration: word.transliterated_word,
		audioUrl: word.audio_url || undefined
	}));

	return {
		words: transformedWords,
		section,
		isSubscribed
	};
};

