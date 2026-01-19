<script lang="ts">
  import { type Dialect } from '$lib/types/index';

  interface VocabularyWord {
    arabic: string;
    english: string;
    transliteration: string;
    selected: boolean;
  }

  interface Props {
    isOpen: boolean;
    summary: string;
    topics: string[];
    vocabulary: VocabularyWord[];
    dialect: Dialect;
    onClose: () => void;
    onSave: (selectedWords: VocabularyWord[]) => void;
    isSaving: boolean;
  }

  let { 
    isOpen, 
    summary, 
    topics, 
    vocabulary = [], 
    dialect,
    onClose, 
    onSave,
    isSaving 
  }: Props = $props();

  let localVocabulary = $state<VocabularyWord[]>([]);
  
  // Sync vocabulary when modal opens
  $effect(() => {
    if (isOpen && vocabulary.length > 0) {
      localVocabulary = vocabulary.map(v => ({ ...v, selected: true }));
    }
  });

  function toggleWord(index: number) {
    localVocabulary[index].selected = !localVocabulary[index].selected;
  }

  function selectAll() {
    localVocabulary = localVocabulary.map(v => ({ ...v, selected: true }));
  }

  function selectNone() {
    localVocabulary = localVocabulary.map(v => ({ ...v, selected: false }));
  }

  function handleSave() {
    const selected = localVocabulary.filter(v => v.selected);
    onSave(selected);
  }

  let selectedCount = $derived(localVocabulary.filter(v => v.selected).length);

  const dialectNames: Record<Dialect, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Khaleeji Arabic'
  };
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <button
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onclick={onClose}
      aria-label="Close modal"
    ></button>
    
    <!-- Modal Content -->
    <div class="relative bg-tile-400 border-2 border-tile-600 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-tile-600 bg-gradient-to-r from-emerald-600/20 to-sky-600/20">
        <div class="flex items-center gap-3">
          <span class="text-4xl">📚</span>
          <div>
            <h2 class="text-2xl font-bold text-text-300">Session Complete!</h2>
            <p class="text-sm text-text-200">Here's what you learned today</p>
          </div>
        </div>
      </div>
      
      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Summary -->
        {#if summary}
          <div class="bg-tile-300/50 border border-tile-500/50 rounded-xl p-4">
            <h3 class="text-sm font-bold text-text-300 mb-2 flex items-center gap-2">
              <span>💬</span> Summary
            </h3>
            <p class="text-text-200 leading-relaxed">{summary}</p>
          </div>
        {/if}
        
        <!-- Topics -->
        {#if topics.length > 0}
          <div>
            <h3 class="text-sm font-bold text-text-300 mb-3 flex items-center gap-2">
              <span>🎯</span> Topics Covered
            </h3>
            <div class="flex flex-wrap gap-2">
              {#each topics as topic}
                <span class="px-3 py-1.5 bg-sky-500/20 text-sky-300 rounded-full text-sm font-medium border border-sky-500/30">
                  {topic}
                </span>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Vocabulary -->
        {#if localVocabulary.length > 0}
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-text-300 flex items-center gap-2">
                <span>📖</span> Vocabulary ({localVocabulary.length} words)
              </h3>
              <div class="flex gap-2">
                <button
                  onclick={selectAll}
                  class="text-xs px-2 py-1 bg-tile-500 hover:bg-tile-600 text-text-300 rounded transition-colors"
                >
                  Select All
                </button>
                <button
                  onclick={selectNone}
                  class="text-xs px-2 py-1 bg-tile-500 hover:bg-tile-600 text-text-300 rounded transition-colors"
                >
                  Select None
                </button>
              </div>
            </div>
            
            <p class="text-xs text-text-200 mb-3">
              Select words to add to your vocabulary review deck ({dialectNames[dialect]})
            </p>
            
            <div class="space-y-2 max-h-64 overflow-y-auto pr-2">
              {#each localVocabulary as word, index}
                <button
                  onclick={() => toggleWord(index)}
                  class="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left
                    {word.selected 
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm' 
                      : 'bg-tile-300/30 border-tile-500/30 hover:border-tile-500'}"
                >
                  <!-- Checkbox -->
                  <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                    {word.selected ? 'bg-emerald-500 border-emerald-500' : 'border-tile-500'}">
                    {#if word.selected}
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    {/if}
                  </div>
                  
                  <!-- Word Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-3 flex-wrap">
                      <span class="text-xl font-semibold text-text-300" dir="rtl">{word.arabic}</span>
                      <span class="text-sm text-text-200">{word.english}</span>
                    </div>
                    <p class="text-xs text-text-200/70 italic mt-0.5">{word.transliteration}</p>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {:else}
          <div class="bg-tile-300/30 border border-tile-500/30 rounded-xl p-6 text-center">
            <span class="text-3xl mb-2 block">📝</span>
            <p class="text-text-200">No new vocabulary words were identified in this session.</p>
          </div>
        {/if}
      </div>
      
      <!-- Footer -->
      <div class="p-6 border-t border-tile-600 bg-tile-500/30">
        <div class="flex items-center justify-between gap-4">
          <button
            onclick={onClose}
            class="px-6 py-2.5 text-text-200 hover:text-text-300 font-medium transition-colors"
          >
            Skip & Close
          </button>
          
          <button
            onclick={handleSave}
            disabled={isSaving}
            class="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-wait"
          >
            {#if isSaving}
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {#if selectedCount > 0}
                Save {selectedCount} Word{selectedCount !== 1 ? 's' : ''} & Finish
              {:else}
                Finish Session
              {/if}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

