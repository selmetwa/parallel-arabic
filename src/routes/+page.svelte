<!-- Design · editorial dashboard · theme-aware (HSL hue-200) · ReadexPro -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import { currentDialect } from '$lib/store/store';
  import type { PageData } from './$types';
  import ContinueCard from '$lib/components/ContinueCard.svelte';
  import WordOfTheDay from '$lib/components/WordOfTheDay.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import ArabicMap from '$lib/components/ArabicMap.svelte';
  import WeekStrip from '$lib/components/WeekStrip.svelte';

  let { data }: { data: PageData } = $props();

  let bannerDismissed = $state(false);
  let challengeGenerating = $state(false);
  let generatedChallengeHref = $state<string | null>(null);

  // Masthead greeting — neutral defaults render identically on server & client to
  // avoid a hydration mismatch; the time-of-day variant is filled in onMount.
  let greetingEn = $state('Welcome');
  let greetingAr = $state('أهلاً');
  let todayLabel = $state('');

  const suggestions = $derived(data.suggestions || []);
  const dailyChallengeSuggestion = $derived(suggestions.find(s => s.id === 'daily-challenge'));
  const reviewSuggestion = $derived(suggestions.find(s => s.id === 'review'));
  const otherSuggestions = $derived(suggestions.filter(s => s.id !== 'review' && s.id !== 'daily-challenge').slice(0, 4));

  function dismissBanner() {
    bannerDismissed = true;
    if (browser) sessionStorage.setItem('homeBannerDismissed', 'true');
  }

  onMount(() => {
    currentDialect.set('');

    const now = new Date();
    todayLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (data.user) {
      const h = now.getHours();
      greetingEn = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      greetingAr = h < 12 ? 'صباح الخير' : 'مساء الخير';
    }

    if (browser) bannerDismissed = sessionStorage.getItem('homeBannerDismissed') === 'true';

    if (browser && data.shouldGenerateChallenge && data.user) {
      challengeGenerating = true;
      fetch('/api/daily-challenge', { method: 'POST' })
        .then(r => r.json())
        .then(result => {
          if (result.success && result.challengeId) {
            return fetch('/api/daily-challenge').then(r => r.json()).then(r => {
              if (r.challenge) {
                const c = r.challenge;
                generatedChallengeHref = c.challenge_type === 'story' && c.story_id
                  ? `/generated_story/${c.story_id}?challenge=${c.id}`
                  : `/challenge/${c.id}`;
              }
            });
          }
        })
        .catch(() => { /* non-critical */ })
        .finally(() => { challengeGenerating = false; });
    }
  });
</script>

