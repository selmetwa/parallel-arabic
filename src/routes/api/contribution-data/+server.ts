import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Get the last 365 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const oneYearAgoTimestamp = oneYearAgo.getTime();

    // Fetch reviewed words grouped by date
    const { data: reviewedWords, error: reviewError } = await supabase
      .from('word_review')
      .select('reviewed_at')
      .eq('user_id', userId)
      .gte('reviewed_at', oneYearAgoTimestamp);

    // Fetch saved words grouped by date
    const { data: savedWords, error: savedError } = await supabase
      .from('saved_word')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneYearAgoTimestamp);

    if (reviewError || savedError) {
      console.error('Error fetching contribution data:', reviewError || savedError);
      return json({ error: 'Failed to fetch contribution data' }, { status: 500 });
    }

    // Group by date (YYYY-MM-DD format)
    const reviewedByDate: Record<string, number> = {};
    const savedByDate: Record<string, number> = {};

    (reviewedWords || []).forEach((review) => {
      const date = new Date(review.reviewed_at);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      reviewedByDate[dateKey] = (reviewedByDate[dateKey] || 0) + 1;
    });

    (savedWords || []).forEach((saved) => {
      const date = new Date(saved.created_at);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      savedByDate[dateKey] = (savedByDate[dateKey] || 0) + 1;
    });

    // Get total counts
    const totalReviewed = reviewedWords?.length || 0;
    const totalSaved = savedWords?.length || 0;

    // Get sentences viewed (from user table)
    const { data: userData } = await supabase
      .from('user')
      .select('sentences_viewed')
      .eq('id', userId)
      .single();

    const totalSentencesViewed = userData?.sentences_viewed || 0;

    return json({
      reviewedByDate,
      savedByDate,
      totalReviewed,
      totalSaved,
      totalSentencesViewed
    });
  } catch (error) {
    console.error('Error in contribution-data endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

