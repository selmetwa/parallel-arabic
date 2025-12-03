import { StripeService } from "$lib/services/stripe.service";
import { redirect, fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { supabase } from "$lib/supabaseClient";

import type { PageServerLoad } from "./$types";

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

  // Fetch review word counts if user is logged in
  if (user?.id) {
    const userId = user.id;
    const now = Date.now();

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
  }

  // Calculate capped count based on daily review limit
  const cappedReviewCount = Math.min(wordsDueForReviewCount, dailyReviewLimit);

  return {
    session,  // Use from layout!
    isSubscribed,  // Use from layout!
    subscriptionId: user?.subscriber_id,  // Use from layout!
    subscriptionEndDate: user?.subscription_end_date,  // Use from layout!
    user, // Include full user object for stats
    wordsDueForReviewCount,
    cappedReviewCount, // Capped to daily limit
    totalSavedWordsCount
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
