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

<div class="min-h-screen bg-tile-200">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-text-300 mb-2">Import Words</h1>
      <p class="text-text-200">Add words from vocabulary categories to your review deck</p>
    </header>

    <div class="bg-tile-300 border border-tile-500 rounded-lg shadow-lg p-6 sm:p-8">
      <div class="space-y-6">
        <!-- Dialect Selection -->
        <div>
          <label class="block text-text-300 font-semibold mb-2">Dialect</label>
          <select
            bind:value={selectedDialect}
            class="w-full bg-tile-400 border border-tile-600 text-text-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-tile-600"
          >
            {#each dialectOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Category Selection -->
        <div>
          <label class="block text-text-300 font-semibold mb-2">
            Category
            {#if selectedDialect === 'egyptian-arabic'}
              <span class="text-text-200 text-sm font-normal ml-2">(Recommended: Most common words)</span>
            {/if}
          </label>
          <select
            bind:value={selectedCategory}
            class="w-full bg-tile-400 border border-tile-600 text-text-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-tile-600"
          >
            {#each currentSections as section}
              <option value={section.path} selected={section.path === 'most_common'}>
                {section.name} {section.isPaywalled ? '(Premium)' : ''}
              </option>
            {/each}
          </select>
        </div>

        <!-- Limit Selection -->
        <div>
          <label class="block text-text-300 font-semibold mb-2">
            Number of Words
          </label>
          <input
            type="number"
            bind:value={importLimit}
            min="1"
            max="200"
            class="w-full bg-tile-400 border border-tile-600 text-text-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-tile-600"
          />
          <p class="text-text-200 text-sm mt-1">Import up to {importLimit} words from this category</p>
        </div>

        <!-- Import Button -->
        <div class="pt-4">
          <Button 
            onClick={importWords} 
            type="button" 
            disabled={isImporting}
            className="w-full"
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
          <div class="mt-6 p-4 rounded-lg {importResult.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'}">
            {#if importResult.success}
              <p class="text-green-800 font-semibold mb-2">Success!</p>
              <p class="text-green-700 mb-4">
                {importResult.message || `Imported ${importResult.imported} word${importResult.imported !== 1 ? 's' : ''}`}
                {importResult.skipped > 0 && ` (${importResult.skipped} already in your deck)`}
              </p>
              {#if importResult.imported > 0}
                <Button 
                  onClick={() => goto('/review')} 
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Reviewing Now →
                </Button>
              {/if}
            {:else}
              <p class="text-red-800 font-semibold mb-2">Error</p>
              <p class="text-red-700">{importResult.message}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Info Box -->
    <div class="mt-6 bg-tile-300 border border-tile-500 rounded-lg p-4">
      <h3 class="text-text-300 font-semibold mb-2">💡 Tips</h3>
      <ul class="text-text-200 space-y-1 text-sm">
        {#if selectedDialect === 'egyptian-arabic'}
          <li>• Start with "Most common words" for the best learning experience</li>
        {:else}
          <li>• Choose categories that match your learning goals</li>
        {/if}
        <li>• Words you already have saved will be skipped automatically</li>
        <li>• You can import from multiple categories to build your review deck</li>
        <li>• Review your words regularly for best results!</li>
      </ul>
    </div>
  </div>
</div>

