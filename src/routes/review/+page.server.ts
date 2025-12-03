import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ parent }) => {
  const { session, user } = await parent();

  if (!session || !user) {
    throw redirect(302, '/login');
  }

  const userId = user.id;
  const now = Date.now();
  let wordsDueForReviewCount = 0;
  let totalSavedWordsCount = 0;
  let dailyReviewLimit = 20;

  try {
    // Get user's daily review limit
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('daily_review_limit')
      .eq('id', userId)
      .single();

    if (!userError && userData?.daily_review_limit) {
      dailyReviewLimit = userData.daily_review_limit;
    }

    // Get total count of saved words
    const { count: totalCount, error: countError } = await supabase
      .from('saved_word')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!countError && totalCount !== null) {
      totalSavedWordsCount = totalCount;
    }

    // Get count of words due for review
    const { count: dueCount, error: dueError } = await supabase
      .from('saved_word')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('forgotten_in_session', false)
      .or(`is_learning.eq.true,next_review_date.is.null,next_review_date.lte.${now}`);

    if (!dueError && dueCount !== null) {
      wordsDueForReviewCount = dueCount;
    }
  } catch (error) {
    console.error('Error fetching word counts:', error);
  }

  // Calculate capped count based on daily review limit
  const cappedReviewCount = Math.min(wordsDueForReviewCount, dailyReviewLimit);

  return {
    session,
    user,
    wordsDueForReviewCount,
    cappedReviewCount, // Capped to daily limit
    totalSavedWordsCount
  };
};

