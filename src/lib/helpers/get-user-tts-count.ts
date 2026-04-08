import { supabase } from '$lib/supabaseClient';

/**
 * Get the total count of TTS calls a free user has made
 * @param userId - The user ID
 * @returns The number of TTS calls the user has made
 */
export const getUserTtsCount = async (userId: string | null): Promise<number> => {
	if (!userId) return 0;

	try {
		const { data, error } = await supabase
			.from('user')
			.select('tts_calls_count')
			.eq('id', userId)
			.single();

		if (error) {
			console.error('Error fetching user TTS count:', error);
			return 0;
		}

		return data?.tts_calls_count ?? 0;
	} catch (error) {
		console.error('Error in getUserTtsCount:', error);
		return 0;
	}
};
