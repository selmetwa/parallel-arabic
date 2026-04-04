<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
</script>

<svelte:head>
  <title>Learn Arabic - Alphabet, Lessons, Review & Vocabulary</title>
  <meta name="description" content="Start learning Arabic with structured lessons, master the alphabet, review vocabulary with spaced repetition, and explore words across dialects." />
</svelte:head>

<section class="px-3 py-6 sm:px-8 max-w-7xl mx-auto">
  <SectionHeader title="Learn" />

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

    <Card
      href="/learn/game"
      icon="🎮"
      title="Game"
      description="Practice vocabulary through interactive games. Multiple choice, listening, and speaking modes."
    />
  </div>
</section>
