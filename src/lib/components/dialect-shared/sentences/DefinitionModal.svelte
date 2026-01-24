<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import AudioButton from "$lib/components/AudioButton.svelte";
  import SaveButton from "$lib/components/SaveButton.svelte";
  import Button from "$lib/components/Button.svelte";
  import DialectComparisonModal from './DialectComparisonModal.svelte';
  import { type Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';

  type Props = {
    activeWordObj: {
      english?: string;
      arabic?: string;
      description?: string;
      isLoading?: boolean;
      transliteration?: string;
      transliterated?: string;
    };
    isModalOpen: boolean;
    closeModal: () => void;
    dialect: Dialect;
  }

  let { activeWordObj = {
    english: "",
    arabic: "",
    description: "",
    isLoading: false,
  }, isModalOpen = false, closeModal, dialect }: Props = $props();

  // Parse description as JSON if possible
  let parsedDescription = $derived.by(() => {
    if (!activeWordObj.description) return null;
    try {
      let content = activeWordObj.description;

      // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
      if (content.includes('```')) {
        content = content
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
      }

      // Extract just the JSON object if there's extra text before/after
      const jsonStartIndex = content.indexOf('{');
      if (jsonStartIndex !== -1) {
        let braceCount = 0;
        let jsonEndIndex = jsonStartIndex;

        for (let i = jsonStartIndex; i < content.length; i++) {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEndIndex = i + 1;
            break;
          }
        }

        content = content.substring(jsonStartIndex, jsonEndIndex);
      }

      return JSON.parse(content);
    } catch {
      return null;
    }
  });

  // Check if description is an error message
  let isError = $derived(
    activeWordObj.description?.includes('Error') ||
    activeWordObj.description?.includes('Failed') ||
    activeWordObj.description?.includes('error')
  );

  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state<DialectComparisonSchema | null>(null);
  let isComparing = $state(false);
  let comparisonError = $state<string | null>(null);

  const dialectDisplayNames: Record<string, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    'levantine': 'Levantine Arabic',
    'darija': 'Moroccan Darija',
    'fusha': 'Modern Standard Arabic',
    'iraqi': 'Iraqi Arabic',
    'khaleeji': 'Khaleeji Arabic'
  };

  async function compareDialects() {
    isComparing = true;
    isComparisonModalOpen = true;
    comparisonData = null;
    comparisonError = null;

    try {
        const res = await fetch('/api/compare-dialects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: activeWordObj.arabic,
              currentDialect: dialect,
              transliteration: activeWordObj.transliterated || activeWordObj.transliteration
            })
        });

        if (res.ok) {
            comparisonData = await res.json();
        } else {
            const errorData = await res.json().catch(() => ({ message: 'Failed to compare dialects' }));
            comparisonError = errorData.message || 'Failed to compare dialects. Please try again.';
        }
    } catch (e) {
        comparisonError = e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
    } finally {
        isComparing = false;
    }
  }

  function closeComparisonModal() {
    isComparisonModalOpen = false;
  }
</script>

<DialectComparisonModal
    isOpen={isComparisonModalOpen}
    closeModal={closeComparisonModal}
    originalText={activeWordObj.arabic}
    originalEnglish={activeWordObj.english}
    {comparisonData}
    isLoading={isComparing}
    error={comparisonError}
    currentDialect={dialect}
/>

