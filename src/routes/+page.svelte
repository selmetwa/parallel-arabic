<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';
  import type { PageData } from './$types';
  import Card from '$lib/components/Card.svelte';
  import ContinueCard from '$lib/components/ContinueCard.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';

  let { data }: { data: PageData } = $props();

  onMount(() => {
    currentDialect.set('');
  });
</script>

<section class="px-3 mt-6 sm:px-8 max-w-7xl mx-auto">
  <!-- Continue Card - Top Section -->
  {#if data.user}
    <div class="mb-8">
      {#if data.cappedReviewCount > 0}
        <ContinueCard
          href="/review"
          icon="📚"
          title="You have {data.cappedReviewCount} word{data.cappedReviewCount !== 1 ? 's' : ''} to review"
          subtitle="Keep your vocabulary fresh with spaced repetition"
          variant="blue"
        />
      {:else}
        <ContinueCard
          href="/review"
          icon="💾"
          title="Start Building Your Vocabulary"
          subtitle="Add words to your review deck to practice with spaced repetition"
          variant="blue"
        />
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
        description="Build your vocabulary with flashcards and spaced repetition."
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
    </div>
  </div>
</section>