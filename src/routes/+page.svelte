<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { currentDialect } from '$lib/store/store';
  import type { PageData } from './$types';
  import Card from '$lib/components/Card.svelte';
  import ContinueCard from '$lib/components/ContinueCard.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
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
  {#if data.user && data.weekActivityDates}
    <WeekStrip weekActivityDates={data.weekActivityDates} weekStartTimestamp={data.weekStartTimestamp} />
  {/if}

  <!-- Activity Suggestions -->
  {#if data.user && !bannerDismissed && (dailyChallengeSuggestion || reviewSuggestion || otherSuggestions.length > 0 || generatedChallengeHref)}
    <div class="mb-8 relative">
      <!-- Dismiss button -->
      <button
        onclick={dismissBanner}
        class="absolute -top-2 -right-2 z-10 w-8 h-8 bg-gradient-to-br from-tile-400 to-tile-300 hover:from-tile-500 hover:to-tile-400 border-2 border-tile-600 rounded-full flex items-center justify-center text-text-200 hover:text-text-300 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        aria-label="Dismiss suggestions"
      >
        <svg class="w-4 h-4 transform hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Daily challenge card (highest priority) -->
      {#if dailyChallengeSuggestion}
        <ContinueCard
          href={dailyChallengeSuggestion.href}
          icon={dailyChallengeSuggestion.icon}
          title={dailyChallengeSuggestion.title}
          subtitle={dailyChallengeSuggestion.subtitle}
          variant={dailyChallengeSuggestion.variant}
        />
      {:else if generatedChallengeHref}
        <ContinueCard
          href={generatedChallengeHref}
          icon="⭐"
          title="Daily Challenge"
          subtitle="Complete today's challenge for +10 bonus XP"
          variant="amber"
        />
      {/if}

      <!-- Review + other suggestions in a single 4-col row -->
      {#if reviewSuggestion || otherSuggestions.length > 0}
        <div class={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 ${dailyChallengeSuggestion || generatedChallengeHref ? 'mt-3' : ''}`}>
          {#if reviewSuggestion}
            <ContinueCard
              href={reviewSuggestion.href}
              icon={reviewSuggestion.icon}
              title={reviewSuggestion.title}
              subtitle={reviewSuggestion.subtitle}
              variant={reviewSuggestion.variant}
              compact={true}
            />
          {/if}
          {#each otherSuggestions as suggestion (suggestion.id)}
            <ContinueCard
              href={suggestion.href}
              icon={suggestion.icon}
              title={suggestion.title}
              subtitle={suggestion.subtitle}
              variant={suggestion.variant}
              compact={true}
            />
          {/each}
        </div>
      {/if}
    </div>
  {:else if !data.user}
    <!-- Non-logged in user suggestion -->
    <div class="mb-8">
      <ContinueCard
        href="/login"
        icon="🚀"
        title="Start your Arabic journey"
        subtitle="Sign in to track your progress and unlock personalized learning"
        variant="purple"
      />
    </div>
  {/if}

  <!-- Hero row: Word of the Day + Leaderboard + Featured Story + Word Map -->
  {#if data.wordOfDay || data.leaderboardTop5.length > 0 || data.featuredStory}
    <div class="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-4">
      {#if data.wordOfDay}
        <div class="lg:h-[220px] overflow-hidden rounded-2xl">
          <WordOfTheDay
            word={data.wordOfDay}
            initialSaved={data.wordOfDaySaved}
            isLoggedIn={!!data.user}
            userDialect={data.userDialect}
          />
        </div>
      {/if}
      {#if data.leaderboardTop5.length > 0}
        <div class="lg:h-[220px] overflow-hidden rounded-2xl">
          <Leaderboard
            top10={data.leaderboardTop5}
            currentUser={data.leaderboardCurrentUser}
            compact={true}
          />
        </div>
      {/if}
      {#if data.featuredStory}
        <div class="lg:h-[220px]">
          <a
            href={`/generated_story/${data.featuredStory.id}`}
            class="group flex flex-col justify-between h-full bg-tile-400 border-2 border-tile-600 rounded-xl p-5 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1"
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
              <span>→</span>
            </div>
          </a>
        </div>
      {/if}
      {#if browser && data.user && data.mapWords.length > 0}
        <div class="hidden lg:block lg:h-[220px]">
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
  {/if}

  <!-- Learn Section -->
  <div class="mb-12">
    <SectionHeader title="Learn" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        href="/alphabet"
        icon="✍️"
        title="Alphabet"
        description="Master the script. Learn the 28 letters, their forms, and how to connect them."
      />

      <Card
        href="/lessons"
        icon="📚"
        title="Lessons"
        description="Structured path. Comprehensive lessons with exercises and pronunciation practice."
      />
      <Card
        href="/review"
        icon="🧠"
        title="Review"
        description="Never forget a word. Smart spaced repetition for your personal vocabulary."
      />

      <Card
        href="/vocabulary"
        icon="📖"
        title="Vocabulary"
        description="Discover words across all dialects."
      />
    </div>
  </div>

  <!-- Practice Section -->
  <div class="mb-12">
    <SectionHeader title="Practice" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        href="/learn/game"
        icon="🎮"
        title="Game"
        description="Practice vocabulary through interactive games. Multiple choice, listening, and speaking modes."
      />
      <Card
        href="/stories"
        icon="📖"
        title="Stories"
        description="Read short stories with instant definitions, audio, and parallel translations."
      />
      <Card
        href="/sentences"
        icon="📝"
        title="Sentences"
        description="Drill sentence structures and grammar patterns in context."
      />
      <Card
        href="/egyptian-arabic/conjugations"
        icon="🔤"
        title="Verb Conjugations"
        description="Practice verb conjugations in Egyptian Arabic."
      />
      <!-- <Card
        href="/speak"
        icon="🎤"
        title="Speak"
        description="Practice pronunciation by speaking sentences and get instant feedback."
      /> -->
    </div>
  </div>

  <!-- Explore Section -->
  <!-- <div> -->
    <!-- <SectionHeader title="Explore" /> -->

    <!-- <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <Card
        href="/videos-new"
        icon="🎬"
        title="Arabic Shorts"
        description="Swipe through bite-sized video content in your target dialect."
      />

      <Card
        href="/videos"
        icon="📺"
        title="Videos"
        description="Watch authentic content with interactive transcripts and dialect-specific translations."
      />

      <Card
        href="/tutor"
        icon="💬"
        title="Tutor"
        description="Practice conversation in any dialect with an intelligent AI tutor."
      />
    </div> -->
  <!-- </div> -->
</section>
