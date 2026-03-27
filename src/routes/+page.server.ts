import { StripeService } from "$lib/services/stripe.service";
import { redirect, fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { supabase } from "$lib/supabaseClient";
import type { LeaderboardEntry } from './api/leaderboard/weekly/+server';

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
  let inProgressGame: { id: string; dialect: string; category: string; game_mode: string; current_index: number; total_questions: number; score: number } | null = null;
  let dailyChallenge: { id: string; challenge_type: string; story_id: string | null; completed: boolean; bonus_xp: number } | null = null;
  let shouldGenerateChallenge = false;
  let wordOfDay: { id: string; arabic: string; transliteration: string; english: string; example_egyptian: string | null; example_levantine: string | null; example_darija: string | null; example_fusha: string | null; audio_url: string | null } | null = null;
  let wordOfDaySaved = false;
  let leaderboardTop5: LeaderboardEntry[] = [];
  let leaderboardCurrentUser: { rank: number; xpThisWeek: number } | null = null;
  let mapWords: { id: string; arabic: string; english: string; transliteration: string; dialect: string; category: string }[] = [];

  // Use user data from parent() - already fetched in hooks.server.ts!
  // This eliminates a duplicate database query (~100-150ms saved)
  const dailyReviewLimit = user?.daily_review_limit || 20;
  const totalSentencesViewed = user?.total_sentences_viewed || 0;
  const totalStoriesViewed = user?.total_stories_viewed || 0;
  const totalShortsViewed = user?.total_shorts_viewed || 0;
  const currentStreak = user?.current_streak || 0;

  // Fetch word of the day + leaderboard top 5 for all visitors (no auth required)
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const currentUserId = user?.id ?? null;

  const [wordOfDayResult, leaderboardResult] = await Promise.all([
    supabase
      .from('word_of_the_day')
      .select('id, arabic, transliteration, english, example_egyptian, example_levantine, example_darija, example_fusha, audio_url')
      .eq('display_date', todayStr)
      .maybeSingle(),
    supabase
      .from('user')
      .select('id, email, xp_this_week')
      .eq('leaderboard_opt_out', false)
      .gt('xp_this_week', 0)
      .order('xp_this_week', { ascending: false })
      .limit(5)
  ]);

  if (!wordOfDayResult.error && wordOfDayResult.data) {
    wordOfDay = wordOfDayResult.data;
  }

  if (!leaderboardResult.error && leaderboardResult.data) {
    leaderboardTop5 = leaderboardResult.data.map((row, i) => ({
      rank: i + 1,
      displayName: (row.email ?? '').split('@')[0].slice(0, 14),
      xpThisWeek: row.xp_this_week ?? 0,
      isCurrentUser: row.id === currentUserId
    }));

    // If logged-in user is not in top 5, fetch their rank
    if (currentUserId && !leaderboardTop5.some(e => e.isCurrentUser)) {
      const { data: cu } = await supabase
        .from('user')
        .select('xp_this_week, leaderboard_opt_out')
        .eq('id', currentUserId)
        .single();

      if (cu && !cu.leaderboard_opt_out && (cu.xp_this_week ?? 0) > 0) {
        const { count } = await supabase
          .from('user')
          .select('*', { count: 'exact', head: true })
          .eq('leaderboard_opt_out', false)
          .gt('xp_this_week', cu.xp_this_week ?? 0);
        leaderboardCurrentUser = { rank: (count ?? 0) + 1, xpThisWeek: cu.xp_this_week ?? 0 };
      }
    }
  }

  // Fetch review word counts and in-progress games if user is logged in
  if (user?.id) {
    const userId = user.id;
    const now = Date.now();

    const todayDate = new Date();
    const todayMidnight = Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate());
    const activityDate = todayMidnight;

    try {
      // Run all count queries in PARALLEL instead of sequential (~50-100ms saved)
      const [totalResult, dueResult, gameResult, challengeResult, activityResult, mapWordsResult] = await Promise.all([
        supabase
          .from('saved_word')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('saved_word')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('forgotten_in_session', false)
          .or(`is_learning.eq.true,next_review_date.is.null,next_review_date.lte.${now}`),
        supabase
          .from('game_progress')
          .select('id, dialect, category, game_mode, current_index, total_questions, score')
          .eq('user_id', userId)
          .eq('status', 'in_progress')
          .order('last_played_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('daily_challenge')
          .select('id, challenge_type, story_id, completed, bonus_xp')
          .eq('user_id', userId)
          .eq('challenge_date', todayMidnight)
          .maybeSingle(),
        supabase
          .from('user_daily_activity')
          .select('word_of_day_saved')
          .eq('user_id', userId)
          .eq('activity_date', activityDate)
          .maybeSingle(),
        supabase
          .from('saved_word')
          .select('id, arabic_word, english_word, transliterated_word, dialect, word:word_id(category)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(150)
      ]);

      if (!totalResult.error && totalResult.count !== null) {
        totalSavedWordsCount = totalResult.count;
      }
      if (!dueResult.error && dueResult.count !== null) {
        wordsDueForReviewCount = dueResult.count;
      }
      if (!gameResult.error && gameResult.data) {
        inProgressGame = gameResult.data;
      }
      if (!challengeResult.error && challengeResult.data) {
        dailyChallenge = challengeResult.data;
      } else if (!challengeResult.error && !challengeResult.data) {
        // No challenge yet today — trigger lazy generation on the client
        shouldGenerateChallenge = true;
      }
      if (!activityResult.error && activityResult.data) {
        wordOfDaySaved = activityResult.data.word_of_day_saved ?? false;
      }
      if (!mapWordsResult.error && mapWordsResult.data) {
        mapWords = mapWordsResult.data.map((w: any) => ({
          id: w.id,
          arabic: w.arabic_word,
          english: w.english_word,
          transliteration: w.transliterated_word,
          dialect: w.dialect || 'egyptian-arabic',
          category: (w.word as any)?.category || 'Uncategorized',
        }));
      }
    } catch (error) {
      console.error('Error fetching word counts:', error);
    }
  }

  // Calculate capped count based on daily review limit
  const cappedReviewCount = Math.min(wordsDueForReviewCount, dailyReviewLimit);

  // Build dynamic activity suggestions based on user's stats
  const suggestions: ActivitySuggestion[] = [];

  // Priority 0: Daily challenge (highest priority — shown above everything else)
  if (dailyChallenge && !dailyChallenge.completed) {
    const challengeHref = dailyChallenge.challenge_type === 'story' && dailyChallenge.story_id
      ? `/generated_story/${dailyChallenge.story_id}?challenge=${dailyChallenge.id}`
      : `/challenge/${dailyChallenge.id}`;
    suggestions.push({
      id: 'daily-challenge',
      href: challengeHref,
      icon: '⭐',
      title: 'Daily Challenge',
      subtitle: `Complete today's ${dailyChallenge.challenge_type === 'story' ? '5-sentence story' : '3-sentence'} challenge for +${dailyChallenge.bonus_xp} bonus XP`,
      variant: 'amber',
      priority: 11
    });
  }

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

  // Priority 4: Play game (or continue in-progress game)
  if (inProgressGame) {
    // Build continue game URL with resume params
    const continueParams = new URLSearchParams({
      dialect: inProgressGame.dialect,
      mode: inProgressGame.game_mode,
      category: inProgressGame.category,
      resumeId: inProgressGame.id
    });

    suggestions.push({
      id: 'game',
      href: `/learn/game`,
      icon: '🎮',
      title: `Continue your game`,
      subtitle: `${inProgressGame.current_index}/${inProgressGame.total_questions} complete – score: ${inProgressGame.score}`,
      variant: 'rose',
      priority: 9 // High priority for in-progress games
    });
  } else {
    suggestions.push({
      id: 'game',
      href: '/learn/game',
      icon: '🎮',
      title: 'Play vocabulary game',
      subtitle: 'Practice words through interactive multiple choice, listening & speaking',
      variant: 'rose',
      priority: 6
    });
  }

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
    suggestions,
    shouldGenerateChallenge,
    wordOfDay,
    wordOfDaySaved,
    leaderboardTop5,
    leaderboardCurrentUser,
    mapWords
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
