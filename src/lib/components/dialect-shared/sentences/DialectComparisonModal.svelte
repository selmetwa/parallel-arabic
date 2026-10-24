<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import AudioButton from "$lib/components/AudioButton.svelte";
  import type { Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';

  interface Props {
    isOpen: boolean;
    closeModal: () => void;
    originalText: string;
    originalEnglish?: string;
    comparisonData: DialectComparisonSchema | null;
    isLoading: boolean;
    error: string | null;
    currentDialect: Dialect;
  }

  let { isOpen, closeModal, originalText, originalEnglish, comparisonData, isLoading, error, currentDialect }: Props = $props();

  const dialectMapping: Record<string, keyof DialectComparisonSchema> = {
    'egyptian-arabic': 'egyptian',
    'darija': 'darija',
    'levantine': 'levantine',
    'fusha': 'fusha',
    'iraqi': 'iraqi',
    'khaleeji': 'khaleeji',
    'saudi': 'saudi'
  };

  const displayNames = {
    egyptian: 'Egyptian Arabic',
    darija: 'Moroccan Darija',
    levantine: 'Levantine Arabic',
    fusha: 'Modern Standard Arabic (Fusha)',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Gulf Arabic (Khaleeji)',
    saudi: 'Saudi Arabic (Hijazi)'
  };

  const flags = {
    egyptian: '🇪🇬',
    darija: '🇲🇦',
    levantine: '🇯🇴', // Using Jordan flag for Levantine as a representative
    fusha: '🇸🇦', // Using Saudi flag for Fusha as a representative
    iraqi: '🇮🇶',
    khaleeji: '🇦🇪',
    saudi: '🇸🇦'
  };

  const ORDER: (keyof DialectComparisonSchema)[] = ['egyptian', 'darija', 'levantine', 'fusha', 'iraqi', 'khaleeji', 'saudi'];
  // The new dialects are optional in the response; show only what came back.
  const dialects = $derived(ORDER.filter((key) => comparisonData?.[key]));
  
  // Helper to convert schema key to Dialect type for AudioButton
  function getDialectType(key: keyof DialectComparisonSchema): Dialect {
    if (key === 'egyptian') return 'egyptian-arabic';
    if (key === 'fusha') return 'fusha';
    return key;
  }
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="max(70%, 600px)" height="fit-content" zIndex={200}>
  <div class="p-6 w-full max-h-[80vh] overflow-y-auto">
    <h2 class="text-2xl font-bold text-text-300 mb-4 text-center">Dialect Comparison</h2>
    
    <div class="mb-6 text-center">
      <p class="text-text-200 text-sm mb-1">Original Text</p>
      <div class="space-y-2">
        <p class="text-xl font-semibold text-text-300" dir="rtl">{originalText}</p>
        {#if originalEnglish}
          <p class="text-lg text-text-200">{originalEnglish}</p>
        {/if}
      </div>
    </div>

    {#if isLoading}
      <div class="flex flex-col items-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tile-500"></div>
        <p class="mt-4 text-text-200">Comparing dialects...</p>
      </div>
    {:else if error}
      <div class="flex flex-col items-center py-8">
        <div class="text-red-500 text-4xl mb-4">⚠️</div>
        <p class="text-lg font-semibold text-text-300 mb-2">Unable to Compare Dialects</p>
        <p class="text-text-200 text-center max-w-md">{error}</p>
        <button
          onclick={closeModal}
          class="mt-4 px-4 py-2 bg-tile-500 text-text-300 rounded border border-tile-600 hover:bg-tile-600 transition-colors"
        >
          Close
        </button>
      </div>
    {:else if comparisonData}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each dialects as dialectKey (dialectKey)}
          {@const isCurrent = dialectMapping[currentDialect] === dialectKey}
          {@const entry = comparisonData[dialectKey]!}
          <div class={`p-4 rounded-lg border flex flex-col h-full ${isCurrent ? 'bg-tile-300 border-tile-500 ring-2 ring-tile-500' : 'bg-tile-100 border-tile-200'}`}>
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{flags[dialectKey]}</span>
                <h3 class="font-bold text-text-300">{displayNames[dialectKey]}</h3>
              </div>
              {#if isCurrent}
                <span class="text-xs bg-tile-500 text-white px-2 py-1 rounded-full">Current</span>
              {/if}
            </div>
            
            <div class="flex-grow flex flex-col justify-center mb-3">
              <p class="text-2xl text-right font-arabic mb-2 text-text-300 leading-relaxed" dir="rtl">{entry.arabic}</p>
              <p class="text-text-200 text-sm">{entry.transliteration}</p>
            </div>
            
            <div class="mt-auto pt-2 border-t border-tile-200/50">
              <AudioButton 
                text={entry.arabic} 
                dialect={getDialectType(dialectKey)}
              >
                Listen
              </AudioButton>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Modal>

