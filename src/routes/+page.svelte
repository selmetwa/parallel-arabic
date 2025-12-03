<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  onMount(() => {
    currentDialect.set('');
  });
</script>

<section class="px-4 mt-12 sm:px-8 max-w-7xl mx-auto mb-20">
  <!-- Review CTA Section -->
  {#if data.user}
    <div class="mb-6">
      <a 
        href="/review" 
        class="block bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-700 rounded-lg p-3 sm:p-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-center group"
      >
        {#if data.cappedReviewCount > 0}
          <div class="text-3xl mb-2">📚</div>
          <h2 class="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors">
            You have {data.cappedReviewCount} word{data.cappedReviewCount !== 1 ? 's' : ''} to review
          </h2>
          <p class="text-blue-100 text-xs sm:text-sm">
            Keep your vocabulary fresh with spaced repetition
          </p>
        {:else}
          <div class="text-3xl mb-2">💾</div>
          <h2 class="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors">
            Start Building Your Vocabulary
          </h2>
          <p class="text-blue-100 text-xs sm:text-sm">
            Add words to your review deck to practice with spaced repetition
          </p>
        {/if}
      </a>
    </div>
  {/if}

  <!-- Getting Started -->
  <div class="mb-16">
    <div class="flex items-center gap-4 mb-6">
      <h2 class="text-2xl sm:text-3xl text-text-300 font-bold">Building blocks</h2>
      <div class="h-0.5 bg-tile-500 flex-1 opacity-50 rounded-full"></div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <a href="/alphabet" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">✍️</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">Arabic Alphabet</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Master the script. Learn the 28 letters, their forms, and how to connect them.
        </p>
      </a>

      <a href="/lessons" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">📚</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">Lessons</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Structured path. Comprehensive lessons with exercises and pronunciation practice.
        </p>
      </a>

      <a href="/review" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">🧠</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">Vocabulary Review</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Never forget a word. Smart spaced repetition for your personal vocabulary.
        </p>
      </a>
    </div>
  </div>

  <!-- Immersion & Content -->
  <div class="mb-16">
    <div class="flex items-center gap-4 mb-6">
      <h2 class="text-2xl sm:text-3xl text-text-300 font-bold">Immersion & Content</h2>
      <div class="h-0.5 bg-tile-500 flex-1 opacity-50 rounded-full"></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <a href="/stories" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">📖</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">Stories</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Read short stories with instant definitions, audio, and parallel translations.
        </p>
      </a>

      <a href="/videos" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">📺</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">Videos</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Watch authentic content with interactive transcripts and dialect-specific translations.
        </p>
      </a>
    </div>
  </div>

  <!-- Interactive Practice -->
  <div>
    <div class="flex items-center gap-4 mb-6">
      <h2 class="text-2xl sm:text-3xl text-text-300 font-bold">Interactive Practice</h2>
      <div class="h-0.5 bg-tile-500 flex-1 opacity-50 rounded-full"></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <a href="/speak" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">🎙️</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">Speak</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Improve pronunciation with AI feedback on your spoken sentences.
        </p>
      </a>

      <a href="/tutor" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">💬</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">AI Tutor</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Practice conversation in any dialect with an intelligent AI tutor.
        </p>
      </a>

      <a href="/sentences" class="group flex flex-col bg-tile-400 border-2 border-tile-600 rounded-lg p-8 shadow-lg hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 hover:-translate-y-1">
        <div class="text-4xl mb-4">📝</div>
        <h3 class="text-2xl font-bold text-text-300 mb-2 group-hover:text-text-200 transition-colors">Sentences</h3>
        <p class="text-text-200 text-base leading-relaxed opacity-90 group-hover:opacity-100">
          Drill sentence structures and grammar patterns in context.
        </p>
      </a>
    </div>
  </div>
</section>