<section class="px-3 mt-6 sm:px-8 max-w-6xl mx-auto pb-12 space-y-7">

  <!-- ── Snippets ──────────────────────────────────────────────────────────── -->

  {#snippet stat(label: string, value: string | number, unit: string, href: string)}
    {#if href}
      <a
        href={resolve(href)}
        class="bg-tile-400 px-4 py-4 sm:px-5 sm:py-5 flex flex-col transition-colors duration-150 hover:bg-tile-500 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300"
      >
        <span class="text-[10px] uppercase tracking-[0.16em] text-text-200 font-semibold truncate mb-2">{label}</span>
        <span class="text-3xl sm:text-4xl font-bold text-text-300 leading-none tabular-nums">{value}{#if unit}<span class="text-xs font-medium text-text-200 ml-1.5 align-baseline">{unit}</span>{/if}</span>
      </a>
    {:else}
      <div class="bg-tile-400 px-4 py-4 sm:px-5 sm:py-5 flex flex-col">
        <span class="text-[10px] uppercase tracking-[0.16em] text-text-200 font-semibold truncate mb-2">{label}</span>
        <span class="text-3xl sm:text-4xl font-bold text-text-300 leading-none tabular-nums">{value}{#if unit}<span class="text-xs font-medium text-text-200 ml-1.5 align-baseline">{unit}</span>{/if}</span>
      </div>
    {/if}
  {/snippet}

  {#snippet sectionHead(label: string, sub: string)}
    <div class="flex items-center gap-3 mb-3">
      <h2 class="text-[11px] font-bold uppercase tracking-[0.2em] text-text-200 shrink-0">{label}</h2>
      <div class="h-px flex-1 bg-tile-500"></div>
      <span class="text-[11px] text-text-200 italic shrink-0">{sub}</span>
    </div>
  {/snippet}

  <!-- Learn tile: flex-col, icon prominent at top -->
  {#snippet tile(href: string, icon: string, title: string, desc: string)}
    <a
      href={resolve(href)}
      class="group flex flex-col gap-3 bg-tile-400 border border-tile-500 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-500 hover:shadow-md hover:border-tile-600 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
    >
      <span class="text-2xl leading-none">{icon}</span>
      <span class="min-w-0">
        <span class="block text-sm font-bold text-text-300">{title}</span>
        <span class="block text-xs text-text-200 leading-snug mt-0.5">{desc}</span>
      </span>
    </a>
  {/snippet}

  <!-- Compact tile: horizontal, for dense Practice grid -->
  {#snippet compactTile(href: string, icon: string, title: string, desc: string)}
    <a
      href={resolve(href)}
      class="group flex items-center gap-2.5 bg-tile-400 border border-tile-500 rounded-lg p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-500 hover:shadow-md hover:border-tile-600 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
    >
      <span class="text-lg leading-none shrink-0">{icon}</span>
      <span class="min-w-0">
        <span class="block text-sm font-bold text-text-300 truncate">{title}</span>
        <span class="hidden xl:block text-xs text-text-200 leading-snug mt-0.5 line-clamp-1">{desc}</span>
      </span>
    </a>
  {/snippet}

  <!-- Suggestion tile (same style as old tile, horizontal) -->
  {#snippet suggTile(href: string, icon: string, title: string, desc: string)}
    <a
      href={resolve(href)}
      class="group flex w-full items-start gap-3 bg-tile-400 border border-tile-500 rounded-lg p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-500 hover:shadow-md motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
    >
      <span class="text-xl leading-none shrink-0 mt-0.5">{icon}</span>
      <span class="min-w-0">
        <span class="block text-sm font-bold text-text-300">{title}</span>
        <span class="block text-xs text-text-200 leading-snug mt-0.5">{desc}</span>
      </span>
    </a>
  {/snippet}

  {#snippet heroTile(href: string, icon: string, title: string, desc: string)}
    <a
      href={resolve(href)}
      class="group flex w-full items-center gap-3 sm:gap-4 bg-tile-500 border-2 border-amber-400/60 rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-600 hover:shadow-md motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
    >
      <span class="text-2xl sm:text-3xl leading-none shrink-0">{icon}</span>
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2 flex-wrap">
          <span class="text-sm sm:text-base font-bold text-text-300">{title}</span>
          <span class="text-[10px] font-bold uppercase tracking-wide text-black bg-amber-400 px-1.5 py-0.5 rounded-full">Bonus XP</span>
        </span>
        <span class="block text-xs sm:text-sm text-text-200 leading-snug mt-0.5">{desc}</span>
      </span>
      <span class="text-text-200 group-hover:text-text-300 transition-colors shrink-0 text-lg" aria-hidden="true">→</span>
    </a>
  {/snippet}

  <!-- ── Week strip ──────────────────────────────────────────────────────── -->
  {#if data.user && data.weekActivityDates}
    <div class="reveal" style="animation-delay: 60ms;">
      <WeekStrip weekActivityDates={data.weekActivityDates} weekStartTimestamp={data.weekStartTimestamp} />
    </div>
  {/if}

  <!-- ── Stats ribbon ────────────────────────────────────────────────────── -->
  {#if data.user}
    <div class="reveal grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-tile-500 border border-tile-500 rounded-2xl overflow-hidden" style="animation-delay: 120ms;">
      {@render stat('Streak', data.currentStreak ?? 0, (data.currentStreak === 1 ? 'day' : 'days'), '')}
      {@render stat('Words saved', data.totalSavedWordsCount ?? 0, '', '/review/all-words')}
      {@render stat('Due to review', data.cappedReviewCount ?? data.wordsDueForReviewCount ?? 0, 'words', '/review')}
      {#if data.leaderboardCurrentUser}
        {@render stat('Weekly rank', '#' + data.leaderboardCurrentUser.rank, '', '/leaderboard')}
        {@render stat('XP this week', data.leaderboardCurrentUser.xpThisWeek, 'xp', '/leaderboard')}
      {:else}
        {@render stat('Stories read', data.totalStoriesViewed ?? 0, '', '/stories')}
        {@render stat('Sentences', data.totalSentencesViewed ?? 0, '', '/sentences')}
      {/if}
    </div>
  {/if}

  <!-- ── Activity suggestions ────────────────────────────────────────────── -->
  {#if data.user && !bannerDismissed && (dailyChallengeSuggestion || reviewSuggestion || otherSuggestions.length > 0 || generatedChallengeHref)}
    <div class="reveal relative rounded-2xl bg-tile-300 border border-tile-500 overflow-hidden" style="animation-delay: 180ms;">
      <!-- Amber accent bar -->
      <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>

      <div class="p-4 sm:p-5">
        <!-- Dismiss -->
        <button
          onclick={dismissBanner}
          class="absolute top-3.5 right-3.5 z-10 w-6 h-6 rounded-full bg-tile-500 border border-tile-600 flex items-center justify-center text-text-200 hover:text-text-300 hover:bg-tile-600 transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
          aria-label="Dismiss suggestions"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="flex items-center gap-2 mb-3 pr-8">
          <span class="text-sm" aria-hidden="true">⚡</span>
          <h2 class="text-[11px] font-bold uppercase tracking-[0.18em] text-text-300">Jump back in</h2>
          <div class="h-px flex-1 bg-tile-500"></div>
        </div>

        {#if dailyChallengeSuggestion}
          {@render heroTile(dailyChallengeSuggestion.href, dailyChallengeSuggestion.icon, dailyChallengeSuggestion.title, dailyChallengeSuggestion.subtitle)}
        {:else if generatedChallengeHref}
          {@render heroTile(generatedChallengeHref, '⭐', 'Daily Challenge', "Complete today's challenge for +10 bonus XP")}
        {/if}

        {#if reviewSuggestion || otherSuggestions.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 {dailyChallengeSuggestion || generatedChallengeHref ? 'mt-2.5' : ''}">
            {#if reviewSuggestion}
              {@render suggTile(reviewSuggestion.href, reviewSuggestion.icon, reviewSuggestion.title, reviewSuggestion.subtitle)}
            {/if}
            {#each otherSuggestions as suggestion (suggestion.id)}
              {@render suggTile(suggestion.href, suggestion.icon, suggestion.title, suggestion.subtitle)}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {:else if !data.user}
    <div class="reveal" style="animation-delay: 120ms;">
      <ContinueCard
        href="/login"
        icon="🚀"
        title="Start your Arabic journey"
        subtitle="Sign in to track your progress and unlock personalized learning"
        variant="purple"
      />
    </div>
  {/if}

  <!-- ── Learn ───────────────────────────────────────────────────────────── -->
  <div class="reveal" style="animation-delay: 240ms;">
    {@render sectionHead('Learn', 'build the foundation')}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {@render tile('/alphabet', '✍️', 'Alphabet', 'The 28 letters, their forms, and how they connect.')}
      {@render tile('/lessons', '📚', 'Lessons', 'A structured path with exercises and pronunciation.')}
      {@render tile('/review', '🧠', 'Review', 'Spaced repetition that schedules words to stick.')}
    </div>
  </div>

  <!-- ── Practice ───────────────────────────────────────────────────────── -->
  <div class="reveal pb-4" style="animation-delay: 300ms;">
    {@render sectionHead('Practice', 'use what you know')}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {@render compactTile('/learn/game', '🎮', 'Game', 'Vocab drills: multiple-choice, listening, speaking.')}
      {@render compactTile('/stories', '📖', 'Stories', 'Graded reading with tap-to-define and native audio.')}
      {@render compactTile('/sentences', '📝', 'Sentences', 'Build sentences; drill grammar in context.')}
      {@render compactTile('/conjugations', '🔄', 'Conjugations', 'Drill verb conjugations across dialects by typing or quiz.')}
      {@render compactTile('/speak', '🎤', 'Speak', 'Say sentences aloud and get instant feedback.')}
      {@render compactTile('/tutor', '💬', 'Tutor', 'Chat with an AI tutor in any dialect.')}
    </div>
  </div>

</section>

<style>
  @keyframes reveal {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .reveal {
    animation: reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal {
      animation: none;
    }
  }
</style>
