<script lang="ts">
  import { browser } from '$app/environment';
  import ArabicMap from '$lib/components/ArabicMap.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Word Map | Parallel Arabic</title>
</svelte:head>

<div class="min-h-screen p-4">
  <header class="mb-4">
    <h1 class="text-2xl font-bold text-text-300">Your Word Map</h1>
    <p class="text-text-200 text-sm mt-1">
      {data.words.length} saved {data.words.length === 1 ? 'word' : 'words'} across the Arab world
    </p>
  </header>

  {#if data.words.length === 0}
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <p class="text-text-200 text-lg mb-2">No saved words yet</p>
      <p class="text-text-200 text-sm">
        Start saving words from your around the site and they'll appear here.
      </p>
    </div>
  {:else}
    <div class="flex flex-wrap gap-3 mb-5">
      <a href="/review" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-tile-300 hover:bg-tile-400 border border-tile-500 text-text-300">
        <span>🧠</span>
        <span>Review your words</span>
      </a>
      <a href="/sentences" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-tile-300 hover:bg-tile-400 border border-tile-500 text-text-300">
        <span>📝</span>
        <span>Practice sentences with your words</span>
      </a>
      <a href="/stories?create=true" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-tile-300 hover:bg-tile-400 border border-tile-500 text-text-300">
        <span>📖</span>
        <span>Create a story with your reviewed words</span>
      </a>
    </div>

    {#if browser}
      <ArabicMap words={data.words} />
    {/if}
  {/if}
</div>
