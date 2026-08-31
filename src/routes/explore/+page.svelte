<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
</script>

<section class="px-3 py-6 sm:px-8 max-w-7xl mx-auto">
  <SectionHeader title="Explore" />

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
  </div>
</section>