<Modal isOpen={isModalOpen} handleCloseModal={closeModal} width="max(70%, 600px)" height="fit-content">
  <div class="flex flex-col p-6 max-w-2xl mx-auto">

    <!-- Loading State -->
    {#if activeWordObj.isLoading}
      <div role="status" class="flex flex-col items-center py-12">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-tile-500 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
        <p class="mt-4 text-lg text-text-200 animate-pulse">Finding definition...</p>
      </div>

    <!-- Error State -->
    {:else if isError && !parsedDescription}
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-text-300 mb-2">Oops! Something went wrong</h3>
        <p class="text-text-200">We couldn't load the definition. Please try again.</p>
        <button
          onclick={closeModal}
          class="mt-4 px-6 py-2 bg-tile-500 text-text-300 rounded-lg hover:bg-tile-600 transition-colors"
        >
          Try Again
        </button>
      </div>

    <!-- Content -->
    {:else if parsedDescription}
      <!-- Header: Word Display -->
      <div class="text-center mb-6 pb-6 border-b-2 border-tile-500">
        <!-- Arabic Word (large) -->
        <h2 class="text-5xl sm:text-6xl font-bold text-text-300 mb-3" dir="rtl">
          {parsedDescription?.arabic || activeWordObj.arabic}
        </h2>

        <!-- Transliteration -->
        {#if parsedDescription?.transliteration}
          <p class="text-xl text-text-200 italic mb-2">
            {parsedDescription.transliteration}
          </p>
        {/if}

        <!-- English (if different from definition) -->
        {#if activeWordObj.english && activeWordObj.english !== parsedDescription?.definition}
          <p class="text-lg text-text-200">
            "{activeWordObj.english}"
          </p>
        {/if}

        <!-- Dialect Badge -->
        <span class="inline-block mt-3 px-3 py-1 bg-tile-500 text-text-200 text-sm rounded-full">
          {dialectDisplayNames[dialect] || dialect}
        </span>
      </div>

      <!-- Main Definition -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-text-300">Definition</h3>
        </div>
        <p class="text-xl text-text-300 leading-relaxed pl-10">
          {parsedDescription.definition}
        </p>
      </div>

      <!-- Contextual Meaning -->
      {#if parsedDescription.contextualMeaning}
        <div class="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <div>
              <p class="text-sm font-semibold text-amber-800 mb-1">In this context</p>
              <p class="text-amber-900">{parsedDescription.contextualMeaning}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Word Breakdown -->
      {#if parsedDescription.breakdown && parsedDescription.breakdown.length > 0}
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-text-300">Word Breakdown</h3>
          </div>

          <div class="grid gap-3 pl-10">
            {#each parsedDescription.breakdown as item, index}
              <div class="flex items-center gap-4 p-3 bg-tile-300 rounded-xl border border-tile-500 hover:border-tile-600 transition-colors">
                <!-- Number Badge -->
                <div class="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>

                <!-- Arabic -->
                <div class="flex-shrink-0 min-w-[80px]">
                  <p class="text-2xl font-bold text-text-300" dir="rtl">{item.arabic}</p>
                </div>

                <!-- Details -->
                <div class="flex-1 border-l-2 border-tile-500 pl-4">
                  <p class="text-sm text-violet-600 font-semibold uppercase tracking-wide">
                    {item.englishLabel || item.word}
                  </p>
                  <p class="text-text-200 italic text-sm">{item.transliteration}</p>
                  <p class="text-text-300 mt-1">{item.meaning}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-tile-500">
        <!-- Audio Button -->
        {#if activeWordObj.arabic || parsedDescription?.arabic}
          <div class="flex-1">
            <AudioButton
              text={parsedDescription?.arabic || activeWordObj.arabic || ''}
              {dialect}
              className="w-full"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>
                </svg>
                Listen
              </span>
            </AudioButton>
          </div>
        {/if}

        <!-- Compare Button -->
        <div class="flex-1">
          <Button onClick={compareDialects} type="button">
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Compare Dialects
            </span>
          </Button>
        </div>

        <!-- Save Button -->
        <div class="flex-1">
          <SaveButton
            objectToSave={{
              arabic: parsedDescription?.arabic || activeWordObj.arabic,
              english: parsedDescription?.definition || activeWordObj.english,
              transliterated: parsedDescription?.transliteration || activeWordObj.transliteration || activeWordObj.transliterated
            }}
            type="Word"
          />
        </div>
      </div>

    <!-- Parsing Failed State (has description but couldn't parse) -->
    {:else if activeWordObj.description}
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-text-300 mb-2">Unable to load definition</h3>
        <p class="text-text-200 mb-4">We had trouble processing the response. Please try again.</p>
        <button
          onclick={closeModal}
          class="px-6 py-2 bg-tile-500 text-text-300 rounded-lg hover:bg-tile-600 transition-colors"
        >
          Close
        </button>
      </div>

    {:else}
      <!-- Empty State -->
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-tile-400 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-text-200">Click on a word to see its definition</p>
      </div>
    {/if}
  </div>
</Modal>
