import { StripeService } from "$lib/services/stripe.service";
import { redirect, fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { supabase } from "$lib/supabaseClient";

import type { PageServerLoad } from "./$types";

export interface ActivitySuggestion {
  id: string;
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  variant: 'blue' | 'green' | 'purple' | 'amber' | 'rose';
  priority: number;
}

/**
 * Home page load
 *
 * Check the current status of the subscription and return to the page so adjust
 * the options as necessary.
 *
 */
export const load: PageServerLoad = async ({ parent }) => {
  // Get all user data from layout (no additional DB queries needed!)
  const { session, isSubscribed, user } = await parent();

  let wordsDueForReviewCount = 0;
  let totalSavedWordsCount = 0;
  let dailyReviewLimit = 20;
  let totalSentencesViewed = 0;
  let totalStoriesViewed = 0;
  let totalShortsViewed = 0;
  let currentStreak = 0;

  // Fetch review word counts if user is logged in
  if (user?.id) {
    const userId = user.id;
    const now = Date.now();

    try {
      // Get user's stats in one query
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('daily_review_limit, total_sentences_viewed, total_stories_viewed, total_shorts_viewed, current_streak')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        dailyReviewLimit = userData.daily_review_limit || 20;
        totalSentencesViewed = userData.total_sentences_viewed || 0;
        totalStoriesViewed = userData.total_stories_viewed || 0;
        totalShortsViewed = userData.total_shorts_viewed || 0;
        currentStreak = userData.current_streak || 0;
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
  }

  // Calculate capped count based on daily review limit
  const cappedReviewCount = Math.min(wordsDueForReviewCount, dailyReviewLimit);

  // Build dynamic activity suggestions based on user's stats
  const suggestions: ActivitySuggestion[] = [];

  // Priority 1: Words due for review (highest priority if they have words)
  if (cappedReviewCount > 0) {
    suggestions.push({
      id: 'review',
      href: '/review',
      icon: '📚',
      title: `Review ${cappedReviewCount} word${cappedReviewCount !== 1 ? 's' : ''}`,
      subtitle: 'Keep your vocabulary fresh with spaced repetition',
      variant: 'blue',
      priority: 10
    });
  }

  // Priority 2: Practice sentences
  suggestions.push({
    id: 'sentences',
    href: '/sentences',
    icon: '✏️',
    title: totalSentencesViewed === 0 ? 'Try sentence practice' : 'Practice more sentences',
    subtitle: totalSentencesViewed === 0 
      ? 'Build grammar skills by typing Arabic sentences' 
      : `You've practiced ${totalSentencesViewed} sentence${totalSentencesViewed !== 1 ? 's' : ''} – keep going!`,
    variant: 'green',
    priority: totalSentencesViewed === 0 ? 8 : 5
  });

  // Priority 3: Read stories
  suggestions.push({
    id: 'stories',
    href: '/stories',
    icon: '📖',
    title: totalStoriesViewed === 0 ? 'Read your first story' : 'Read a short story',
    subtitle: totalStoriesViewed === 0 
      ? 'Improve comprehension with interactive Arabic stories'
      : `${totalStoriesViewed} stories read – discover more!`,
    variant: 'purple',
    priority: totalStoriesViewed === 0 ? 7 : 4
  });

  // Priority 4: Watch shorts (new feature!)
  suggestions.push({
    id: 'shorts',
    href: '/videos-new',
    icon: '🎬',
    title: totalShortsViewed === 0 ? 'Watch Arabic Shorts' : 'More Arabic Shorts',
    subtitle: totalShortsViewed === 0 
      ? 'Learn through bite-sized video content in your dialect'
      : `${totalShortsViewed} shorts watched – swipe for more!`,
    variant: 'rose',
    priority: totalShortsViewed === 0 ? 9 : 6 // High priority if new feature
  });

  // Priority 5: Build vocabulary (if no saved words)
  if (totalSavedWordsCount === 0) {
    suggestions.push({
      id: 'vocabulary',
      href: '/vocabulary',
      icon: '💾',
      title: 'Start building your vocabulary',
      subtitle: 'Save words to create your personal review deck',
      variant: 'amber',
      priority: 3
    });
  }

  // Sort by priority (higher first)
  suggestions.sort((a, b) => b.priority - a.priority);

  return {
    session,
    isSubscribed,
    subscriptionId: user?.subscriber_id,
    subscriptionEndDate: user?.subscription_end_date,
    user,
    wordsDueForReviewCount,
    cappedReviewCount,
    totalSavedWordsCount,
    totalSentencesViewed,
    totalStoriesViewed,
    totalShortsViewed,
    currentStreak,
    suggestions
  };
};

/**
 * Form actions
 *
 * There are only subscribe and cancel, which are accessible based on the result
 * of the above load statement and what it returns to the page.
 *
 */
export const actions = {
  /**
   * Subscribe
   *
   * Retrieve the price id from the form data. This should have been created in
   * the Stripe developer's console, then create a subscription. If the sessins
   * was successful a client secret is returned and that is passed back to the
   * user via cookies in hooks.server.ts.
   */
  subscribe: async ({ request, cookies, locals: { safeGetSession } }) => {
    const { session } = await safeGetSession();
    
    if (!session?.user) {
      throw redirect(302, '/login');
    }
  
    const form = await request.formData();
    const priceId = form.get("price_id") as string;
    
    if (!priceId) {
      return fail(400, { error: 'Price ID is required' });
    }
    
    console.log('💳 Calling StripeService.subscribe with priceId:', priceId);
    
    let stripeSession;
    try {
      stripeSession = await StripeService.subscribe(priceId);
    } catch (error) {
      console.error('❌ Stripe subscription error:', error);
      return fail(500, { error: 'Failed to create subscription' });
    }
    
    console.log('🎯 Stripe session result:', stripeSession ? 'Success' : 'Failed', stripeSession?.client_secret ? 'Has client_secret' : 'No client_secret');
    
    if (stripeSession?.client_secret) {
      cookies.set("client-secret", stripeSession.client_secret, {
        path: "/",
        httpOnly: true,
        secure: true,
      });
      console.log('✅ Redirecting to /pricing/checkout');
      throw redirect(302, "/pricing/checkout");
    } else {
      console.log('❌ No client secret received from Stripe');
    }

    throw redirect(302, "/pricing/error");
  },

  /**
   * Cancel
   *
   * Retrieve the email from the form data, then attempt to cancel the
   * subscription. Redirect according to success of error.
   */
  cancel: async ({ request, locals: { safeGetSession } }) => {
    const { session } = await safeGetSession();
    
    if (!session?.user) {
      throw redirect(302, '/login');
    }

    try {
      const form = await request.formData();
      const subscriptionId = form.get("subscription_id") as string;
      
      if (!subscriptionId) {
        return fail(400, { error: 'Subscription ID is required' });
      }

      const canceledSubscription = await StripeService.cancel(subscriptionId);
      
      if (canceledSubscription) {
        throw redirect(302, '/pricing/canceled');
      } else {
        return fail(500, { error: 'Failed to cancel subscription' });
      }
    } catch (error) {
      console.error('Stripe cancellation error:', error);
      return fail(500, { error: 'Failed to cancel subscription' });
    }
  },
} satisfies Actions;
