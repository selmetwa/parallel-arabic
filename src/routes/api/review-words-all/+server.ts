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
    // Get all saved words for this user
    const { data: allWords, error } = await supabase
      .from('saved_word')
      .select(`
        id,
        arabic_word,
        english_word,
        transliterated_word,
        dialect,
        ease_factor,
        interval_days,
        repetitions,
        next_review_date,
        last_review_date,
        is_learning,
        mastery_level,
        created_at,
        word_id,
        word:word_id (
          audio_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

      console.log('allWords', allWords);
    if (error) {
      console.error('Error fetching all review words:', error);
      return json({ error: 'Failed to fetch words' }, { status: 500 });
    }

    // Transform to component format and determine status
    const words = (allWords || []).map((word: any) => {
      let status: 'learning' | 'due' | 'scheduled' | 'mastered' = 'learning';
      let statusLabel = 'Learning';
      
      if (word.is_learning) {
        status = 'learning';
        statusLabel = 'Learning';
      } else if (!word.next_review_date || word.next_review_date <= now) {
        status = 'due';
        statusLabel = 'Due for Review';
      } else if (word.interval_days >= 30) {
        status = 'mastered';
        statusLabel = 'Mastered';
      } else {
        status = 'scheduled';
        const daysUntil = Math.ceil((word.next_review_date - now) / (1000 * 60 * 60 * 24));
        statusLabel = `Review in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
      }

      return {
        id: word.id,
        arabic: word.arabic_word,
        english: word.english_word,
        transliteration: word.transliterated_word,
        audioUrl: word.word?.audio_url || undefined,
        dialect: word.dialect || 'egyptian-arabic',
        easeFactor: word.ease_factor,
        intervalDays: word.interval_days,
        repetitions: word.repetitions,
        nextReviewDate: word.next_review_date,
        lastReviewDate: word.last_review_date,
        isLearning: word.is_learning,
        masteryLevel: word.mastery_level || 0,
        createdAt: word.created_at,
        status,
        statusLabel
      };
    });

    console.log('words', words);
    return json({ words });
  } catch (error) {
    console.error('Error in review-words-all endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

