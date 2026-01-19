<script lang="ts">
  import PaywallModal from '$lib/components/PaywallModal.svelte';

  interface Category {
    name: string;
    path: string;
    count: number;
    isPaywalled: boolean;
  }

  interface Dialect {
    name: string;
    slug: string;
    emoji: string;
    categories: Category[];
    totalWords: number;
  }

  let { data } = $props();

  let isModalOpen = $state(false);
  let selectedDialect = $state<string>(data.dialects[0]?.slug || 'egyptian-arabic');
  let isDownloading = $state<string | null>(null);
  let downloadError = $state<string | null>(null);

  let currentDialect = $derived(
    data.dialects.find((d: Dialect) => d.slug === selectedDialect) || data.dialects[0]
  );

  function openPaywallModal() {
    isModalOpen = true;
  }

  function handleCloseModal() {
    isModalOpen = false;
  }

  async function downloadDeck(category: string, dialectSlug: string, isPaywalled: boolean) {
    if (isPaywalled && !data.isSubscribed) {
      openPaywallModal();
      return;
    }

    const downloadKey = `${dialectSlug}-${category}`;
    isDownloading = downloadKey;
    downloadError = null;

    try {
      const params = new URLSearchParams({
        dialect: dialectSlug,
        category: category
      });

      const response = await fetch(`/api/anki-export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate deck');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dialectSlug}-${category}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      downloadError = error instanceof Error ? error.message : 'Download failed';
      console.error('Download error:', error);
    } finally {
      isDownloading = null;
    }
  }

  async function downloadAllWords(dialectSlug: string) {
    if (!data.isSubscribed) {
      openPaywallModal();
      return;
    }

    const downloadKey = `${dialectSlug}-all`;
    isDownloading = downloadKey;
    downloadError = null;

    try {
      const params = new URLSearchParams({
        dialect: dialectSlug,
        category: 'all'
      });

      const response = await fetch(`/api/anki-export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate deck');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dialectSlug}-all-vocabulary.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      downloadError = error instanceof Error ? error.message : 'Download failed';
      console.error('Download error:', error);
    } finally {
      isDownloading = null;
    }
  }

  function getDialectColor(slug: string): string {
    const colors: Record<string, string> = {
      'egyptian-arabic': 'bg-blue-500 hover:bg-blue-600',
      'levantine': 'bg-purple-500 hover:bg-purple-600',
      'darija': 'bg-orange-500 hover:bg-orange-600',
      'fusha': 'bg-green-500 hover:bg-green-600'
    };
    return colors[slug] || 'bg-gray-500 hover:bg-gray-600';
  }

  function getDialectBorderColor(slug: string): string {
    const colors: Record<string, string> = {
      'egyptian-arabic': 'border-blue-500',
      'levantine': 'border-purple-500',
      'darija': 'border-orange-500',
      'fusha': 'border-green-500'
    };
    return colors[slug] || 'border-gray-500';
  }
</script>

<section class="min-h-screen bg-tile-300">
  <PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

  <!-- Header Section -->
  <header class="border-b-2 border-tile-600 bg-tile-400 shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div class="text-center">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 mb-4">
          Anki Decks
        </h1>
        <p class="text-lg sm:text-xl text-text-200 leading-relaxed mb-4">
          Download Arabic vocabulary flashcard decks for Anki across all dialects
        </p>
        {#if !data.isSubscribed}
          <div class="bg-tile-500 border-2 border-tile-600 p-4 max-w-2xl mx-auto rounded-lg">
            <p class="text-base text-text-200">
              Subscribe to access all vocabulary decks and enhance your learning experience
            </p>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <!-- Import Instructions -->
  <section class="py-6 border-b border-tile-600">
    <div class="max-w-7xl mx-auto px-4 sm:px-8">
      <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6">
        <h2 class="text-xl font-bold text-text-300 mb-3">How to Import</h2>
        <ol class="list-decimal list-inside text-text-200 space-y-2">
          <li>Download the deck file (tab-separated text format)</li>
          <li>Open Anki and go to <strong>File &rarr; Import</strong></li>
          <li>Select the downloaded file</li>
          <li>Set "Fields separated by: Tab" and "Allow HTML in fields: Yes"</li>
          <li>Map fields: Field 1 = Front, Field 2 = Back</li>
          <li>Click Import</li>
        </ol>
        <p class="text-sm text-text-200 mt-4">
          <strong>Card format:</strong> Arabic word on front, English translation + transliteration + audio (if available) on back
        </p>
      </div>
    </div>
  </section>

  <!-- Dialect Tabs -->
  <section class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-8">
      <div class="flex flex-wrap gap-2 mb-8">
        {#each data.dialects as dialect}
          <button
            onclick={() => selectedDialect = dialect.slug}
            class="px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 {
              selectedDialect === dialect.slug
                ? `${getDialectColor(dialect.slug)} text-white shadow-lg`
                : 'bg-tile-400 text-text-200 hover:bg-tile-500 border-2 border-tile-600'
            }"
          >
            <span class="text-xl">{dialect.emoji}</span>
            <span>{dialect.name}</span>
            <span class="text-sm opacity-75">({dialect.totalWords.toLocaleString()})</span>
          </button>
        {/each}
      </div>

      {#if currentDialect}
        <!-- All Words Card -->
        <div class="mb-8">
          <div class="bg-tile-400 border-2 {getDialectBorderColor(currentDialect.slug)} rounded-xl p-6 shadow-lg">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 class="text-2xl font-bold text-text-300 flex items-center gap-2">
                  <span class="text-3xl">{currentDialect.emoji}</span>
                  All {currentDialect.name} Vocabulary
                </h3>
                <p class="text-text-200 mt-1">
                  {currentDialect.totalWords.toLocaleString()} words across all categories
                </p>
              </div>
              <div class="flex items-center gap-3">
                {#if !data.isSubscribed}
                  <span class="text-2xl">🔒</span>
                {/if}
                <button
                  onclick={() => downloadAllWords(currentDialect.slug)}
                  disabled={isDownloading === `${currentDialect.slug}-all`}
                  class="px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-md {
                    isDownloading === `${currentDialect.slug}-all`
                      ? 'bg-tile-500 text-text-200 cursor-wait'
                      : `${getDialectColor(currentDialect.slug)} text-white`
                  }"
                >
                  {#if isDownloading === `${currentDialect.slug}-all`}
                    <span class="flex items-center gap-2">
                      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  {:else}
                    Download All
                  {/if}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories Grid -->
        <h2 class="text-2xl font-bold text-text-300 mb-4">Categories</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each currentDialect.categories as category}
            <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-text-300 text-base leading-tight">{category.name}</h3>
                {#if category.isPaywalled && !data.isSubscribed}
                  <span class="text-xl">🔒</span>
                {/if}
              </div>

              <div class="mb-4">
                <span class="inline-block bg-tile-500 border border-tile-600 px-3 py-1 text-sm font-medium text-text-200 rounded">
                  {category.count.toLocaleString()} Words
                </span>
              </div>

              <button
                onclick={() => downloadDeck(category.path, currentDialect.slug, category.isPaywalled)}
                disabled={isDownloading === `${currentDialect.slug}-${category.path}`}
                class="w-full px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-300 shadow-md {
                  isDownloading === `${currentDialect.slug}-${category.path}`
                    ? 'bg-tile-500 text-text-200 cursor-wait'
                    : 'bg-tile-600 border-2 border-tile-600 text-text-300 hover:bg-tile-700'
                }"
              >
                {#if isDownloading === `${currentDialect.slug}-${category.path}`}
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                {:else}
                  Download Deck
                {/if}
              </button>
            </div>
          {/each}
        </div>

        {#if currentDialect.categories.length === 0}
          <div class="text-center py-12 bg-tile-400 border-2 border-dashed border-tile-500 rounded-xl">
            <div class="text-6xl mb-4">📚</div>
            <p class="text-text-200 text-xl">No categories available for this dialect yet</p>
          </div>
        {/if}
      {/if}

      {#if downloadError}
        <div class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {downloadError}
        </div>
      {/if}
    </div>
  </section>
</section>
