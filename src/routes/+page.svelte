<!-- Design · dense editorial control panel · theme-aware (HSL hue-200) · ReadexPro -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { currentDialect } from '$lib/store/store';
  import type { PageData } from './$types';
  import ContinueCard from '$lib/components/ContinueCard.svelte';
  import WordOfTheDay from '$lib/components/WordOfTheDay.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import ArabicMap from '$lib/components/ArabicMap.svelte';
  import WeekStrip from '$lib/components/WeekStrip.svelte';

  let { data }: { data: PageData } = $props();

  // Banner dismiss state
  let bannerDismissed = $state(false);
  let challengeGenerating = $state(false);
  let generatedChallengeHref = $state<string | null>(null);

  const suggestions = $derived(data.suggestions || []);
  // Separate challenge, review, and other suggestions
  const dailyChallengeSuggestion = $derived(suggestions.find(s => s.id === 'daily-challenge'));
  const reviewSuggestion = $derived(suggestions.find(s => s.id === 'review'));
  const otherSuggestions = $derived(suggestions.filter(s => s.id !== 'review' && s.id !== 'daily-challenge').slice(0, 4));

  function dismissBanner() {
    bannerDismissed = true;
    if (browser) {
      // Store dismissal for this session only (will reset on page refresh/new session)
      sessionStorage.setItem('homeBannerDismissed', 'true');
    }
  }

  onMount(() => {
    currentDialect.set('');

    // Check if banner was dismissed this session
    if (browser) {
      bannerDismissed = sessionStorage.getItem('homeBannerDismissed') === 'true';
    }

    // Lazy-generate a daily challenge if needed and user is logged in
    if (browser && data.shouldGenerateChallenge && data.user) {
      challengeGenerating = true;
      fetch('/api/daily-challenge', { method: 'POST' })
        .then(r => r.json())
        .then(result => {
          if (result.success && result.challengeId) {
            // Redirect to fetch the challenge type to build the correct href
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

<section class="px-3 mt-6 sm:px-8 max-w-7xl mx-auto">

  <!-- Reusable dense primitives -->
  {#snippet stat(label: string, value: string | number, unit: string, href: string)}
    {#if href}
      <a
        {href}
        class="bg-tile-400 px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-1 transition-colors duration-150 hover:bg-tile-500 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-text-300"
      >
        <span class="text-[11px] uppercase tracking-wider text-text-200 font-semibold truncate">{label}</span>
        <span class="text-xl sm:text-2xl font-bold text-text-300 leading-none">{value}{#if unit}<span class="text-xs font-medium text-text-200 ml-1">{unit}</span>{/if}</span>
      </a>
    {:else}
      <div class="bg-tile-400 px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-1">
        <span class="text-[11px] uppercase tracking-wider text-text-200 font-semibold truncate">{label}</span>
        <span class="text-xl sm:text-2xl font-bold text-text-300 leading-none">{value}{#if unit}<span class="text-xs font-medium text-text-200 ml-1">{unit}</span>{/if}</span>
      </div>
    {/if}
  {/snippet}

  {#snippet sectionHead(label: string, sub: string)}
    <div class="flex items-baseline gap-3 sm:gap-4 mb-3 mt-1">
      <h2 class="text-lg sm:text-xl font-bold text-text-300 tracking-tight shrink-0">{label}</h2>
      <div class="h-px flex-1 bg-tile-500"></div>
      <span class="text-xs text-text-200 shrink-0">{sub}</span>
    </div>
  {/snippet}

  {#snippet tile(href: string, icon: string, title: string, desc: string)}
    <a
      {href}
      class="group flex w-full items-start gap-3 bg-tile-400 border border-tile-500 rounded-lg p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-500 hover:shadow-md motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
    >
      <span class="text-2xl leading-none shrink-0 mt-0.5">{icon}</span>
      <span class="min-w-0">
        <span class="block text-sm font-bold text-text-300">{title}</span>
        <span class="block text-xs text-text-200 leading-snug mt-0.5">{desc}</span>
      </span>
    </a>
  {/snippet}

  {#snippet heroTile(href: string, icon: string, title: string, desc: string)}
    <a
      {href}
      class="group flex w-full items-center gap-3 sm:gap-4 bg-tile-500 border border-amber-400/60 rounded-lg p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-600 hover:shadow-md motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
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

  {#if data.user && data.weekActivityDates}
    <WeekStrip weekActivityDates={data.weekActivityDates} weekStartTimestamp={data.weekStartTimestamp} />
  {/if}

  <!-- Stats ribbon — surfaces progress data already loaded by the server -->
  {#if data.user}
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-tile-500 border border-tile-500 rounded-xl overflow-hidden">
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

  <!-- Activity Suggestions -->
  {#if data.user && !bannerDismissed && (dailyChallengeSuggestion || reviewSuggestion || otherSuggestions.length > 0 || generatedChallengeHref)}
    <!-- Elevated panel so the "what to do next" zone stands out from the flat sections below -->
    <div class="mb-6 relative rounded-2xl border border-tile-500 bg-tile-300 p-3 sm:p-4 shadow-md">
      <!-- Dismiss button -->
      <button
        onclick={dismissBanner}
        class="absolute top-3 right-3 z-10 w-7 h-7 bg-tile-400 hover:bg-tile-500 border border-tile-500 rounded-full flex items-center justify-center text-text-200 hover:text-text-300 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
        aria-label="Dismiss suggestions"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="flex items-center gap-2 mb-3 pr-9">
        <span class="text-base" aria-hidden="true">⚡</span>
        <h2 class="text-sm font-bold text-text-300 tracking-tight">Jump back in</h2>
        <div class="h-px flex-1 bg-tile-500"></div>
      </div>

      <!-- Daily challenge as a gold hero bar; remaining suggestions stay calm tiles for contrast -->
      {#if dailyChallengeSuggestion}
        {@render heroTile(dailyChallengeSuggestion.href, dailyChallengeSuggestion.icon, dailyChallengeSuggestion.title, dailyChallengeSuggestion.subtitle)}
      {:else if generatedChallengeHref}
        {@render heroTile(generatedChallengeHref, '⭐', 'Daily Challenge', "Complete today's challenge for +10 bonus XP")}
      {/if}

      {#if reviewSuggestion || otherSuggestions.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 {dailyChallengeSuggestion || generatedChallengeHref ? 'mt-3' : ''}">
          {#if reviewSuggestion}
            {@render tile(reviewSuggestion.href, reviewSuggestion.icon, reviewSuggestion.title, reviewSuggestion.subtitle)}
          {/if}
          {#each otherSuggestions as suggestion (suggestion.id)}
            {@render tile(suggestion.href, suggestion.icon, suggestion.title, suggestion.subtitle)}
          {/each}
        </div>
      {/if}
    </div>
  {:else if !data.user}
    <!-- Non-logged in user suggestion -->
    <div class="mb-6">
      <ContinueCard
        href="/login"
        icon="🚀"
        title="Start your Arabic journey"
        subtitle="Sign in to track your progress and unlock personalized learning"
        variant="purple"
      />
    </div>
  {/if}

  <!-- Discovery row: Leaderboard + Featured Story + Word Map -->
  <!-- {#if data.wordOfDay || data.leaderboardTop5.length > 0 || data.featuredStory}
    <div class="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {#if data.leaderboardTop5.length > 0}
        <div class="lg:h-[180px] overflow-hidden rounded-xl">
          <Leaderboard
            top10={data.leaderboardTop5}
            currentUser={data.leaderboardCurrentUser}
            compact={true}
          />
        </div>
      {/if}
      {#if data.featuredStory}
        <div class="lg:h-[180px]">
          <a
            href={`/generated_story/${data.featuredStory.id}`}
            class="group flex flex-col justify-between h-full bg-tile-400 border border-tile-500 rounded-xl p-4 shadow-sm hover:bg-tile-500 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300"
          >
            <div class="flex flex-col gap-2 min-w-0">
              <span class="text-xs font-semibold uppercase tracking-widest text-text-200">Recommended Story</span>
              <span class="text-lg font-bold text-text-300 group-hover:text-text-200 transition-colors leading-snug">
                {data.featuredStory.title}
              </span>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-tile-500 text-text-300">
                  {data.featuredStory.dialectName}
                </span>
                {#if data.featuredStory.difficulty}
                  <span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-tile-300 text-text-200 border border-tile-500">
                    {data.featuredStory.difficulty.toUpperCase()}
                  </span>
                {/if}
              </div>
            </div>
            <div class="mt-4 flex items-center gap-1.5 text-text-200 group-hover:text-text-300 transition-colors font-medium text-sm">
              <span>Read Story</span>
              <span aria-hidden="true">→</span>
            </div>
          </a>
        </div>
      {/if}
      {#if browser && data.user && data.mapWords.length > 0}
        <div class="hidden lg:block lg:h-[180px]">
          <div class="relative rounded-xl overflow-hidden h-full">
            <div style="pointer-events: none;">
              <ArabicMap words={data.mapWords} preview={true} />
            </div>
            <div class="absolute inset-x-0 bottom-0 h-12 pointer-events-none" style="background: linear-gradient(to bottom, transparent, #0f0f19);"></div>
            <a
              href="/map"
              class="absolute inset-0 z-10 flex items-end justify-end p-3 group"
              aria-label="View full word map"
            >
              <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md group-hover:shadow-lg group-hover:scale-105"
                style="background: rgba(15,15,25,0.8); color: #eeeeee; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(6px);">
                View full map →
              </span>
            </a>
          </div>
        </div>
      {/if}
    </div>
  {/if} -->

  <!-- Learn -->
  <div class="mb-8">
    {@render sectionHead('Learn', 'build the foundation')}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {@render tile('/alphabet', '✍️', 'Alphabet', 'The 28 letters, their forms, and how they connect.')}
      {@render tile('/lessons', '📚', 'Lessons', 'A structured path with exercises and pronunciation.')}
      {@render tile('/review', '🧠', 'Review', 'Spaced repetition that schedules words to stick.')}
    </div>
  </div>

  <!-- Practice -->
  <div class="mb-8">
    {@render sectionHead('Practice', 'use what you know')}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {@render tile('/learn/game', '🎮', 'Game', 'Vocab drills: multiple-choice, listening, speaking.')}
      {@render tile('/stories', '📖', 'Stories', 'Graded reading with tap-to-define and native audio.')}
      {@render tile('/sentences', '📝', 'Sentences', 'Build sentences; drill grammar in context.')}
      {@render tile('/conjugations', '🔄', 'Conjugations', 'Drill verb conjugations across dialects by typing or quiz.')}
      {@render tile('/speak', '🎤', 'Speak', 'Say sentences aloud and get instant feedback.')}
      {@render tile('/tutor', '💬', 'Tutor', 'Chat with an AI tutor in any dialect.')}
    </div>
  </div>
</section>
