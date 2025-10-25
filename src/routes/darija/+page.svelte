<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';

  onMount(() => {
    currentDialect.set('darija');
  });
</script>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
  <div class="text-left mb-6">
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">
      Moroccan Arabic (Darija)
    </h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug">
      Explore the unique dialect of Morocco. Known for its distinctive vocabulary and French/Berber influences.
    </p>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    <a href="/darija/write" class="group px-3 py-4 flex-col flex gap-1 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
      <h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Writing Practice</h2>
      <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">Learn Arabic writing with 2,200+ practice words in Darija.</p>
    </a>
    
    <a href="/darija/vocab" class="group px-3 py-4 flex-col flex gap-1 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
      <h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Vocabulary Builder</h2>
      <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">2,200+ words through multiple-choice quizzes in Darija dialect.</p>
    </a>
  </div>
</section> 