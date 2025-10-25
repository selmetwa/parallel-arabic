<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';

  onMount(() => {
    currentDialect.set('');
  });
</script>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
  <div class="text-left mb-6">
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">
      Welcome to Parallel Arabic
    </h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug">
      A comprehensive practice environment for Arabic dialects and Modern Standard Arabic.
    </p>
  </div>
  <div class="mb-8">
    <h2 class="text-2xl text-text-300 font-bold mb-4">Resources</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <a href="/stories" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Stories</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Read short stories with translations and AI definitions.
        </p>
      </a>
      <a href="/videos" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Videos</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Watch and learn from YouTube videos with transcripts, translations, and transliterations.
        </p>
      </a>
      <a href="/sentences" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Sentences</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Practice with AI-generated sentences in your chosen Arabic dialect.
        </p>
      </a>
      <a href="/speak" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Speak</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Practice speaking Arabic with AI-generated sentences and audio feedback.
        </p>
      </a>
         
    <a href="/alphabet" class="group px-3 py-4 flex-col flex gap-1 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
      <h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Arabic Alphabet</h2>
      <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">Learn the 28 letters and their connections.</p>
    </a>
    
    </div>
  </div>
  <div class="mb-8">
    <h2 class="text-2xl text-text-300 font-bold mb-4">Vocabulary Practice</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Egyptian Arabic -->
      <a href="/egyptian-arabic" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Egyptian Arabic</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Learn the most widely understood Arabic dialect. Perfect for movies, music, and everyday conversation across the Arab world.
        </p>
        <div class="mt-2 text-xs text-text-200 opacity-75">
         ✓ Vocabulary ✓ Writing ✓ Grammar ✓ Anki Decks
        </div>
      </a>

      <!-- Modern Standard Arabic (Fusha) -->
      <a href="/fusha" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Modern Standard Arabic</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Master formal Arabic used in news, literature, and official communications. The foundation of all Arabic dialects.
        </p>
        <div class="mt-2 text-xs text-text-200 opacity-75">
          ✓ Vocabulary ✓ Writing
        </div>
      </a>

      <!-- Levantine Arabic -->
      <!-- <a href="/levantine" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Levantine Arabic</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Explore the dialect of Syria, Lebanon, Palestine, and Jordan. Known for its melodic sound and cultural richness.
        </p>
        <div class="mt-2 text-xs text-text-200 opacity-75">
          ✓ Stories ✓ Speaking ✓ Sentences ✓ Vocabulary ✓ Writing
        </div>
      </a> -->

      <!-- Moroccan Arabic (Darija) -->
      <a href="/darija" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Moroccan Arabic</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Explore the unique dialect of Morocco. Known for its distinctive vocabulary and French/Berber influences.
        </p>
        <div class="mt-2 text-xs text-text-200 opacity-75">
          ✓ Vocabulary ✓ Writing
        </div>
      </a>

      <!-- Khaleeji Arabic -->
      <!-- <a href="/khaleeji" class="group px-4 py-6 flex-col flex gap-2 border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
        <h3 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Khaleeji Arabic</h3>
        <p class="text-text-300 text-sm font-medium leading-tight opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          Master the Gulf Arabic dialect spoken in UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, and Oman.
        </p>
        <div class="mt-2 text-xs text-text-200 opacity-75">
          ✓ Stories ✓ Speaking ✓ Sentences
        </div>
      </a> -->
    </div>
  </div>
</section>
