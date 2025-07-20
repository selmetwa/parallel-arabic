<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';

  onMount(() => {
    currentDialect.set('levantine');
  });
</script>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
  <div class="text-center mb-8">
    <div class="text-8xl mb-4">🌍</div>
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-4 tracking-tight">
      Levantine Arabic
    </h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug mb-6">
      Explore the dialect of Syria, Lebanon, Palestine, and Jordan.
    </p>
    
    <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-8 max-w-2xl mx-auto">
      <h2 class="text-2xl text-text-300 font-bold mb-4">Coming Soon!</h2>
      <p class="text-text-200 leading-relaxed mb-4">
        We're working hard to bring you comprehensive Levantine Arabic lessons. 
        This will include all the features available in Egyptian Arabic, adapted for the beautiful Levantine dialect.
      </p>
      <p class="text-text-200 leading-relaxed">
        In the meantime, you can start with <a href="/egyptian-arabic" class="text-blue-400 hover:text-blue-300 underline">Egyptian Arabic</a> 
        or learn the <a href="/alphabet" class="text-blue-400 hover:text-blue-300 underline">Arabic Alphabet</a> which is shared across all dialects.
      </p>
    </div>
  </div>
  
  <div class="text-center">
    <a href="/" class="inline-block px-6 py-3 bg-tile-500 hover:bg-tile-600 text-text-200 font-medium rounded-lg border-2 border-tile-600 hover:border-tile-500 transition-all duration-300">
      ← Back to Home
    </a>
  </div>
</section> 