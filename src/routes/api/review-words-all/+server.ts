import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { MASTERED_STABILITY } from '$lib/srs/fsrs';

export const GET: RequestHandler = async ({ locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const now = Date.now();

  try {
    // Get all saved words for this user (paginate past the 1000-row default limit)
    const allWords: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    let fetchError = null;
    while (true) {
      const { data: page, error: pageError } = await supabase
        .from('saved_word')
        .select(`
          id,
          arabic_word,
          english_word,
          transliterated_word,
          dialect,
          fsrs_stability,
          fsrs_difficulty,
          fsrs_state,
          lapses,
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
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (pageError) { fetchError = pageError; break; }
      if (!page || page.length === 0) break;
      allWords.push(...page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (fetchError) {
      console.error('Error fetching all review words:', fetchError);
      return json({ error: 'Failed to fetch words' }, { status: 500 });
    }

    // Transform to component format and determine status
    const words = (allWords || []).map((word: any) => {
      const isNew = (word.fsrs_state ?? 0) === 0;
      const isMastered = !isNew && (word.fsrs_stability ?? 0) >= MASTERED_STABILITY;
      const isDue = !isNew && (!word.next_review_date || word.next_review_date <= now);
      const status: 'new' | 'due' | 'learning' | 'mastered' = isNew
        ? 'new'
        : isDue
          ? 'due'
          : isMastered
            ? 'mastered'
            : 'learning';

      return {
        id: word.id,
        arabic: word.arabic_word,
        english: word.english_word,
        transliteration: word.transliterated_word,
        audioUrl: word.word?.audio_url || undefined,
        dialect: word.dialect || 'egyptian-arabic',
        stability: word.fsrs_stability,
        difficulty: word.fsrs_difficulty,
        state: word.fsrs_state ?? 0,
        lapses: word.lapses ?? 0,
        reps: word.repetitions ?? 0,
        intervalDays: word.interval_days ?? 0,
        nextReviewDate: word.next_review_date,
        lastReviewDate: word.last_review_date,
        masteryLevel: word.mastery_level || 0,
        createdAt: word.created_at,
        status
      };
    });

    return json({ words });
  } catch (error) {
    console.error('Error in review-words-all endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

