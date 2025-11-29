<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import RadioButton from '$lib/components/RadioButton.svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
  import { toast } from 'svelte-sonner';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  type Dialect = 'egyptian-arabic' | 'darija' | 'fusha' | 'levantine';

  let selectedDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
  let csvDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
  let selectedCategory = $state('');
  let importMode = $state<'category' | 'csv'>('category');
  let csvFile = $state<File | null>(null);
  let csvFileError = $state('');
  
  // Initialize selected category based on dialect
  $effect(() => {
    const sections = data.sections[selectedDialect] || [];
    if (sections.length > 0) {
      // If no category selected or current category doesn't exist in new dialect, reset it
      const currentCategoryExists = sections.some(s => s.path === selectedCategory);
      if (!selectedCategory || !currentCategoryExists) {
        // Prefer 'most_common' if available, otherwise use first section
        const mostCommon = sections.find(s => s.path === 'most_common');
        selectedCategory = mostCommon ? 'most_common' : sections[0].path;
      }
    }
  });
  let importLimit = $state(50);
  let isImporting = $state(false);
  let importProgress = $state<{ current: number; total: number } | null>(null);
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

  function setDialect(event: any) {
    selectedDialect = event.target.value as Dialect;
    // Category will be reset by the effect when dialect changes
  }

  function setCategory(event: any) {
    selectedCategory = event.target.value;
  }

  function handleCSVFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    csvFileError = '';
    
    if (file) {
      // Check file size (500KB limit)
      const maxSize = 500 * 1024; // 500KB
      if (file.size > maxSize) {
        csvFileError = 'File size must be less than 500KB';
        csvFile = null;
        return;
      }
      
      // Check file type
      const allowedTypes = ['text/csv', 'text/plain', 'application/csv'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (!allowedTypes.includes(file.type) && !['csv', 'txt'].includes(fileExtension || '')) {
        csvFileError = 'Only CSV and TXT files are allowed';
        csvFile = null;
        return;
      }
      
      csvFile = file;
    } else {
      csvFile = null;
    }
  }

  async function importWords() {
    isImporting = true;
    importResult = null;
    importProgress = null;

    try {
      if (importMode === 'csv') {
        if (!csvFile) {
          throw new Error('Please select a CSV or TXT file');
        }
        
        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('dialect', csvDialect);
        
        // Use EventSource-like approach with fetch and ReadableStream
        const response = await fetch('/api/import-words-csv', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to import words' }));
          throw new Error(errorData.error || 'Failed to import words');
        }

        // Handle Server-Sent Events stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Failed to read response stream');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  // Update progress state for UI (progress bar), but don't show toast
                  importProgress = { current: data.current, total: data.total };
                } else if (data.type === 'success') {
                  importResult = {
                    success: true,
                    imported: data.imported || 0,
                    skipped: data.skipped || 0,
                    message: data.message
                  };
                  
                  // Show success toast only when done
                  setTimeout(() => {
                    toast.success(data.message || 'Words imported successfully!', {
                      description: data.imported > 0 
                        ? `${data.imported} word${data.imported !== 1 ? 's' : ''} added to your review deck`
                        : 'All words were already in your deck',
                      action: data.imported > 0 ? {
                        label: 'Start Reviewing',
                        onClick: () => goto('/review')
                      } : undefined,
                      duration: 5000
                    });
                  }, 100);
                  
                  // Reset CSV file on success
                  csvFile = null;
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Failed to import words');
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      } else {
        // Category import (non-streaming)
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
      
        // Show success toast
        toast.success(result.message || 'Words imported successfully!', {
          description: result.imported > 0 
            ? `${result.imported} word${result.imported !== 1 ? 's' : ''} added to your review deck`
            : 'All words were already in your deck',
          action: result.imported > 0 ? {
            label: 'Start Reviewing',
            onClick: () => goto('/review')
          } : undefined,
          duration: 5000
        });
      }
    } catch (error) {
      importResult = {
        success: false,
        imported: 0,
        skipped: 0,
        message: error instanceof Error ? error.message : 'Failed to import words'
      };
      
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Failed to import words'
      });
    } finally {
      isImporting = false;
      importProgress = null;
    }
  }
</script>

