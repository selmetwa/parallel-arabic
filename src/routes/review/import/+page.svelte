<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  type Dialect = 'egyptian-arabic' | 'darija' | 'fusha' | 'levantine';

  let selectedDialect = $state<Dialect>('egyptian-arabic');
  let selectedCategory = $state('most_common'); // Default to most_common
  let importLimit = $state(50);
  let isImporting = $state(false);
  let importResult = $state<{ success: boolean; imported: number; skipped: number; message?: string } | null>(null);

  const dialectOptions: Array<{ value: Dialect; label: string }> = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic' },
    { value: 'fusha', label: 'Modern Standard Arabic (Fusha)' },
    { value: 'levantine', label: 'Levantine Arabic' },
    { value: 'darija', label: 'Moroccan Darija' }
  ];

  const currentSections = $derived.by(() => {
    return data.sections[selectedDialect] || [];
  });

  async function importWords() {
    isImporting = true;
    importResult = null;

    try {
      const response = await fetch('/api/import-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dialect: selectedDialect,
          category: selectedCategory,
          limit: importLimit
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import words');
      }

      importResult = {
        success: true,
        imported: result.imported || 0,
        skipped: result.skipped || 0,
        message: result.message
      };
    } catch (error) {
      importResult = {
        success: false,
        imported: 0,
        skipped: 0,
        message: error instanceof Error ? error.message : 'Failed to import words'
      };
    } finally {
      isImporting = false;
    }
  }
</script>

<div class="min-h-screen bg-tile-300 py-12">
  <div class="max-w-3xl mx-auto px-4 sm:px-6">
    <header class="mb-12 text-center">
      <h1 class="text-4xl sm:text-5xl font-bold text-text-300 tracking-tight mb-4">Import Words</h1>
      <p class="text-lg sm:text-xl text-text-200 max-w-2xl mx-auto">
        Add words from vocabulary categories to your review deck
      </p>
    </header>

    <div class="bg-tile-400/50 border-2 border-tile-600 rounded-xl shadow-lg p-8 sm:p-10">
      <div class="space-y-8">
        <!-- Dialect Selection -->
        <div>
          <label class="block text-lg font-bold text-text-300 mb-3">Select Dialect</label>
          <div class="relative">
            <select
              bind:value={selectedDialect}
              class="w-full appearance-none bg-tile-300 border-2 border-tile-500 text-text-300 px-5 py-4 rounded-xl focus:outline-none focus:border-tile-600 focus:ring-0 transition-colors text-lg"
            >
              {#each dialectOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-text-300">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Category Selection -->
        <div>
          <label class="block text-lg font-bold text-text-300 mb-3">
            Choose Category
            {#if selectedDialect === 'egyptian-arabic'}
              <span class="text-text-200 text-sm font-normal ml-2 block sm:inline sm:ml-2 mt-1 sm:mt-0">Recommended: Most common words</span>
            {/if}
          </label>
          <div class="relative">
            <select
              bind:value={selectedCategory}
              class="w-full appearance-none bg-tile-300 border-2 border-tile-500 text-text-300 px-5 py-4 rounded-xl focus:outline-none focus:border-tile-600 focus:ring-0 transition-colors text-lg"
            >
              {#each currentSections as section}
                <option value={section.path} selected={section.path === 'most_common'}>
                  {section.name} {section.isPaywalled ? '(Premium)' : ''}
                </option>
              {/each}
            </select>
             <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-text-300">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Limit Selection -->
        <div>
          <label class="block text-lg font-bold text-text-300 mb-3">
            Number of Words
          </label>
          <div class="relative">
            <input
              type="number"
              bind:value={importLimit}
              min="1"
              max="200"
              class="w-full bg-tile-300 border-2 border-tile-500 text-text-300 px-5 py-4 rounded-xl focus:outline-none focus:border-tile-600 focus:ring-0 transition-colors text-lg"
            />
          </div>
          <p class="text-text-200 text-sm mt-2 ml-1">Import up to {importLimit} words from this category</p>
        </div>

        <!-- Import Button -->
        <div class="pt-4">
          <Button 
            onClick={importWords} 
            type="button" 
            disabled={isImporting}
            className="w-full !py-4 !text-lg !rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            {#if isImporting}
              Importing...
            {:else}
              Import Words
            {/if}
          </Button>
        </div>

        <!-- Result Message -->
        {#if importResult}
          <div class="mt-6 p-6 rounded-xl border-2 {importResult.success ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}">
            {#if importResult.success}
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">✅</span>
                <h3 class="text-xl font-bold text-green-800">Success!</h3>
              </div>
              <p class="text-green-700 mb-6 text-lg">
                {importResult.message || `Imported ${importResult.imported} word${importResult.imported !== 1 ? 's' : ''}`}
                {importResult.skipped > 0 && ` (${importResult.skipped} already in your deck)`}
              </p>
              {#if importResult.imported > 0}
                <Button 
                  onClick={() => goto('/review')} 
                  type="button"
                  className="!bg-green-600 !hover:bg-green-700 !text-white w-full !py-3 !text-lg"
                >
                  Start Reviewing Now →
                </Button>
              {/if}
            {:else}
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">❌</span>
                <h3 class="text-xl font-bold text-red-800">Error</h3>
              </div>
              <p class="text-red-700">{importResult.message}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Info Box -->
    <div class="mt-8 bg-tile-400/30 border-2 border-tile-500 rounded-xl p-6 sm:p-8">
      <h3 class="text-xl font-bold text-text-300 mb-4 flex items-center gap-2">
        <span>💡</span> Tips for Success
      </h3>
      <ul class="text-text-200 space-y-3 text-base">
        {#if selectedDialect === 'egyptian-arabic'}
          <li class="flex gap-2"><span class="text-text-300">•</span> Start with "Most common words" for the best learning experience</li>
        {:else}
          <li class="flex gap-2"><span class="text-text-300">•</span> Choose categories that match your learning goals</li>
        {/if}
        <li class="flex gap-2"><span class="text-text-300">•</span> Words you already have saved will be skipped automatically</li>
        <li class="flex gap-2"><span class="text-text-300">•</span> You can import from multiple categories to build your review deck</li>
        <li class="flex gap-2"><span class="text-text-300">•</span> Review your words regularly for best results!</li>
      </ul>
    </div>
  </div>
</div>
