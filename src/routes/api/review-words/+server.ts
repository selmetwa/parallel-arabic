import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const now = Date.now();

  try {
    // Get words due for review
    // Priority: learning words first, then words due for review
    const { data: wordsDue, error } = await supabase
      .from('saved_word')
      .select(`
        id,
        arabic_word,
        english_word,
        transliterated_word,
        ease_factor,
        interval_days,
        repetitions,
        next_review_date,
        last_review_date,
        is_learning,
        word_id,
        word:word_id (
          audio_url,
          dialect
        )
      `)
      .eq('user_id', userId)
      .or(`is_learning.eq.true,next_review_date.is.null,next_review_date.lte.${now}`)
      .order('is_learning', { ascending: false })
      .order('next_review_date', { ascending: true, nullsFirst: true })
      .limit(20); // Limit to 20 words per session

    if (error) {
      console.error('Error fetching review words:', error);
      return json({ error: 'Failed to fetch words' }, { status: 500 });
    }

    // Transform to component format
    const words = (wordsDue || []).map((word: any) => ({
      id: word.id,
      arabic: word.arabic_word,
      english: word.english_word,
      transliteration: word.transliterated_word,
      audioUrl: word.word?.audio_url || undefined,
      dialect: word.word?.dialect || 'egyptian-arabic',
      easeFactor: word.ease_factor,
      intervalDays: word.interval_days,
      repetitions: word.repetitions,
      nextReviewDate: word.next_review_date,
      lastReviewDate: word.last_review_date,
      isLearning: word.is_learning
    }));

    return json({ words });
  } catch (error) {
    console.error('Error in review-words endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

