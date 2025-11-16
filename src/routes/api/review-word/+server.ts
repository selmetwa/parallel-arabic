import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { calculateNextReview } from '$lib/helpers/spaced-repetition';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { getUserReviewCount } from '$lib/helpers/get-user-review-count';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { saved_word_id, difficulty } = await request.json();

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
      reviewCount
    }, { status: 403 });
  }

  if (!saved_word_id || !difficulty || difficulty < 1 || difficulty > 3) {
    return json({ error: 'Invalid request. saved_word_id and difficulty (1-3) required.' }, { status: 400 });
  }

  try {
    // Get current saved word data
    const { data: savedWord, error: fetchError } = await supabase
      .from('saved_word')
      .select('*')
      .eq('id', saved_word_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !savedWord) {
      return json({ error: 'Word not found' }, { status: 404 });
    }

    // Calculate next review
    const reviewResult = calculateNextReview(
      difficulty as 1 | 2 | 3,
      savedWord.ease_factor || 2.5,
      savedWord.interval_days || 0,
      savedWord.repetitions || 0
    );

    // Update saved_word with new spaced repetition data
    const { error: updateError } = await supabase
      .from('saved_word')
      .update({
        ease_factor: reviewResult.easeFactor,
        interval_days: reviewResult.intervalDays,
        repetitions: reviewResult.repetitions,
        next_review_date: reviewResult.nextReviewDate,
        last_review_date: Date.now(),
        is_learning: reviewResult.intervalDays < 30 // Consider mastered if interval > 30 days
      })
      .eq('id', saved_word_id);

    if (updateError) {
      console.error('Error updating saved word:', updateError);
      return json({ error: 'Failed to update word' }, { status: 500 });
    }

    // Create review history record
    const reviewId = uuidv4();
    const { error: reviewError } = await supabase
      .from('word_review')
      .insert({
        id: reviewId,
        saved_word_id: saved_word_id,
        user_id: userId,
        difficulty: difficulty,
        ease_factor: reviewResult.easeFactor,
        interval_days: reviewResult.intervalDays,
        repetitions: reviewResult.repetitions,
        reviewed_at: Date.now(),
        next_review_date: reviewResult.nextReviewDate,
        created_at: Date.now()
      });

    if (reviewError) {
      console.error('Error creating review record:', reviewError);
      // Don't fail the request if review history fails
    }

    return json({
      success: true,
      nextReviewDate: reviewResult.nextReviewDate,
      intervalDays: reviewResult.intervalDays,
      repetitions: reviewResult.repetitions
    });
  } catch (error) {
    console.error('Error in review-word endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

