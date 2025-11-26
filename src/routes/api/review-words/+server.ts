import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { getUserReviewCount } from '$lib/helpers/get-user-review-count';

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
    // First, get total count of all saved words for this user
    const { count: totalSavedWordsCount, error: countError } = await supabase
      .from('saved_word')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting saved words:', countError);
    }

    // Get words due for review
    // Priority: learning words first, then words due for review
    // Exclude words marked as forgotten_in_session (they'll be returned separately)
    const { data: wordsDue, error } = await supabase
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
        forgotten_in_session,
        word_id,
        word:word_id (
          audio_url
        )
      `)
      .eq('user_id', userId)
      .eq('forgotten_in_session', false) // Exclude forgotten words from regular list
      .or(`is_learning.eq.true,next_review_date.is.null,next_review_date.lte.${now}`)
      .order('is_learning', { ascending: false })
      .order('next_review_date', { ascending: true, nullsFirst: true })
      .limit(20); // Limit to 20 words per session
    
    // Get forgotten words separately
    const { data: forgottenWordsDue, error: forgottenError } = await supabase
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
        forgotten_in_session,
        word_id,
        word:word_id (
          audio_url
        )
      `)
      .eq('user_id', userId)
      .eq('forgotten_in_session', true);
    
    if (forgottenError) {
      console.error('Error fetching forgotten words:', forgottenError);
    }

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
      dialect: word.dialect || 'egyptian-arabic', // Use dialect from saved_word table
      easeFactor: word.ease_factor,
      intervalDays: word.interval_days,
      repetitions: word.repetitions,
      nextReviewDate: word.next_review_date,
      lastReviewDate: word.last_review_date,
      isLearning: word.is_learning
    }));

    // Transform forgotten words to component format
    const forgottenWords = (forgottenWordsDue || []).map((word: any) => ({
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
      isLearning: word.is_learning
    }));

    return json({ 
      words,
      forgottenWords,
      reviewCount,
      hasActiveSubscription,
      remainingFreeReviews: hasActiveSubscription ? null : Math.max(0, 5 - reviewCount),
      totalSavedWordsCount: totalSavedWordsCount || 0
    });
  } catch (error) {
    console.error('Error in review-words endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

