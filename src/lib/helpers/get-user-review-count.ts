import { supabase } from '$lib/supabaseClient';

/**
 * Get the total count of reviews a user has completed
 * @param userId - The user ID
 * @returns The number of reviews the user has completed
 */
export const getUserReviewCount = async (userId: string | null): Promise<number> => {
  if (!userId) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('word_review')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user review count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUserReviewCount:', error);
    return 0;
  }
};