<div class="min-h-screen bg-tile-300 py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <header class="mb-12 text-center">
      <h1 class="text-4xl sm:text-5xl font-bold text-text-300 tracking-tight mb-4">Import Words</h1>
      <p class="text-lg sm:text-xl text-text-200 max-w-2xl mx-auto">
        Add words from vocabulary categories to your review deck
      </p>
    </header>

    <div class="bg-tile-400/50 border-2 border-tile-600 rounded-xl shadow-lg p-8 sm:p-10">
      <div class="space-y-8">
        <!-- Import Mode Selection -->
        <div class="flex flex-col gap-4">
          <h2 class="text-2xl font-bold text-text-300">Import Method</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RadioButton
              className="!text-lg !font-medium"
              wrapperClass="!p-4 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
              onClick={(e) => { importMode = e.target.value as 'category' | 'csv'; }}
              selectableFor="category"
              isSelected={importMode === 'category'}
              value="category"
              text="From Categories"
            />
            <RadioButton
              className="!text-lg !font-medium"
              wrapperClass="!p-4 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
              onClick={(e) => { importMode = e.target.value as 'category' | 'csv'; }}
              selectableFor="csv"
              isSelected={importMode === 'csv'}
              value="csv"
              text="Upload File"
            />
          </div>
        </div>

        {#if importMode === 'csv'}
          <!-- CSV Upload Section -->
          <div class="flex flex-col gap-4">
            <h2 class="text-2xl font-bold text-text-300">Upload CSV or TXT File</h2>
            <p class="text-text-200 text-sm">
              Upload a CSV file with columns: arabic, english, transliteration (optional).
              Or upload an unstructured TXT file with Arabic text (one word or phrase per line).
              Missing fields will be automatically generated using AI.
            </p>
            
            <!-- Dialect Selection for CSV -->
            <div class="flex flex-col gap-4">
              <h3 class="text-xl font-bold text-text-300">Select Dialect</h3>
              <p class="text-text-200 text-sm">
                Please specify the dialect for the words in your CSV file.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each dialectOptions as option}
                  <RadioButton
                    className="!text-lg !font-medium"
                    wrapperClass="!p-4 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
                    onClick={(e) => { csvDialect = e.target.value as Dialect; }}
                    selectableFor={`csv-${option.value}`}
                    isSelected={csvDialect === option.value}
                    value={option.value}
                    text={option.label}
                  />
                {/each}
              </div>
            </div>
            
            <div class="relative border-2 border-dashed border-tile-500 rounded-xl p-8 text-center transition-all duration-200 hover:border-tile-600 hover:bg-tile-400/30">
              {#if csvFile}
                <div class="space-y-4">
                  <div class="flex items-center justify-center">
                    <div class="w-16 h-16 rounded-full bg-green-100/20 flex items-center justify-center text-green-500">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p class="text-base font-bold text-text-300 mb-1">{csvFile.name}</p>
                    <p class="text-xs font-medium text-text-200 bg-tile-400/50 px-2 py-1 rounded-full inline-block">
                      {Math.round(csvFile.size / 1024)}KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onclick={() => { csvFile = null; csvFileError = ''; }}
                    class="px-4 py-2 bg-tile-400 text-text-300 rounded-lg hover:bg-tile-500 transition-colors text-sm font-medium border border-tile-500 hover:border-tile-600"
                  >
                    Remove File
                  </button>
                </div>
              {:else}
                <div class="space-y-4">
                  <div class="flex items-center justify-center">
                    <div class="w-16 h-16 rounded-full bg-tile-400/50 flex items-center justify-center text-tile-600">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p class="text-lg font-bold text-text-300 mb-1">Drop CSV or TXT file here</p>
                    <p class="text-sm text-text-200">or click anywhere to browse</p>
                  </div>
                  <div class="text-xs text-text-200 opacity-70">
                    CSV, TXT (max 500KB)
                  </div>
                </div>
                
                <input
                  type="file"
                  accept=".csv,.txt"
                  onchange={handleCSVFileSelect}
                  class="inset-0 absolute w-full h-full opacity-0 cursor-pointer"
                />
              {/if}
            </div>
            
            {#if csvFileError}
              <div class="p-3 bg-red-50/50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-600">{csvFileError}</p>
              </div>
            {/if}
            
            <div class="bg-tile-300/50 border border-tile-500 rounded-lg p-4 text-sm text-text-200">
              <p class="font-medium text-text-300 mb-2">File Format:</p>
              <p class="font-medium text-text-300 mb-1">For CSV files:</p>
              <p class="mb-1">• Required columns: <strong>arabic</strong> or <strong>english</strong></p>
              <p class="mb-1">• Optional columns: <strong>transliteration</strong></p>
              <p class="mb-1">• Column name variations are automatically detected</p>
              <p class="mb-3">• Missing fields will be generated using AI</p>
              
              <p class="font-medium text-text-300 mb-1">For TXT files:</p>
              <p class="mb-1">• One word or phrase per line</p>
              <p class="mb-1">• <strong class="text-red-400">Important:</strong> Lines without Arabic characters will be ignored</p>
              <p class="mb-1">• You can include English or transliteration on the same line (separated by comma, pipe, or semicolon)</p>
              <p>• Missing fields (English, transliteration) will be generated using AI</p>
            </div>
          </div>
        {:else}
          <!-- Category Selection -->
          <!-- Dialect Selection -->
        <div class="flex flex-col gap-4">
          <h2 class="text-2xl font-bold text-text-300">Select Dialect</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#each dialectOptions as option}
              <RadioButton
                className="!text-lg !font-medium"
                wrapperClass="!p-4 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
                onClick={setDialect}
                selectableFor={option.value}
                isSelected={selectedDialect === option.value}
                value={option.value}
                text={option.label}
              />
            {/each}
          </div>
        </div>

        <!-- Category Selection -->
        <div class="flex flex-col gap-4">
          <div>
            <h2 class="text-2xl font-bold text-text-300">Choose Category</h2>
            {#if selectedDialect === 'egyptian-arabic'}
              <p class="text-text-200 text-sm mt-1">Recommended: Most common words</p>
            {/if}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {#each currentSections as section}
              <RadioButton
                className="!text-base !font-medium"
                wrapperClass="!p-4 border-2 border-tile-500 bg-tile-400/30 hover:bg-tile-400 hover:border-tile-600 transition-all duration-200 rounded-xl"
                onClick={setCategory}
                selectableFor={section.path}
                isSelected={selectedCategory === section.path}
                value={section.path}
                text={`${section.name}${section.isPaywalled ? ' (Premium)' : ''} ${section.count > 0 ? `(${section.count} words)` : ''}`}
              />
            {/each}
          </div>
        </div>

        <!-- Limit Selection -->
        <div class="flex flex-col gap-3">
          <h2 class="text-2xl font-bold text-text-300">Number of Words</h2>
          <div class="relative">
            <input
              type="number"
              bind:value={importLimit}
              min="1"
              max="200"
              class="w-full bg-tile-300 border-2 border-tile-500 text-text-300 px-5 py-4 rounded-xl focus:outline-none focus:border-tile-600 focus:ring-0 transition-colors text-lg"
            />
          </div>
          <p class="text-text-200 text-sm">Import up to {importLimit} words from this category</p>
          {#if currentSections.find(s => s.path === selectedCategory)?.count}
            {@const selectedSection = currentSections.find(s => s.path === selectedCategory)}
            <p class="text-text-200 text-sm bg-tile-400/30 border border-tile-500 rounded-lg p-3">
              <span class="font-medium text-text-300">Available:</span> {selectedSection?.count || 0} words in this category
            </p>
          {/if}
        </div>
        {/if}

        <!-- Import Button -->
        <div class="pt-4">
          <Button 
            onClick={importWords} 
            type="button" 
            disabled={isImporting || (importMode === 'csv' && !csvFile) || (importMode === 'category' && !selectedCategory)}
            className="w-full !py-4 !text-lg !rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            {#if isImporting}
              {#if importProgress}
                Importing {importProgress.current}/{importProgress.total}...
              {:else}
              Importing...
              {/if}
            {:else}
              {importMode === 'csv' ? 'Import from File' : 'Import Words'}
            {/if}
          </Button>
          
          {#if importProgress && importMode === 'csv'}
            <div class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-text-300">Progress</span>
                <span class="text-sm text-text-200">{importProgress.current}/{importProgress.total}</span>
              </div>
              <div class="w-full bg-tile-400 rounded-full h-2.5">
                <div 
                  class="bg-tile-600 h-2.5 rounded-full transition-all duration-300"
                  style="width: {(importProgress.current / importProgress.total) * 100}%"
                ></div>
              </div>
            </div>
          {/if}
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
              {:else}
                <Button 
                  onClick={() => goto('/review')} 
                  type="button"
                  className="!bg-green-600 !hover:bg-green-700 !text-white w-full !py-3 !text-lg"
                >
                  Go to Review →
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
      <div class="flex items-start gap-3 mb-4">
        <span class="text-2xl">💡</span>
        <div>
          <h3 class="text-xl font-bold text-text-300 mb-2">Tips for Success</h3>
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
  </div>
</div>
