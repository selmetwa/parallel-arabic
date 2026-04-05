<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import RadioButton from '$lib/components/RadioButton.svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
  import { toast } from 'svelte-sonner';
  import { importJobStore, startImportJob } from '$lib/stores/import-job';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  type Dialect = 'egyptian-arabic' | 'darija' | 'fusha' | 'levantine';

  let selectedDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
  let csvDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
  let selectedCategory = $state('');
  let importMode = $state<'category' | 'csv' | 'paste'>('csv');
  let pasteText = $state('');
  let pasteDialect = $state<Dialect>(getDefaultDialect(data.user) as Dialect);
  let csvFile = $state<File | null>(null);
  let csvFileError = $state('');
  let showImportModal = $state(false);

  $effect(() => {
    const sections = data.sections[selectedDialect] || [];
    if (sections.length > 0) {
      const currentCategoryExists = sections.some(s => s.path === selectedCategory);
      if (!selectedCategory || !currentCategoryExists) {
        const mostCommon = sections.find(s => s.path === 'most_common');
        selectedCategory = mostCommon ? 'most_common' : sections[0].path;
      }
    }
  });

  let importLimit = $state(50);
  let isImporting = $state(false);
  let importResult = $state<{ success: boolean; imported: number; skipped: number; message?: string } | null>(null);

  const jobState = $derived($importJobStore);
  const importProgress = $derived(
    jobState.status === 'processing' && jobState.total > 0
      ? { current: jobState.processedCount, total: jobState.total }
      : null
  );

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
  }

  function setCategory(event: any) {
    selectedCategory = event.target.value;
  }

  function handleCSVFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    csvFileError = '';

    if (file) {
      const maxSize = 500 * 1024;
      if (file.size > maxSize) {
        csvFileError = 'File size must be less than 500KB';
        csvFile = null;
        return;
      }

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

    try {
      if (importMode === 'csv') {
        if (!csvFile) {
          throw new Error('Please select a CSV or TXT file');
        }

        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('dialect', csvDialect);

        const response = await fetch('/api/import-words-csv', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to import words' }));
          throw new Error(errorData.error || 'Failed to import words');
        }

        const { job_id, total } = await response.json();

        csvFile = null;
        showImportModal = true;
        startImportJob(job_id, total);
      } else if (importMode === 'paste') {
        if (!pasteText.trim()) {
          throw new Error('Please enter some vocabulary to import');
        }

        const response = await fetch('/api/import-words-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pasteText, dialect: pasteDialect })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to import words' }));
          throw new Error(errorData.error || 'Failed to import words');
        }

        const { job_id, total } = await response.json();

        pasteText = '';
        showImportModal = true;
        startImportJob(job_id, total);
      } else {
        const response = await fetch('/api/import-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    }
  }
</script>

<div class="min-h-screen bg-tile-300 py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <header class="mb-12 text-center">
      <h1 class="text-4xl sm:text-5xl font-bold text-text-300 tracking-tight mb-4">Import Words</h1>
      <p class="text-lg sm:text-xl text-text-200 max-w-2xl mx-auto">
        Add words to your review deck
      </p>
    </header>

    <div class="bg-tile-400/50 border-2 border-tile-600 rounded-xl shadow-lg p-8 sm:p-10">
      <div class="space-y-8">

        <!-- Mode Tabs -->
        <div class="flex rounded-xl border-2 border-tile-600 overflow-hidden">
          <button
            type="button"
            onclick={() => { importMode = 'csv'; }}
            class="flex-1 py-3 px-4 text-sm font-medium transition-colors {importMode === 'csv' ? 'bg-tile-600 text-text-300' : 'bg-tile-300/50 text-text-200 hover:bg-tile-400/50'}"
          >
            Upload File
          </button>
          <button
            type="button"
            onclick={() => { importMode = 'paste'; }}
            class="flex-1 py-3 px-4 text-sm font-medium transition-colors border-l border-r border-tile-600 {importMode === 'paste' ? 'bg-tile-600 text-text-300' : 'bg-tile-300/50 text-text-200 hover:bg-tile-400/50'}"
          >
            Paste Text
          </button>
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
                    <div class="w-16 h-16 rounded-full bg-green-100/20 flex items-center justify-center text-green-700">
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
          <!-- Paste Text Section -->
          <div class="flex flex-col gap-4">
            <h2 class="text-2xl font-bold text-text-300">Paste Vocabulary</h2>
            <p class="text-text-200 text-sm">
              Paste your vocabulary words below. Any missing fields (Arabic, English, or transliteration) will be automatically generated using AI.
            </p>

            <!-- Dialect Selection for Paste -->
            <div class="flex flex-col gap-4">
              <h3 class="text-xl font-bold text-text-300">Select Dialect</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each dialectOptions as option (option.value)}
                  <RadioButton
                    className="!text-lg !font-medium"
                    wrapperClass="!p-4 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
                    onClick={(e) => { pasteDialect = e.target.value as Dialect; }}
                    selectableFor={`paste-${option.value}`}
                    isSelected={pasteDialect === option.value}
                    value={option.value}
                    text={option.label}
                  />
                {/each}
              </div>
            </div>

            <textarea
              bind:value={pasteText}
              rows={10}
              placeholder="Paste your vocabulary here...&#10;&#10;Examples:&#10;مرحبا&#10;مرحبا | hello | marhaba&#10;hello, مرحبا, marhaba&#10;good morning"
              class="w-full bg-tile-300 border-2 border-tile-500 text-text-300 px-5 py-4 rounded-xl focus:outline-none focus:border-tile-600 focus:ring-0 transition-colors text-base font-mono resize-y"
            ></textarea>

            <div class="bg-tile-300/50 border border-tile-500 rounded-lg p-4 text-sm text-text-200">
              <p class="font-medium text-text-300 mb-2">Supported formats (one entry per line):</p>
              <p class="mb-1">• <strong>Arabic only</strong> — AI generates English and transliteration</p>
              <p class="mb-1">• <strong>English only</strong> — AI generates Arabic and transliteration</p>
              <p class="mb-1">• <strong>arabic | english | transliteration</strong> — all three fields</p>
              <p class="mb-1">• <strong>arabic, english</strong> — AI generates transliteration</p>
              <p>• Separators: comma <code class="bg-tile-400/50 px-1 rounded">,</code> pipe <code class="bg-tile-400/50 px-1 rounded">|</code> or semicolon <code class="bg-tile-400/50 px-1 rounded">;</code></p>
            </div>
          </div>
        {/if}

        <!-- Import Button -->
        <div class="pt-4">
          <Button 
            onClick={importWords} 
            type="button" 
            disabled={isImporting || (importMode === 'csv' && !csvFile) || (importMode === 'category' && !selectedCategory) || (importMode === 'paste' && !pasteText.trim())}
            className="w-full !py-4 !text-lg !rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            {#if isImporting}
              Uploading...
            {:else}
              {importMode === 'csv' ? 'Import from File' : importMode === 'paste' ? 'Import Pasted Words' : 'Import Words'}
            {/if}
          </Button>
        </div>

        <!-- Result Message (category imports only) -->
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
  </div>
