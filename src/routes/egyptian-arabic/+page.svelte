<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';

  onMount(() => {
    currentDialect.set('egyptian-arabic');
  });
</script>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
  <div class="text-left mb-6">
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">
      Egyptian Arabic
    </h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug">
      Learn the most widely understood Arabic dialect, spoken by over 100 million people and shaped by Egypt's rich culture and media.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    <a href="/lessons/structured/egyptian-arabic" class="group px-3 py-4 flex-col flex gap-1 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
      <h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Lessons</h2>
      <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">Structured lessons covering greetings, family, food, travel, and more.</p>
    </a>

    <a href="/stories?dialect=egyptian-arabic" class="group px-3 py-4 flex-col flex gap-1 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
      <h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Stories</h2>
      <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">Read and listen to Egyptian Arabic stories to build comprehension.</p>
    </a>

    <a href="/vocabulary?dialect=egyptian-arabic" class="group px-3 py-4 flex-col flex gap-1 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
      <h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Vocabulary</h2>
      <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">2,400+ words through multiple-choice quizzes in Egyptian Arabic.</p>
    </a>

    <a href="/egyptian-arabic/conjugations" class="group px-3 py-4 flex-col flex gap-1 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
      <h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Verb Conjugations</h2>
      <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">Practice conjugating Egyptian Arabic verbs across all tenses and persons.</p>
    </a>
  </div>
</section>
