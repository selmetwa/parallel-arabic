<script lang="ts">
  import SaveButton from '$lib/components/SaveButton.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import Button from '$lib/components/Button.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';

  interface Word {
    id: string;
    arabic_word: string;
    english_word: string;
    transliterated_word: string;
    dialect: string;
    category: string;
    audio_url: string | null;
    frequency: number | null;
  }

  let { data } = $props();

  let selectedDialect = $state(data.dialectFilter);
  let selectedCategory = $state(data.categoryFilter);
  let searchValue = $state(data.searchQuery);
  let viewMode = $state<'cards' | 'table'>('cards');
  
  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state<DialectComparisonSchema | null>(null);
  let isComparing = $state(false);
  let comparisonText = $state('');
  let comparisonEnglish = $state('');
  let comparisonError = $state<string | null>(null);
  let comparisonDialect = $state<Dialect>('fusha');

  // Intersection Observer for lazy rendering - separate triggers for cards and table
  let visibleCount = $state(30);
  let cardsLoadMoreTrigger: HTMLDivElement | null = null;
  let tableLoadMoreTrigger: HTMLDivElement | null = null;

  $effect(() => {
    const trigger = viewMode === 'cards' ? cardsLoadMoreTrigger : tableLoadMoreTrigger;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < data.words.length) {
          visibleCount += 30;
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  });

  // Reset visible count when filters change
  $effect(() => {
    data.words;
    visibleCount = 30;
  });

  // Reset category to 'all' when dialect changes
  let previousDialect = $state<string | undefined>(undefined);
  $effect(() => {
    if (previousDialect !== undefined && selectedDialect !== previousDialect) {
      selectedCategory = 'all';
    }
    previousDialect = selectedDialect;
  });

  // Auto-apply filters when dialect, category, or search changes
  let isInitialMount = $state(true);
  $effect(() => {
    // Skip on initial mount to avoid unnecessary navigation
    if (isInitialMount) {
      isInitialMount = false;
      return;
    }
    
    selectedDialect;
    selectedCategory;
    searchValue;
    // Use a small timeout to debounce rapid changes (longer for search)
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, searchValue !== undefined ? 300 : 100);
    return () => clearTimeout(timeoutId);
  });

  let visibleWords = $derived(data.words.slice(0, visibleCount));

  // Get available categories based on selected dialect
  let availableCategories = $derived.by(() => {
    if (selectedDialect === 'all') {
      // Combine all categories from all dialects
      const allCategories = new Set<string>();
      Object.values(data.categories).forEach((cats: any[]) => {
        cats.forEach(cat => allCategories.add(cat.path));
      });
      return Array.from(allCategories).sort().map(path => ({
        path,
        name: path.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));
    }
    return data.categories[selectedDialect as keyof typeof data.categories] || [];
  });

  async function compareWord(word: Word) {
    isComparing = true;
    isComparisonModalOpen = true;
    comparisonData = null;
    comparisonText = word.arabic_word;
    comparisonEnglish = word.english_word;
    comparisonDialect = word.dialect as Dialect;
    comparisonError = null;

    try {
      const res = await fetch('/api/compare-dialects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: word.arabic_word,
          currentDialect: word.dialect as Dialect,
          transliteration: word.transliterated_word,
          english: word.english_word
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

  function applyFilters() {
    const params = new URLSearchParams();
    if (selectedDialect !== 'all') params.set('dialect', selectedDialect);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchValue) params.set('search', searchValue);

    goto(`/vocabulary?${params.toString()}`, { keepFocus: true });
  }

  function resetFilters() {
    selectedDialect = 'all';
    selectedCategory = 'all';
    searchValue = '';
    goto('/vocabulary');
  }

  function getDialectLabel(dialect: string): string {
    const labels: { [key: string]: string } = {
      'egyptian-arabic': 'Egyptian',
      'levantine': 'Levantine',
      'darija': 'Darija',
      'fusha': 'Fusha'
    };
    return labels[dialect] || dialect;
  }

  function getDialectColor(dialect: string): string {
    const colors: { [key: string]: string } = {
      'egyptian-arabic': 'bg-blue-500',
      'levantine': 'bg-purple-500',
      'darija': 'bg-orange-500',
      'fusha': 'bg-green-500'
    };
    return colors[dialect] || 'bg-gray-500';
  }
</script>

<section class="px-3 mt-6 sm:px-8 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="text-left mb-6">
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">
      Vocabulary Explorer
    </h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug">
      Browse and learn from our comprehensive vocabulary database across all dialects.
    </p>
  </div>

  <!-- Filters Section -->
  <div class="bg-tile-400 border-2 border-tile-600 p-4 mb-6 rounded-lg">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <!-- Dialect Filter -->
      <div>
        <label for="dialect" class="block text-sm font-semibold text-text-300 mb-2">
          Dialect
        </label>
        <select
          id="dialect"
          bind:value={selectedDialect}
          class="w-full px-3 py-2 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Dialects</option>
          {#each data.dialects as dialect}
            <option value={dialect}>{getDialectLabel(dialect)}</option>
          {/each}
        </select>
      </div>

      <!-- Category Filter -->
      <div>
        <label for="category" class="block text-sm font-semibold text-text-300 mb-2">
          Category
        </label>
        <select
          id="category"
          bind:value={selectedCategory}
          class="w-full px-3 py-2 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {#each availableCategories as category}
            <option value={category.path}>{category.name}</option>
          {/each}
        </select>
      </div>

      <!-- Search -->
      <div>
        <label for="search" class="block text-sm font-semibold text-text-300 mb-2">
          Search
        </label>
        <input
          id="search"
          type="text"
          bind:value={searchValue}
          placeholder="Search words..."
          class="w-full px-3 py-2 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>

  </div>

  <!-- View Mode Selector -->
  <div class="flex gap-2 mb-4 border-b border-tile-600 pb-2">
    <button
      onclick={() => viewMode = 'cards'}
      class="px-4 py-2 rounded-lg transition-colors font-semibold {viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-tile-400 text-text-200 md:hover:bg-tile-500'}"
    >
      Cards
    </button>
    <button
      onclick={() => viewMode = 'table'}
      class="px-4 py-2 rounded-lg transition-colors font-semibold {viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-tile-400 text-text-200 md:hover:bg-tile-500'}"
    >
      Table
    </button>
  </div>

  <!-- Results Count -->
  <div class="mb-4">
    <p class="text-text-200 text-sm">
      Showing {visibleCount} of {data.words.length} word{data.words.length !== 1 ? 's' : ''}
    </p>
  </div>

  <!-- Cards View -->
  {#if viewMode === 'cards'}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each visibleWords as word (word.id)}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-4 md:hover:shadow-lg transition-shadow">
          <!-- Dialect Badge -->
          <div class="mb-3">
            <span class="inline-block px-2 py-1 text-xs font-bold text-white rounded {getDialectColor(word.dialect)}">
              {getDialectLabel(word.dialect)}
            </span>
            <span class="inline-block ml-2 px-2 py-1 text-xs font-semibold bg-tile-500 text-text-200 rounded">
              {word.category.replace(/_/g, ' ')}
            </span>
          </div>

          <!-- Arabic Word -->
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-2xl font-bold text-text-300 text-left">
              {word.arabic_word}
            </h3>
            <AudioButton
              text={word.arabic_word}
              dialect={word.dialect}
              audioUrl={word.audio_url || undefined}
              className="text-text-300"
            />
          </div>

          <!-- Transliteration -->
          <p class="text-sm text-text-200 italic mb-2">
            {word.transliterated_word}
          </p>

          <!-- English Translation -->
          <p class="text-lg font-semibold text-text-300 mb-3">
            {word.english_word}
          </p>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            <SaveButton
              objectToSave={{
                arabic: word.arabic_word,
                english: word.english_word,
                transliterated: word.transliterated_word
              }}
              type="Word"
            />
            <button
              onclick={() => compareWord(word)}
              class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg md:hover:bg-purple-700 transition-all duration-200 shadow-sm md:hover:shadow-md"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
              <span>Compare</span>
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Load More Trigger for Cards -->
    {#if visibleCount < data.words.length}
      <div bind:this={cardsLoadMoreTrigger} class="h-20 flex items-center justify-center">
        <div class="animate-pulse text-text-200">Loading more...</div>
      </div>
    {/if}
  {/if}

  <!-- Table View -->
  {#if viewMode === 'table'}
    <div class="overflow-x-auto bg-tile-400 border-2 border-tile-600 rounded-lg">
      <table class="w-full">
        <thead class="bg-tile-500 border-b-2 border-tile-600">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-bold text-text-300">Arabic</th>
            <th class="px-4 py-3 text-left text-sm font-bold text-text-300">Transliteration</th>
            <th class="px-4 py-3 text-left text-sm font-bold text-text-300">English</th>
            <th class="px-4 py-3 text-left text-sm font-bold text-text-300">Dialect</th>
            <th class="px-4 py-3 text-left text-sm font-bold text-text-300">Category</th>
            <th class="px-4 py-3 text-center text-sm font-bold text-text-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each visibleWords as word (word.id)}
            <tr class="border-b border-tile-600 md:hover:bg-tile-500 transition-colors">
              <td class="px-4 py-3 text-text-300 font-semibold text-left">
                {word.arabic_word}
              </td>
              <td class="px-4 py-3 text-text-200 italic">
                {word.transliterated_word}
              </td>
              <td class="px-4 py-3 text-text-300 font-semibold">
                {word.english_word}
              </td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-1 text-xs font-bold text-white rounded {getDialectColor(word.dialect)}">
                  {getDialectLabel(word.dialect)}
                </span>
              </td>
              <td class="px-4 py-3 text-text-200 text-sm">
                {word.category.replace(/_/g, ' ')}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2 items-center justify-center flex-wrap">
                  <AudioButton
                    text={word.arabic_word}
                    dialect={word.dialect}
                    audioUrl={word.audio_url || undefined}
                    className="text-text-300"
                  />
                  <SaveButton
                    objectToSave={{
                      arabic: word.arabic_word,
                      english: word.english_word,
                      transliterated: word.transliterated_word
                    }}
                    type="Word"
                  />
                  <button
                    onclick={() => compareWord(word)}
                    class="inline-flex shrink-0 items-center justify-center p-1 rounded md:hover:bg-purple-600 transition-colors text-purple-500 md:hover:text-white"
                    aria-label="Compare dialects"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Load More Trigger for Table -->
    {#if visibleCount < data.words.length}
      <div bind:this={tableLoadMoreTrigger} class="h-20 flex items-center justify-center bg-tile-400 border-x-2 border-b-2 border-tile-600">
        <div class="animate-pulse text-text-200">Loading more...</div>
      </div>
    {/if}
  {/if}

  <!-- Comparison Modal -->
  <DialectComparisonModal
    isOpen={isComparisonModalOpen}
    closeModal={closeComparisonModal}
    originalText={comparisonText}
    originalEnglish={comparisonEnglish}
    comparisonData={comparisonData}
    isLoading={isComparing}
    error={comparisonError}
    currentDialect={comparisonDialect}
  />

  <!-- Empty State -->
  {#if data.words.length === 0}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">📚</div>
      <h3 class="text-2xl font-bold text-text-300 mb-2">No words found</h3>
      <p class="text-text-200 mb-4">Try adjusting your filters or search query</p>
      <Button onClick={resetFilters} type="button">Reset Filters</Button>
    </div>
  {/if}
</section>
