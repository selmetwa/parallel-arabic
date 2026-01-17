<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { currentDialect } from '$lib/store/store';
  import type { PageData } from './$types';
  import Card from '$lib/components/Card.svelte';
  import ContinueCard from '$lib/components/ContinueCard.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';

  let { data }: { data: PageData } = $props();

  // Banner dismiss state
  let bannerDismissed = $state(false);
  
  const suggestions = data.suggestions || [];
  // Separate review suggestion from others
  const reviewSuggestion = suggestions.find(s => s.id === 'review');
  const otherSuggestions = suggestions.filter(s => s.id !== 'review').slice(0, 3);

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
  });
</script>

<section class="px-3 mt-6 sm:px-8 max-w-7xl mx-auto">
  <!-- Activity Suggestions -->
  {#if data.user && !bannerDismissed && (reviewSuggestion || otherSuggestions.length > 0)}
    <div class="mb-8 relative">
      <!-- Dismiss button -->
      <button
        onclick={dismissBanner}
        class="absolute -top-2 -right-2 z-10 w-7 h-7 bg-tile-400 hover:bg-tile-500 border border-tile-600 rounded-full flex items-center justify-center text-text-200 hover:text-text-300 transition-all shadow-sm"
        aria-label="Dismiss suggestions"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <!-- Main review suggestion (if has words to review) -->
      {#if reviewSuggestion}
        <ContinueCard
          href={reviewSuggestion.href}
          icon={reviewSuggestion.icon}
          title={reviewSuggestion.title}
          subtitle={reviewSuggestion.subtitle}
          variant={reviewSuggestion.variant}
        />
      {/if}
      
      <!-- Other activity suggestions -->
      {#if otherSuggestions.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          {#each otherSuggestions as suggestion}
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
        description="Discover over 20,000 words across all dialects."
      />
    </div>
  </div>

  <!-- Practice Section -->
  <div class="mb-12">
    <SectionHeader title="Practice" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <Card
        href="/stories"
        icon="📖"
        title="Stories"
        description="Read short stories with instant definitions, audio, and parallel translations."
      />
      <Card
        href="/speak"
        icon="🎙️"
        title="Speak"
        description="Improve pronunciation with AI feedback on your spoken sentences."
      />
      <Card
      href="/sentences"
      icon="📝"
      title="Sentences"
      description="Drill sentence structures and grammar patterns in context."
    />
    </div>
  </div>

  <!-- Explore Section -->
  <div>
    <SectionHeader title="Explore" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <!-- Hidden - Videos features not ready yet
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
      -->

      <Card
        href="/tutor"
        icon="💬"
        title="Tutor"
        description="Practice conversation in any dialect with an intelligent AI tutor."
      />
    </div>
  </div>
</section>