</div>

<!-- Import Progress Modal -->
{#if showImportModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-tile-300 border-2 border-tile-600 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
      {#if jobState.status === 'processing'}
        <div class="text-center space-y-6">
          <div class="w-16 h-16 mx-auto rounded-full bg-tile-400/50 flex items-center justify-center">
            <svg class="w-8 h-8 text-tile-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-300 mb-2">Importing your words</h3>
            <p class="text-text-200 text-sm">
              Feel free to continue using the app. We'll notify you when it's done.
            </p>
          </div>

          {#if importProgress}
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-text-300">Progress</span>
                <span class="text-sm text-text-200">{importProgress.current}/{importProgress.total}</span>
              </div>
              <div class="w-full bg-tile-400 rounded-full h-3">
                <div
                  class="bg-tile-600 h-3 rounded-full transition-all duration-500"
                  style="width: {(importProgress.current / importProgress.total) * 100}%"
                ></div>
              </div>
              <p class="text-xs text-text-200 mt-2">
                {jobState.importedCount} imported, {jobState.skippedCount} skipped
              </p>
            </div>
          {/if}

          <button
            type="button"
            onclick={() => { showImportModal = false; }}
            class="w-full py-3 px-4 bg-tile-400 text-text-300 rounded-xl hover:bg-tile-500 transition-colors font-medium border border-tile-500 hover:border-tile-600"
          >
            Continue Using App
          </button>
        </div>
      {:else if jobState.status === 'completed'}
        <div class="text-center space-y-6">
          <div class="w-16 h-16 mx-auto rounded-full bg-green-100/20 flex items-center justify-center text-green-700">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-300 mb-2">Import Complete!</h3>
            <p class="text-text-200">
              {jobState.importedCount} word{jobState.importedCount !== 1 ? 's' : ''} imported
              {#if jobState.skippedCount > 0}
                , {jobState.skippedCount} already in your deck
              {/if}
            </p>
          </div>
          <div class="space-y-3">
            {#if jobState.importedCount > 0}
              <Button
                onClick={() => { showImportModal = false; goto('/review'); }}
                type="button"
                className="w-full !py-3 !text-lg !rounded-xl"
              >
                Start Reviewing
              </Button>
            {/if}
            <button
              type="button"
              onclick={() => { showImportModal = false; }}
              class="w-full py-3 px-4 bg-tile-400 text-text-300 rounded-xl hover:bg-tile-500 transition-colors font-medium border border-tile-500 hover:border-tile-600"
            >
              Close
            </button>
          </div>
        </div>
      {:else if jobState.status === 'failed'}
        <div class="text-center space-y-6">
          <div class="w-16 h-16 mx-auto rounded-full bg-red-100/20 flex items-center justify-center text-red-500">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-300 mb-2">Import Failed</h3>
            <p class="text-text-200 text-sm">{jobState.error || 'An unexpected error occurred'}</p>
            {#if jobState.importedCount > 0}
              <p class="text-text-200 text-sm mt-2">
                {jobState.importedCount} word{jobState.importedCount !== 1 ? 's' : ''} were imported before the error.
              </p>
            {/if}
          </div>
          <button
            type="button"
            onclick={() => { showImportModal = false; }}
            class="w-full py-3 px-4 bg-tile-400 text-text-300 rounded-xl hover:bg-tile-500 transition-colors font-medium border border-tile-500 hover:border-tile-600"
          >
            Close
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
