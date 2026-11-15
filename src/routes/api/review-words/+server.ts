import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { getUserReviewCount } from '$lib/helpers/get-user-review-count';
import type { ReviewWord } from '$lib/srs/fsrs';

const DAY_MS = 24 * 60 * 60 * 1000;

const WORD_COLUMNS = `
  id,
  arabic_word,
  english_word,
  transliterated_word,
  dialect,
  fsrs_stability,
  fsrs_difficulty,
  fsrs_state,
  lapses,
  repetitions,
  interval_days,
  next_review_date,
  last_review_date,
  word:word_id (
    audio_url
  )
`;

function toReviewWord(word: any): ReviewWord {
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
    lastReviewDate: word.last_review_date
  };
}

export const GET: RequestHandler = async ({ locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // Check paywall: allow free users up to 5 reviews, then require subscription
  const [hasActiveSubscription, reviewCount] = await Promise.all([
    getUserHasActiveSubscription(userId),
    getUserReviewCount(userId)
  ]);

  if (!hasActiveSubscription && reviewCount >= 5) {
    return json({
      error: 'Subscription required',
      message: 'You\'ve reached the free limit of 5 word reviews. Please subscribe to continue using spaced repetition.',
      requiresSubscription: true,
      reviewCount,
      words: []
    }, { status: 403 });
  }

  const now = Date.now();

  try {
    const [{ data: userData }, totalRes, dueCountRes, newCountRes, upcomingRes] = await Promise.all([
      supabase.from('user').select('daily_review_limit').eq('id', userId).single(),
      supabase.from('saved_word').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('saved_word')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('fsrs_state', 0)
        .lte('next_review_date', now),
      supabase
        .from('saved_word')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('fsrs_state', 0),
      supabase
        .from('saved_word')
        .select('next_review_date')
        .eq('user_id', userId)
        .gt('next_review_date', now)
        .lte('next_review_date', now + 7 * DAY_MS)
    ]);

    const limit = userData?.daily_review_limit || 20;

    // Words already learned come first, most overdue first; new words fill the rest of the session.
    const { data: dueWords, error } = await supabase
      .from('saved_word')
      .select(WORD_COLUMNS)
      .eq('user_id', userId)
      .neq('fsrs_state', 0)
      .lte('next_review_date', now)
      .order('next_review_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching review words:', error);
      return json({ error: 'Failed to fetch words' }, { status: 500 });
    }

    let newWords: any[] = [];
    const room = limit - (dueWords?.length ?? 0);
    if (room > 0) {
      const { data, error: newError } = await supabase
        .from('saved_word')
        .select(WORD_COLUMNS)
        .eq('user_id', userId)
        .eq('fsrs_state', 0)
        .order('created_at', { ascending: true })
        .limit(room);
      if (newError) console.error('Error fetching new words:', newError);
      newWords = data ?? [];
    }

    // Reviews coming up on each of the next 7 days (index 0 = tomorrow).
    const forecast = Array.from({ length: 7 }, () => 0);
    for (const row of upcomingRes.data ?? []) {
      const day = Math.min(6, Math.max(0, Math.ceil((row.next_review_date - now) / DAY_MS) - 1));
      forecast[day]++;
    }

    return json({
      words: [...(dueWords ?? []), ...newWords].map(toReviewWord),
      counts: { due: dueCountRes.count ?? 0, new: newCountRes.count ?? 0 },
      forecast,
      reviewCount,
      hasActiveSubscription,
      remainingFreeReviews: hasActiveSubscription ? null : Math.max(0, 5 - reviewCount),
      totalSavedWordsCount: totalRes.count ?? 0
    });
  } catch (error) {
    console.error('Error in review-words endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
