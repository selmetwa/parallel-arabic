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

  // Subscription cancellation state
  let isCancelling = $state(false);
  let cancelError = $state<string | null>(null);
  let cancelSuccess = $state<string | null>(null);
  let showCancelConfirm = $state(false);

  // Expandable sections
  let showSettings = $state(false);
  let showContent = $state(false);

  // Per-form submission status (success / error / pending), keyed by form name.
  type FormStatus = { success: string | null; error: string | null; pending: boolean };
  let status = $state<Record<string, FormStatus>>({});

  function getStatus(key: string): FormStatus {
    return status[key] ?? { success: null, error: null, pending: false };
  }

  /**
   * Shared `use:enhance` handler factory. Replaces five near-identical blocks and
   * keeps success/error/pending state consistent across every settings form.
   */
  function enhanceStatus(key: string, successMsg: string, revalidate = false) {
    return () => {
      status[key] = { success: null, error: null, pending: true };
      return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
        if (result.type === 'success' && result.data?.success) {
          if (revalidate) {
            await invalidate('supabase:auth');
            await invalidate('/');
          }
          await update();
          if (revalidate) await invalidateAll();
          status[key] = { success: successMsg, error: null, pending: false };
          setTimeout(() => {
            if (status[key]) status[key] = { ...status[key], success: null };
          }, 3000);
        } else if (result.type === 'failure') {
          await update();
          const errorMsg = result.data?.error;
          status[key] = {
            success: null,
            error: typeof errorMsg === 'string' ? errorMsg : 'Failed to update',
            pending: false
          };
        } else if (result.type === 'error') {
          await update();
          status[key] = { success: null, error: result.error?.toString() || 'Failed to update', pending: false };
        } else {
          await update();
          status[key] = { success: null, error: null, pending: false };
        }
      };
    };
  }

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

  const currentDialect = $derived(data.targetDialect || 'egyptian-arabic');

  // Get user initials for avatar
  const userInitials = $derived(() => {
    const email = data.user?.email || '';
    return email.charAt(0).toUpperCase();
  });

  const isWhitelisted = $derived(WHITELISTED_EMAILS.includes(data.user?.email ?? ''));

  // Stats calculations
  const currentStreak = $derived(data.user?.current_streak ?? 0);
  const longestStreak = $derived(data.user?.longest_streak ?? 0);
  const totalReviews = $derived(data.user?.total_reviews ?? 0);
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

  let showDeleteConfirm = $state(false);
  let isDeleting = $state(false);
  let deleteError = $state<string | null>(null);

  async function handleDeleteAccount() {
    if (!showDeleteConfirm) {
      showDeleteConfirm = true;
      return;
    }
    isDeleting = true;
    deleteError = null;
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        deleteError = data.error ?? 'Failed to delete account.';
        isDeleting = false;
        return;
      }
      await goto('/');
    } catch {
      deleteError = 'Something went wrong. Please try again.';
      isDeleting = false;
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

  async function openCustomerCenter() {
    try {
      const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
      await RevenueCatUI.presentCustomerCenter();
    } catch (err) {
      console.error('Failed to open Customer Center:', err);
    }
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

  const learningStats = $derived([
    { icon: '🔥', value: currentStreak, label: 'Current Streak', sub: longestStreak > currentStreak ? `Best ${longestStreak}` : null },
    { icon: '📝', value: totalReviews, label: 'Reviews Done', sub: null },
    { icon: '📖', value: totalStories, label: 'Stories Read', sub: null },
    { icon: '🎓', value: totalLessons, label: 'Lessons Done', sub: null }
  ]);
</script>

<div class="min-h-screen bg-tile-300">
  <!-- Profile Header -->
  <header class="relative overflow-hidden border-b-2 border-tile-600 bg-tile-400">
    <!-- Decorative brand glow (theme-aware via --brand) -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 opacity-60"
      style="background: radial-gradient(120% 130% at 8% -10%, color-mix(in srgb, var(--brand) 22%, transparent), transparent 55%), radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, var(--brand) 10%, transparent), transparent 60%);"
    ></div>

    <div class="reveal relative max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-12" style="--d: 0;">
      <div class="flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <!-- Avatar -->
        <div class="relative shrink-0">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-tile-500 ring-2 ring-tile-600 shadow-xl flex items-center justify-center rotate-3">
            <span class="text-4xl sm:text-5xl font-bold text-text-300 -rotate-3">{userInitials()}</span>
          </div>
          {#if data.hasActiveSubscription}
            <div class="absolute -bottom-2 -right-2 bg-brand text-white text-[0.65rem] font-bold tracking-wider px-2.5 py-1 rounded-lg shadow-lg ring-2 ring-tile-400">
              PRO
            </div>
          {/if}
        </div>

        <!-- User Info -->
        <div class="flex-1 text-center sm:text-left min-w-0">
          {#if isWhitelisted}
            <span class="inline-block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brand mb-1.5">★ Whitelisted</span>
          {/if}
          <h1 class="text-3xl sm:text-4xl font-bold text-text-300 leading-tight truncate">
            {data.user?.email?.split('@')[0] || 'Learner'}
          </h1>
          <p class="text-text-200 text-sm mt-1 truncate">{data.user?.email}</p>

          <!-- Dialect Badge -->
          <div class="mt-4 inline-flex items-center gap-2 bg-tile-300/70 backdrop-blur px-3.5 py-1.5 rounded-full border border-tile-600">
            <span class="text-lg leading-none">{dialectFlags[currentDialect] || '🌍'}</span>
            <span class="text-sm font-medium text-text-300">Learning {dialectNames[currentDialect] || 'Arabic'}</span>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="flex gap-3 shrink-0">
          <div class="flex flex-col items-center justify-center bg-tile-300/70 backdrop-blur rounded-xl border border-tile-600 px-5 py-3 min-w-[5.5rem]">
            <span class="text-2xl leading-none mb-1">🔥</span>
            <span class="text-2xl font-bold text-text-300 leading-none">{currentStreak}</span>
            <span class="text-[0.65rem] text-text-200 uppercase tracking-wide mt-1">Streak</span>
          </div>
          <div class="flex flex-col items-center justify-center bg-tile-300/70 backdrop-blur rounded-xl border border-tile-600 px-5 py-3 min-w-[5.5rem]">
            <span class="text-2xl leading-none mb-1">📚</span>
            <span class="text-2xl font-bold text-text-300 leading-none">{data.wordStats.total}</span>
            <span class="text-[0.65rem] text-text-200 uppercase tracking-wide mt-1">Words</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-12">

    <!-- Learning Progress -->
    <section class="reveal" style="--d: 1;">
      <div class="flex items-center gap-3 mb-5">
        <h2 class="text-lg font-bold text-text-300 uppercase tracking-wide">Learning Progress</h2>
        <div class="flex-1 h-px bg-tile-600"></div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {#each learningStats as stat (stat.label)}
          <div class="stat-card relative overflow-hidden bg-tile-400 border-2 border-tile-600 rounded-2xl p-4 sm:p-5">
            <div class="accent-bar"></div>
            <div class="text-2xl mb-2">{stat.icon}</div>
            <div class="text-3xl font-bold text-text-300 tabular-nums">{stat.value}</div>
            <div class="text-xs text-text-200 mt-0.5">{stat.label}</div>
            {#if stat.sub}
              <div class="text-[0.7rem] text-text-200 opacity-70 mt-1">{stat.sub}</div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Achievements -->
      <div class="mb-8">
        <Achievements achievements={data.achievements} />
      </div>

      <!-- Vocabulary / Review Deck stats -->
      <ReviewWordsStats wordStats={data.wordStats} />
    </section>

    <!-- Settings Section -->
    <section class="reveal" style="--d: 2;">
      <button
        onclick={() => showSettings = !showSettings}
        class="group w-full flex items-center gap-3 mb-5"
        aria-expanded={showSettings}
      >
        <span class="text-lg">⚙️</span>
        <h2 class="text-lg font-bold text-text-300 uppercase tracking-wide group-hover:text-text-200 transition-colors">Settings</h2>
        <div class="flex-1 h-px bg-tile-600"></div>
        <span class="text-text-200 text-sm transform transition-transform {showSettings ? 'rotate-180' : ''}">▼</span>
      </button>

      {#if showSettings}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-2xl shadow-lg overflow-hidden" transition:slide={{ duration: 200 }}>
          <!-- Learning Preferences -->
          <div class="p-5 sm:p-6 border-b border-tile-600">
            <h3 class="text-xs font-bold text-text-200 mb-5 uppercase tracking-[0.15em]">Learning Preferences</h3>

            <div class="space-y-6">
              <!-- Dialect Selection -->
              <div>
                <label for="target_dialect" class="block text-sm font-medium text-text-300 mb-2">
                  Target Dialect
                </label>
                <form
                  method="POST"
                  action="?/updateTargetDialect"
                  use:enhance={enhanceStatus('dialect', 'Dialect updated!', true)}
                  class="flex flex-col sm:flex-row gap-3"
                >
                  <select
                    id="target_dialect"
                    name="target_dialect"
                    class="flex-1 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand text-base font-medium"
                  >
                    {#each dialectOptions as option (option.value)}
                      <option value={option.value} selected={currentDialect === option.value}>
                        {option.flag} {option.label}
                      </option>
                    {/each}
                  </select>
                  <Button type="submit" className="px-6" disabled={getStatus('dialect').pending}>
                    {getStatus('dialect').pending ? 'Saving…' : 'Save'}
                  </Button>
                </form>
                {#if getStatus('dialect').success}
                  <p class="status-ok" transition:fade>{getStatus('dialect').success}</p>
                {/if}
                {#if getStatus('dialect').error}
                  <p class="status-err" transition:fade>{getStatus('dialect').error}</p>
                {/if}
              </div>

              <!-- Daily Review Limit -->
              <div>
                <label for="daily_review_limit" class="block text-sm font-medium text-text-300 mb-1">
                  Daily Review Limit
                </label>
                <p class="text-xs text-text-200 mb-2 opacity-80">Words to review per session (1–100)</p>
                <form
                  method="POST"
                  action="?/updateDailyReviewLimit"
                  use:enhance={enhanceStatus('limit', 'Limit updated!', true)}
                  class="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="number"
                    id="daily_review_limit"
                    name="daily_review_limit"
                    min="1"
                    max="100"
                    value={data.dailyReviewLimit}
                    class="w-full sm:w-32 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand text-base font-medium"
                  />
                  <Button type="submit" className="px-6" disabled={getStatus('limit').pending}>
                    {getStatus('limit').pending ? 'Saving…' : 'Save'}
                  </Button>
                </form>
                {#if getStatus('limit').success}
                  <p class="status-ok" transition:fade>{getStatus('limit').success}</p>
                {/if}
                {#if getStatus('limit').error}
                  <p class="status-err" transition:fade>{getStatus('limit').error}</p>
                {/if}
              </div>

              <!-- Email Notifications -->
              <div class="flex items-start justify-between gap-4 pt-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-text-300">Streak reminder emails</p>
                  <p class="text-xs text-text-200 mt-0.5 opacity-80">Get an email when you're about to lose your streak</p>
                  {#if getStatus('emails').success}
                    <p class="status-ok" transition:fade>{getStatus('emails').success}</p>
                  {/if}
                  {#if getStatus('emails').error}
                    <p class="status-err" transition:fade>{getStatus('emails').error}</p>
                  {/if}
                </div>
                <form
                  method="POST"
                  action="?/updateEmailNotifications"
                  use:enhance={enhanceStatus('emails', 'Notification settings updated!')}
                  class="shrink-0"
                >
                  <input type="hidden" name="email_notifications_enabled" value={data.emailNotificationsEnabled ? 'false' : 'true'} />
                  <button
                    type="submit"
                    disabled={getStatus('emails').pending}
                    class="relative inline-flex h-7 w-12 items-center rounded-full border-2 border-tile-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60 {data.emailNotificationsEnabled ? 'bg-brand' : 'bg-tile-300'}"
                    aria-label="Toggle streak reminder emails"
                    aria-pressed={data.emailNotificationsEnabled}
                  >
                    <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform {data.emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}"></span>
                  </button>
                </form>
              </div>

              <!-- Leaderboard Privacy -->
              <div class="flex items-start justify-between gap-4 pt-2 border-t border-tile-600">
                <div class="min-w-0 pt-4">
                  <p class="text-sm font-medium text-text-300">Weekly leaderboard</p>
                  <p class="text-xs text-text-200 mt-0.5 opacity-80">
                    {data.leaderboardOptOut ? 'Hidden — your name is anonymous' : 'Visible'} on the weekly XP leaderboard (you always earn XP)
                  </p>
                  {#if getStatus('leaderboard').success}
                    <p class="status-ok" transition:fade>{getStatus('leaderboard').success}</p>
                  {/if}
                  {#if getStatus('leaderboard').error}
                    <p class="status-err" transition:fade>{getStatus('leaderboard').error}</p>
                  {/if}
                </div>
                <form
                  method="POST"
                  action="?/updateLeaderboardOptOut"
                  use:enhance={enhanceStatus('leaderboard', 'Leaderboard setting updated!')}
                  class="shrink-0 pt-4"
                >
                  <input type="hidden" name="leaderboard_opt_out" value={data.leaderboardOptOut ? 'false' : 'true'} />
                  <button
                    type="submit"
                    disabled={getStatus('leaderboard').pending}
                    class="relative inline-flex h-7 w-12 items-center rounded-full border-2 border-tile-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60 {!data.leaderboardOptOut ? 'bg-brand' : 'bg-tile-300'}"
                    aria-label="Toggle leaderboard visibility"
                    aria-pressed={!data.leaderboardOptOut}
                  >
                    <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform {!data.leaderboardOptOut ? 'translate-x-5' : 'translate-x-0.5'}"></span>
                  </button>
                </form>
              </div>

              {#if data.learningReason || data.proficiencyLevel !== undefined}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-tile-600">
                  {#if data.learningReason}
                    <div>
                      <span class="text-xs text-text-200 uppercase tracking-[0.15em]">Learning Reason</span>
                      <p class="text-text-300 font-medium mt-1">{data.learningReason}</p>
                    </div>
                  {/if}
                  <div>
                    <label for="proficiency_level" class="block text-xs text-text-200 uppercase tracking-[0.15em] mb-1.5">Proficiency Level</label>
                    <form
                      method="POST"
                      action="?/updateProficiencyLevel"
                      use:enhance={enhanceStatus('proficiency', 'Updated!')}
                      class="flex flex-row gap-2 items-center"
                    >
                      <select
                        id="proficiency_level"
                        name="proficiency_level"
                        class="bg-tile-300 border-2 border-tile-600 text-text-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand text-sm font-medium"
                      >
                        {#each ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as level (level)}
                          <option value={level} selected={level === data.proficiencyLevel}>{level}</option>
                        {/each}
                      </select>
                      <Button type="submit" className="px-4 py-2 text-sm" disabled={getStatus('proficiency').pending}>
                        {getStatus('proficiency').pending ? '…' : 'Save'}
                      </Button>
                    </form>
                    {#if getStatus('proficiency').success}
                      <p class="status-ok" transition:fade>{getStatus('proficiency').success}</p>
                    {/if}
                    {#if getStatus('proficiency').error}
                      <p class="status-err" transition:fade>{getStatus('proficiency').error}</p>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Account Info -->
          <div class="p-5 sm:p-6 border-b border-tile-600 bg-tile-500/30">
            <h3 class="text-xs font-bold text-text-200 mb-4 uppercase tracking-[0.15em]">Account</h3>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="min-w-0">
                <p class="text-text-300 font-medium truncate">{data.user?.email}</p>
                <p class="text-sm text-text-200 mt-0.5">
                  Plan:
                  <span class={data.hasActiveSubscription ? 'text-text-300 font-semibold' : 'text-text-200'}>
                    {data.hasActiveSubscription ? '✓ Premium' : 'Free'}
                  </span>
                </p>
              </div>
              <Button type="button" variant="danger" onClick={handleLogout} className="shrink-0">
                Sign Out
              </Button>
            </div>

            <!-- Delete Account -->
            <div class="mt-6 pt-6 border-t border-tile-600">
              {#if deleteError}
                <p class="status-err mb-3">{deleteError}</p>
              {/if}
              {#if showDeleteConfirm}
                <div class="danger-panel space-y-3" transition:slide={{ duration: 150 }}>
                  <p class="text-text-300 text-sm font-semibold">This permanently deletes your account and all your data. This cannot be undone.</p>

                  {#if data.subscriptionProvider === 'apple' && data.hasActiveSubscription}
                    <div class="bg-tile-400 border-2 border-red-500/40 rounded-lg p-3 space-y-2">
                      <p class="text-text-300 text-sm font-semibold">
                        Deleting your account does <span class="underline">not</span> cancel your Apple subscription.
                      </p>
                      <p class="text-text-200 text-sm">
                        Apple doesn't allow apps to cancel subscriptions for you. To stop being charged, cancel in
                        Settings → Apple ID → Subscriptions <strong>before</strong> deleting your account.
                      </p>
                      <a
                        href="https://apps.apple.com/account/subscriptions"
                        class="inline-block text-sm font-medium text-brand underline"
                      >
                        Open Apple Subscriptions
                      </a>
                    </div>
                  {/if}

                  <div class="flex gap-2">
                    <Button type="button" variant="danger" onClick={handleDeleteAccount} disabled={isDeleting} className="text-sm flex-1">
                      {isDeleting ? 'Deleting…' : 'Yes, delete my account'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => { showDeleteConfirm = false; deleteError = null; }} disabled={isDeleting} className="text-sm flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              {:else}
                <button
                  onclick={handleDeleteAccount}
                  class="text-sm font-medium text-red-600 hover:text-red-700 underline transition-colors"
                >
                  Delete account
                </button>
              {/if}
            </div>
          </div>

          <!-- Subscription Management (only for subscribers) -->
          {#if data.hasActiveSubscription && !isWhitelisted}
            <div class="p-5 sm:p-6 bg-tile-500/20">
              <h3 class="text-xs font-bold text-text-200 mb-4 uppercase tracking-[0.15em]">Subscription</h3>

              <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-4">
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-2xl">💳</span>
                  <div>
                    <p class="text-text-300 font-semibold">Premium Subscription</p>
                    {#if data.subscriptionDetails?.cancelAtPeriodEnd}
                      <p class="text-sm text-text-200">
                        ⚠️ Cancelling — access until {formatDate(data.subscriptionDetails.currentPeriodEnd)}
                      </p>
                    {:else}
                      <p class="text-sm text-text-200">
                        {data.subscriptionProvider === 'apple' ? 'Expires' : 'Next billing'}: {formatDate(data.subscriptionDetails?.currentPeriodEnd)}
                      </p>
                    {/if}
                  </div>
                </div>

                {#if data.subscriptionProvider === 'apple'}
                  <p class="text-sm text-text-200 mt-2">
                    Your subscription is managed through the App Store. To cancel, go to
                    <strong class="text-text-300">Settings → Apple ID → Subscriptions</strong> on your iPhone.
                  </p>
                  <button onclick={openCustomerCenter} class="mt-3 text-sm font-medium text-brand underline transition-colors">
                    Manage subscription
                  </button>
                {:else}
                  {#if cancelError}
                    <p class="status-err mb-3" transition:fade>{cancelError}</p>
                  {/if}
                  {#if cancelSuccess}
                    <p class="status-ok mb-3" transition:fade>{cancelSuccess}</p>
                  {/if}

                  {#if !data.subscriptionDetails?.cancelAtPeriodEnd}
                    {#if showCancelConfirm}
                      <div class="danger-panel space-y-3 mt-4" transition:slide={{ duration: 150 }}>
                        <p class="text-text-300 text-sm font-semibold">Are you sure you want to cancel?</p>
                        <p class="text-text-200 text-xs">You'll keep premium features until {formatDate(data.subscriptionDetails?.currentPeriodEnd)}.</p>
                        <div class="flex gap-2">
                          <Button onClick={cancelSubscription} type="button" variant="danger" disabled={isCancelling} className="flex-1 text-sm">
                            {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
                          </Button>
                          <Button onClick={cancelCancelSubscription} type="button" variant="secondary" disabled={isCancelling} className="flex-1 text-sm">
                            Keep subscription
                          </Button>
                        </div>
                      </div>
                    {:else}
                      <button onclick={cancelSubscription} class="mt-3 text-sm font-medium text-red-600 hover:text-red-700 underline transition-colors">
                        Cancel subscription
                      </button>
                    {/if}
                  {:else}
                    <p class="text-sm text-text-200 mt-2">
                      Your subscription is set to cancel. You can keep using premium features until access expires.
                    </p>
                  {/if}
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <!-- Content Section -->
    <section class="reveal" style="--d: 3;">
      <button
        onclick={() => showContent = !showContent}
        class="group w-full flex items-center gap-3 mb-5"
        aria-expanded={showContent}
      >
        <span class="text-lg">📚</span>
        <h2 class="text-lg font-bold text-text-300 uppercase tracking-wide group-hover:text-text-200 transition-colors">Your Content</h2>
        <div class="flex-1 h-px bg-tile-600"></div>
        <span class="text-text-200 text-sm transform transition-transform {showContent ? 'rotate-180' : ''}">▼</span>
      </button>

      {#if showContent}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" transition:slide={{ duration: 200 }}>
          <!-- Generated Stories -->
          <div class="bg-tile-400 border-2 border-tile-600 rounded-2xl shadow-lg overflow-hidden">
            <div class="p-4 border-b border-tile-600 bg-tile-500/30">
              <h3 class="font-bold text-text-300 flex items-center gap-2">
                <span>📖</span>
                Generated Stories
              </h3>
            </div>
            <div class="p-4">
              {#if data.userGeneratedStories && data.userGeneratedStories.length > 0}
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  {#each data.userGeneratedStories as story (story.story_body.title.english + story.created_at)}
                    <div class="bg-tile-300 p-3 rounded-lg border border-tile-600 hover:border-brand transition-colors">
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
                  <a href="/stories" class="inline-block text-sm font-medium text-brand underline">
                    Create your first story →
                  </a>
                </div>
              {/if}
            </div>
          </div>

          <!-- Review Deck actions -->
          <div class="bg-tile-400 border-2 border-tile-600 rounded-2xl shadow-lg overflow-hidden">
            <div class="p-4 border-b border-tile-600 bg-tile-500/30">
              <h3 class="font-bold text-text-300 flex items-center gap-2">
                <span>🗂️</span>
                Review Deck
              </h3>
            </div>
            <div class="p-4 space-y-3">
              <a href="/review" class="group flex items-center justify-between bg-tile-300 hover:bg-tile-500 border border-tile-600 rounded-xl px-4 py-3 text-text-300 font-medium transition-colors">
                <span>Start Review Session</span>
                <span class="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a href="/review/all-words" class="flex items-center justify-between bg-tile-300 hover:bg-tile-500 border border-tile-600 rounded-xl px-4 py-3 text-text-300 font-medium transition-colors">
                <span>View All Words</span>
                <span class="text-text-200 text-sm">{data.wordStats.total} words</span>
              </a>
              <a href="/profile/saved-words" class="flex items-center justify-between bg-tile-300 hover:bg-tile-500 border border-tile-600 rounded-xl px-4 py-3 text-text-300 font-medium transition-colors">
                <span>Export to Anki (CSV)</span>
                <span class="text-text-200 text-sm">↓</span>
              </a>

              <!-- Danger Zone -->
              <div class="pt-4 mt-2 border-t border-tile-600">
                <details class="group">
                  <summary class="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2 list-none">
                    <span>⚠️</span>
                    Danger Zone
                    <span class="text-xs opacity-60 group-open:hidden">(expand)</span>
                  </summary>

                  <div class="danger-panel mt-4">
                    <p class="text-text-200 text-sm mb-4">Clear all words from your review deck. This cannot be undone.</p>

                    {#if clearError}
                      <p class="status-err mb-3">{clearError}</p>
                    {/if}
                    {#if clearSuccess}
                      <p class="status-ok mb-3">{clearSuccess}</p>
                    {/if}

                    {#if showClearConfirm}
                      <div class="space-y-3">
                        <p class="text-text-300 text-sm font-semibold">Are you absolutely sure?</p>
                        <div class="flex gap-2">
                          <Button onClick={clearAllWords} type="button" variant="danger" disabled={isClearingWords} className="flex-1 text-sm">
                            {isClearingWords ? 'Clearing…' : 'Yes, delete all'}
                          </Button>
                          <Button onClick={cancelClear} type="button" variant="secondary" disabled={isClearingWords} className="flex-1 text-sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    {:else}
                      <Button onClick={clearAllWords} type="button" variant="danger" disabled={isClearingWords} className="w-full text-sm">
                        Clear all words
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

<style>
  /* Staggered entrance reveal */
  .reveal {
    opacity: 0;
    animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
    animation-delay: calc(var(--d, 0) * 80ms);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* Stat cards lift + brand accent on hover */
  .stat-card {
    box-shadow: 0 1px 2px hsl(var(--tile-shadow-light) / 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-3px);
    border-color: var(--brand);
    box-shadow: 0 12px 24px -10px color-mix(in srgb, var(--brand) 40%, transparent);
  }

  .accent-bar {
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: linear-gradient(90deg, var(--brand), color-mix(in srgb, var(--brand) 30%, transparent));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.25s ease;
  }

  .stat-card:hover .accent-bar {
    transform: scaleX(1);
  }

  /* Theme-aware status messages */
  :global(.status-ok),
  :global(.status-err) {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--text1);
  }

  :global(.status-ok)::before {
    content: '✓';
    color: #16a34a;
    font-weight: 700;
  }

  :global(.status-err)::before {
    content: '✕';
    color: #dc2626;
    font-weight: 700;
  }

  /* Theme-aware danger panel (works on light / dim / dark) */
  :global(.danger-panel) {
    background: color-mix(in srgb, var(--red1) 45%, var(--tile4));
    border: 1px solid color-mix(in srgb, #dc2626 35%, transparent);
    border-radius: 0.75rem;
    padding: 1rem;
  }

  details > summary::-webkit-details-marker {
    display: none;
  }
</style>
