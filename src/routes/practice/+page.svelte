<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
</script>

<svelte:head>
  <title>Practice Arabic - Stories, Sentences & Speaking</title>
  <meta name="description" content="Practice Arabic with interactive stories, sentence drills, and speaking exercises. Improve your reading, grammar, and pronunciation skills." />
</svelte:head>

<section class="px-3 py-6 sm:px-8 max-w-7xl mx-auto">
  <SectionHeader title="Practice" />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      href="/speak"
      icon="🎤"
      title="Speak"
      description="Practice pronunciation by speaking sentences and get instant feedback."
    />
  </div>
</section>
