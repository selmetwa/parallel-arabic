<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import ContributionGraph from '$lib/components/ContributionGraph.svelte';
  import ReviewWordsStats from './components/ReviewWordsStats.svelte';
  import Achievements from './components/Achievements.svelte';
  import type { PageData } from './$types';
  import { goto, invalidateAll, invalidate } from '$app/navigation';
  import { clearUserLocalStorage } from '$lib/helpers/clear-user-data';
  import { slide, fade } from 'svelte/transition';
  import { WHITELISTED_EMAILS } from '$lib/config/whitelisted-emails';

  let { data }: { data: PageData } = $props();

  let isClearingWords = $state(false);
  let clearError = $state<string | null>(null);
  let clearSuccess = $state<string | null>(null);
  let showClearConfirm = $state(false);
  
  let dialectUpdateSuccess = $state<string | null>(null);
  let dialectUpdateError = $state<string | null>(null);
  let reviewLimitUpdateSuccess = $state<string | null>(null);
  let reviewLimitUpdateError = $state<string | null>(null);
  let emailNotificationsSuccess = $state<string | null>(null);
  let emailNotificationsError = $state<string | null>(null);
  
  // Subscription cancellation state
  let isCancelling = $state(false);
  let cancelError = $state<string | null>(null);
  let cancelSuccess = $state<string | null>(null);
  let showCancelConfirm = $state(false);
  
  // Expandable sections
  let showSettings = $state(true);
  let showContent = $state(true);

  const dialectFlags: Record<string, string> = {
    'egyptian-arabic': '🇪🇬',
    'darija': '🇲🇦',
    'levantine': '🇱🇧',
    'fusha': '📚'
  };

  const dialectNames: Record<string, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    'darija': 'Moroccan Darija',
    'levantine': 'Levantine Arabic',
    'fusha': 'Modern Standard Arabic'
  };

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic', flag: '🇪🇬' },
    { value: 'darija', label: 'Moroccan Darija', flag: '🇲🇦' },
    { value: 'levantine', label: 'Levantine Arabic', flag: '🇱🇧' },
    { value: 'fusha', label: 'Modern Standard Arabic (Fusha)', flag: '📚' }
  ];

  const currentDialect = data.targetDialect || 'egyptian-arabic';
  
  // Get user initials for avatar
  const userInitials = $derived(() => {
    const email = data.user?.email || '';
    return email.charAt(0).toUpperCase();
  });
  
  // Stats calculations
  const currentStreak = $derived(data.user?.current_streak ?? 0);
  const longestStreak = $derived(data.user?.longest_streak ?? 0);
  const totalReviews = $derived(data.user?.total_reviews ?? 0);
  const totalSentences = $derived(data.user?.total_sentences_viewed ?? 0);
  const totalStories = $derived(data.user?.total_stories_viewed ?? 0);
  const totalLessons = $derived(data.user?.total_lessons_viewed ?? 0);

  async function clearAllWords() {
    if (!showClearConfirm) {
      showClearConfirm = true;
      return;
    }

    isClearingWords = true;
    clearError = null;
    clearSuccess = null;

    try {
      const response = await fetch('/api/clear-all-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear words');
      }

      clearSuccess = 'All words cleared successfully!';
      showClearConfirm = false;
      
      setTimeout(() => {
        goto('/review');
      }, 2000);
    } catch (error) {
      clearError = error instanceof Error ? error.message : 'Failed to clear words';
      showClearConfirm = false;
    } finally {
      isClearingWords = false;
    }
  }

  function cancelClear() {
    showClearConfirm = false;
    clearError = null;
  }
  
  async function handleLogout() {
    clearUserLocalStorage();
    
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      await invalidateAll();
      await goto('/', { invalidateAll: true });
    } catch (error) {
      console.error('Error during logout:', error);
      await invalidateAll();
      await goto('/', { invalidateAll: true });
    }
  }
  
  async function cancelSubscription() {
    if (!showCancelConfirm) {
      showCancelConfirm = true;
      return;
    }

    isCancelling = true;
    cancelError = null;
    cancelSuccess = null;

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      cancelSuccess = 'Your subscription has been cancelled. You will retain access until the end of your billing period.';
      showCancelConfirm = false;
      
      // Refresh data after 2 seconds
      setTimeout(async () => {
        await invalidateAll();
      }, 2000);
    } catch (error) {
      cancelError = error instanceof Error ? error.message : 'Failed to cancel subscription';
      showCancelConfirm = false;
    } finally {
      isCancelling = false;
    }
  }

  function cancelCancelSubscription() {
    showCancelConfirm = false;
    cancelError = null;
  }
  
  // Format date helper
  function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<div class="min-h-screen bg-tile-300">
  <!-- Profile Header -->
  <header class="bg-gradient-to-br from-tile-500 to-tile-600 border-b-2 border-tile-600">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <!-- Avatar -->
        <div class="relative">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-tile-400 border-4 border-tile-300 shadow-xl flex items-center justify-center">
            <span class="text-4xl sm:text-5xl font-bold text-text-300">{userInitials()}</span>
          </div>
          {#if data.hasActiveSubscription }
            <div class="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              PRO
            </div>
          {/if}

        </div>

        <!-- User Info -->
        <div class="flex-1 text-center sm:text-left">
          <h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1">
            {data.user?.email?.split('@')[0] || 'Learner'}
          </h1>
          <p class="text-text-200 text-sm mb-4">{data.user?.email}</p>
          {#if WHITELISTED_EMAILS.includes(data.user.email)}
          <p class="text-xs text-text-100 uppercase tracking-wide">
            Whitelisted!
          </p>
        {/if}
          <!-- Dialect Badge -->
          <div class="inline-flex items-center gap-2 bg-tile-400/80 backdrop-blur px-4 py-2 rounded-full border border-tile-500">
            <span class="text-xl">{dialectFlags[currentDialect] || '🌍'}</span>
            <span class="text-sm font-medium text-text-300">Learning {dialectNames[currentDialect] || 'Arabic'}</span>
          </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="flex gap-6 sm:gap-8">
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold text-text-300">{currentStreak}</div>
            <div class="text-xs text-text-200 uppercase tracking-wide">Day Streak</div>
            <div class="text-2xl mt-1">🔥</div>
          </div>
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold text-text-300">{data.wordStats.total}</div>
            <div class="text-xs text-text-200 uppercase tracking-wide">Words</div>
            <div class="text-2xl mt-1">📚</div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
    
    <!-- Stats Grid -->
    <section>
      <h2 class="text-xl font-bold text-text-300 mb-4 flex items-center gap-2">
        <span class="text-2xl">📊</span>
        Learning Progress
      </h2>
      
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
          <div class="text-3xl mb-2">🔥</div>
          <div class="text-2xl font-bold text-text-300">{currentStreak}</div>
          <div class="text-xs text-text-200">Current Streak</div>
          {#if longestStreak > currentStreak}
            <div class="text-xs text-text-200 mt-1">Best: {longestStreak}</div>
          {/if}
        </div>
        
        <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
          <div class="text-3xl mb-2">📝</div>
          <div class="text-2xl font-bold text-text-300">{totalReviews}</div>
          <div class="text-xs text-text-200">Reviews Done</div>
        </div>
        
        <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
          <div class="text-3xl mb-2">📖</div>
          <div class="text-2xl font-bold text-text-300">{totalStories}</div>
          <div class="text-xs text-text-200">Stories Read</div>
        </div>
        
        <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
          <div class="text-3xl mb-2">🎓</div>
          <div class="text-2xl font-bold text-text-300">{totalLessons}</div>
          <div class="text-xs text-text-200">Lessons Done</div>
        </div>
      </div>
      
    <!-- Achievements Section -->
     <div class="py-4">
      <Achievements achievements={data.achievements} />

     </div>
      <!-- Review Words Stats -->
      <ReviewWordsStats wordStats={data.wordStats} />
      
      <!-- Activity Graph -->
      <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6 shadow-lg mt-6">
        <h3 class="text-lg font-semibold text-text-300 mb-4 flex items-center gap-2">
          <span>📅</span>
          Activity History
        </h3>
        <ContributionGraph />
      </div>
    </section>


    <!-- Settings Section -->
    <section>
      <button 
        onclick={() => showSettings = !showSettings}
        class="w-full flex items-center justify-between text-xl font-bold text-text-300 mb-4 hover:text-text-200 transition-colors"
      >
        <span class="flex items-center gap-2">
          <span class="text-2xl">⚙️</span>
          Settings
        </span>
        <span class="text-2xl transform transition-transform {showSettings ? 'rotate-180' : ''}"
          >▼</span
        >
      </button>
      
      {#if showSettings}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-lg overflow-hidden" transition:slide={{ duration: 200 }}>
          <!-- Learning Preferences -->
          <div class="p-6 border-b border-tile-500">
            <h3 class="text-base font-bold text-text-300 mb-4 uppercase tracking-wide">Learning Preferences</h3>
            
            <div class="space-y-6">
              <!-- Dialect Selection -->
              <div>
                <label for="target_dialect" class="block text-sm font-medium text-text-200 mb-2">
                  Target Dialect
                </label>
                <form 
                  method="POST" 
                  action="?/updateTargetDialect" 
                  use:enhance={() => {
                    dialectUpdateSuccess = null;
                    dialectUpdateError = null;
                    return async ({ result, update }) => {
                      if (result.type === 'success' && result.data?.success) {
                        await invalidate('supabase:auth');
                        await invalidate('/');
                        await update();
                        await invalidateAll();
                        dialectUpdateSuccess = 'Dialect updated!';
                        setTimeout(() => dialectUpdateSuccess = null, 3000);
                      } else if (result.type === 'failure') {
                        await update();
                        const errorMsg = result.data?.error;
                        dialectUpdateError = typeof errorMsg === 'string' ? errorMsg : 'Failed to update';
                      } else if (result.type === 'error') {
                        await update();
                        dialectUpdateError = result.error?.toString() || 'Failed to update';
                      } else {
                        await update();
                      }
                    };
                  }}
                  class="flex flex-col sm:flex-row gap-3"
                >
                  <select
                    id="target_dialect"
                    name="target_dialect"
                    class="flex-1 bg-tile-500 border-2 border-tile-600 text-text-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tile-600 focus:border-tile-600 text-base font-medium"
                  >
                    {#each dialectOptions as option}
                      <option value={option.value} selected={currentDialect === option.value}>
                        {option.flag} {option.label}
                      </option>
                    {/each}
                  </select>
                  <Button type="submit" className="px-6">Save</Button>
                </form>
                {#if dialectUpdateSuccess}
                  <div class="mt-2 text-green-700 text-sm font-medium" transition:fade>✓ {dialectUpdateSuccess}</div>
                {/if}
                {#if dialectUpdateError}
                  <div class="mt-2 text-red-400 text-sm font-medium" transition:fade>✗ {dialectUpdateError}</div>
                {/if}
              </div>
              
              <!-- Daily Review Limit -->
              <div>
                <label for="daily_review_limit" class="block text-sm font-medium text-text-200 mb-1">
                  Daily Review Limit
                </label>
                <p class="text-xs text-text-200 mb-2 opacity-80">Words to review per session (1-1000)</p>
                <form 
                  method="POST" 
                  action="?/updateDailyReviewLimit" 
                  use:enhance={() => {
                    reviewLimitUpdateSuccess = null;
                    reviewLimitUpdateError = null;
                    return async ({ result, update }) => {
                      if (result.type === 'success' && result.data?.success) {
                        await invalidate('supabase:auth');
                        await invalidate('/');
                        await update();
                        await invalidateAll();
                        reviewLimitUpdateSuccess = 'Limit updated!';
                        setTimeout(() => reviewLimitUpdateSuccess = null, 3000);
                      } else if (result.type === 'failure') {
                        await update();
                        const errorMsg = result.data?.error;
                        reviewLimitUpdateError = typeof errorMsg === 'string' ? errorMsg : 'Failed to update';
                      } else if (result.type === 'error') {
                        await update();
                        reviewLimitUpdateError = result.error?.toString() || 'Failed to update';
                      } else {
                        await update();
                      }
                    };
                  }}
                  class="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="number"
                    id="daily_review_limit"
                    name="daily_review_limit"
                    min="1"
                    max="1000"
                    value={data.dailyReviewLimit}
                    class="w-full sm:w-32 bg-tile-500 border-2 border-tile-600 text-text-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tile-600 text-base font-medium"
                  />
                  <Button type="submit" className="px-6">Save</Button>
                </form>
                {#if reviewLimitUpdateSuccess}
                  <div class="mt-2 text-green-700 text-sm font-medium" transition:fade>✓ {reviewLimitUpdateSuccess}</div>
                {/if}
                {#if reviewLimitUpdateError}
                  <div class="mt-2 text-red-400 text-sm font-medium" transition:fade>✗ {reviewLimitUpdateError}</div>
                {/if}
              </div>

              <!-- Email Notifications -->
              <div>
                <label class="block text-sm font-medium text-text-200 mb-1">
                  Streak reminder emails
                </label>
                <p class="text-xs text-text-200 mb-2 opacity-80">Receive an email when you're about to lose your streak</p>
                <form
                  method="POST"
                  action="?/updateEmailNotifications"
                  use:enhance={() => {
                    emailNotificationsSuccess = null;
                    emailNotificationsError = null;
                    return async ({ result, update }) => {
                      if (result.type === 'success' && result.data?.success) {
                        await update();
                        emailNotificationsSuccess = 'Notification settings updated!';
                        setTimeout(() => emailNotificationsSuccess = null, 3000);
                      } else if (result.type === 'failure') {
                        await update();
                        const errorMsg = result.data?.error;
                        emailNotificationsError = typeof errorMsg === 'string' ? errorMsg : 'Failed to update';
                      } else if (result.type === 'error') {
                        await update();
                        emailNotificationsError = result.error?.toString() || 'Failed to update';
                      } else {
                        await update();
                      }
                    };
                  }}
                  class="flex items-center gap-3"
                >
                  <input type="hidden" name="email_notifications_enabled" value={data.emailNotificationsEnabled ? 'false' : 'true'} />
                  <button
                    type="submit"
                    class="relative inline-flex h-6 w-11 items-center rounded-full border-2 border-tile-600 transition-colors focus:outline-none focus:ring-2 focus:ring-tile-600 {data.emailNotificationsEnabled ? 'bg-green-600' : 'bg-tile-500'}"
                    aria-label="Toggle streak reminder emails"
                  >
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform {data.emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-1'}"></span>
                  </button>
                  <span class="text-sm text-text-300">{data.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}</span>
                </form>
                {#if emailNotificationsSuccess}
                  <div class="mt-2 text-green-700 text-sm font-medium" transition:fade>✓ {emailNotificationsSuccess}</div>
                {/if}
                {#if emailNotificationsError}
                  <div class="mt-2 text-red-400 text-sm font-medium" transition:fade>✗ {emailNotificationsError}</div>
                {/if}
              </div>

              {#if data.learningReason || data.proficiencyLevel}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-tile-500">
                  {#if data.learningReason}
                    <div>
                      <span class="text-xs text-text-200 uppercase tracking-wide">Learning Reason</span>
                      <p class="text-text-300 font-medium">{data.learningReason}</p>
                    </div>
                  {/if}
                  {#if data.proficiencyLevel}
                    <div>
                      <span class="text-xs text-text-200 uppercase tracking-wide">Proficiency</span>
                      <p class="text-text-300 font-medium capitalize">{data.proficiencyLevel}</p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Account Info -->
          <div class="p-6 border-b border-tile-500 bg-tile-500/30">
            <h3 class="text-base font-bold text-text-300 mb-4 uppercase tracking-wide">Account</h3>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p class="text-text-300 font-medium">{data.user?.email}</p>
                <p class="text-sm text-text-200">
                  Status: 
                  <span class={data.hasActiveSubscription ? "text-green-700 font-semibold" : "text-text-200"}>
                    {data.hasActiveSubscription ? '✓ Premium Active' : 'Free Plan'}
                  </span>
                </p>
                {#if WHITELISTED_EMAILS.includes(data.user.email)}
                <p class="text-xs text-text-200 uppercase tracking-wide">
                  Whitelisted by Sherif (selmetwa@gmail.com)!
                </p>
              {/if}
              </div>
              <Button 
                type="button"
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 border-red-700"
              >
                Sign Out
              </Button>
            </div>
          </div>
          
          <!-- Subscription Management (only for subscribers) -->
          {#if data.hasActiveSubscription && !WHITELISTED_EMAILS.includes(data.user.email)}
            <div class="p-6 bg-tile-500/20">
              <h3 class="text-base font-bold text-text-300 mb-4 uppercase tracking-wide">Subscription</h3>
              
              <div class="space-y-4">
                <!-- Subscription Status -->
                <div class="bg-tile-400 border border-tile-600 rounded-lg p-4">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="text-2xl">💳</span>
                    <div>
                      <p class="text-text-300 font-semibold">Premium Subscription</p>
                      {#if data.subscriptionDetails?.cancelAtPeriodEnd}
                        <p class="text-sm text-yellow-400">
                          ⚠️ Cancelling - Access until {formatDate(data.subscriptionDetails.currentPeriodEnd)}
                        </p>
                      {:else}
                        <p class="text-sm text-text-200">
                          Next billing: {formatDate(data.subscriptionDetails?.currentPeriodEnd)}
                        </p>
                      {/if}
                    </div>
                  </div>
                  
                  {#if cancelError}
                    <div class="bg-red-500/20 border border-red-400 text-red-300 px-3 py-2 rounded-lg mb-3 text-sm" transition:fade>
                      {cancelError}
                    </div>
                  {/if}

                  {#if cancelSuccess}
                    <div class="bg-green-500/20 border border-green-400 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm" transition:fade>
                      {cancelSuccess}
                    </div>
                  {/if}
                  
                  {#if !data.subscriptionDetails?.cancelAtPeriodEnd}
                    {#if showCancelConfirm}
                      <div class="space-y-3 mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                        <p class="text-yellow-300 text-sm font-medium">⚠️ Are you sure you want to cancel?</p>
                        <p class="text-text-200 text-xs">You'll retain access to premium features until {formatDate(data.subscriptionDetails?.currentPeriodEnd)}.</p>
                        <div class="flex gap-2">
                          <Button 
                            onClick={cancelSubscription} 
                            type="button" 
                            disabled={isCancelling}
                            className="bg-red-600 hover:bg-red-700 flex-1 text-sm"
                          >
                            {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                          </Button>
                          <Button 
                            onClick={cancelCancelSubscription} 
                            type="button"
                            disabled={isCancelling}
                            className="flex-1 text-sm"
                          >
                            Keep Subscription
                          </Button>
                        </div>
                      </div>
                    {:else}
                      <button 
                        onclick={cancelSubscription}
                        class="text-sm text-red-400 hover:text-red-300 underline transition-colors"
                      >
                        Cancel subscription
                      </button>
                    {/if}
                  {:else}
                    <p class="text-sm text-text-200 mt-2">
                      Your subscription is set to cancel. You can continue using premium features until your access expires.
                    </p>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <!-- Content Section -->
    <section>
      <button 
        onclick={() => showContent = !showContent}
        class="w-full flex items-center justify-between text-xl font-bold text-text-300 mb-4 hover:text-text-200 transition-colors"
      >
        <span class="flex items-center gap-2">
          <span class="text-2xl">📚</span>
          Your Content
        </span>
        <span class="text-2xl transform transition-transform {showContent ? 'rotate-180' : ''}"
          >▼</span
        >
      </button>
      
      {#if showContent}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" transition:slide={{ duration: 200 }}>
          <!-- Generated Stories -->
          <div class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-lg overflow-hidden">
            <div class="p-4 border-b border-tile-500 bg-tile-500/30">
              <h3 class="font-bold text-text-300 flex items-center gap-2">
                <span>📖</span>
                Generated Stories
              </h3>
            </div>
            <div class="p-4">
              {#if data.userGeneratedStories && data.userGeneratedStories.length > 0}
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  {#each data.userGeneratedStories as story}
                    <div class="bg-tile-500 p-3 rounded-lg border border-tile-600 hover:border-tile-500 transition-colors">
                      <p class="text-text-300 font-medium text-sm truncate">{story.story_body.title.english}</p>
                      <p class="text-text-200 text-xs mt-1">
                        {dialectFlags[story.dialect] || '🌍'} {story.dialect} • {new Date(story.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-3 opacity-50">📖</div>
                  <p class="text-text-200 text-sm mb-4">No stories generated yet</p>
                  <a href="/stories" class="inline-block text-sm font-medium text-blue-400 hover:text-blue-300 underline">
                    Create your first story →
                  </a>
                </div>
              {/if}
            </div>
          </div>

          <!-- Review Deck -->
          <div class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-lg overflow-hidden">
            <div class="p-4 border-b border-tile-500 bg-tile-500/30">
              <h3 class="font-bold text-text-300 flex items-center gap-2">
                <span>🗂️</span>
                Review Deck
              </h3>
            </div>
            <div class="p-4 space-y-3">
              <a 
                href="/review" 
                class="flex items-center justify-between bg-tile-500 hover:bg-tile-600 border border-tile-600 rounded-lg px-4 py-3 text-text-300 font-medium transition-colors group"
              >
                <span>Start Review Session</span>
                <span class="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a 
                href="/review/all-words" 
                class="flex items-center justify-between bg-tile-500 hover:bg-tile-600 border border-tile-600 rounded-lg px-4 py-3 text-text-300 font-medium transition-colors group"
              >
                <span>View All Words</span>
                <span class="text-text-200">{data.wordStats.total} words</span>
              </a>
              
              <!-- Danger Zone -->
              <div class="pt-4 mt-4 border-t border-tile-500">
                <details class="group">
                  <summary class="cursor-pointer text-sm font-medium text-red-400 hover:text-red-300 flex items-center gap-2">
                    <span>⚠️</span>
                    Danger Zone
                    <span class="text-xs opacity-60">(click to expand)</span>
                  </summary>
                  
                  <div class="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                    <p class="text-text-200 text-sm mb-4">Clear all words from your review deck. This cannot be undone.</p>
                    
                    {#if clearError}
                      <div class="bg-red-500/20 border border-red-400 text-red-300 px-3 py-2 rounded-lg mb-3 text-sm">
                        {clearError}
                      </div>
                    {/if}

                    {#if clearSuccess}
                      <div class="bg-green-500/20 border border-green-400 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm">
                        {clearSuccess}
                      </div>
                    {/if}

                    {#if showClearConfirm}
                      <div class="space-y-3">
                        <p class="text-yellow-300 text-sm font-medium">⚠️ Are you absolutely sure?</p>
                        <div class="flex gap-2">
                          <Button 
                            onClick={clearAllWords} 
                            type="button" 
                            disabled={isClearingWords}
                            className="bg-red-600 hover:bg-red-700 flex-1 text-sm"
                          >
                            {isClearingWords ? 'Clearing...' : 'Yes, Delete All'}
                          </Button>
                          <Button 
                            onClick={cancelClear} 
                            type="button"
                            disabled={isClearingWords}
                            className="flex-1 text-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    {:else}
                      <Button 
                        onClick={clearAllWords} 
                        type="button"
                        disabled={isClearingWords}
                        className="bg-red-600 hover:bg-red-700 w-full text-sm"
                      >
                        Clear All Words
                      </Button>
                    {/if}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </section>
  </main>
</div>
