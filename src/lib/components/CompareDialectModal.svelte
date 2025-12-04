<script lang="ts">
  import AudioButton from '$lib/components/AudioButton.svelte';
  import SaveButton from '$lib/components/SaveButton.svelte';

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

  interface Props {
    word: Word;
    allWords: Word[];
    onClose: () => void;
  }

  let { word, allWords, onClose }: Props = $props();

  // Find all dialect variations of this word
  let dialectVariations = $derived(
    allWords.filter(w =>
      w.english_word.toLowerCase() === word.english_word.toLowerCase() &&
      w.id !== word.id
    )
  );

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

<div
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  onclick={onClose}
>
  <div
    class="bg-tile-300 border-2 border-tile-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Modal Header -->
    <div class="sticky top-0 bg-tile-400 border-b-2 border-tile-600 p-4 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-300 mb-1">Dialect Comparison</h2>
        <p class="text-lg text-text-200">"{word.english_word}"</p>
      </div>
      <button
        onclick={onClose}
        class="px-4 py-2 bg-tile-500 md:hover:bg-tile-600 text-text-300 font-semibold rounded-lg transition-colors"
      >
        Close
      </button>
    </div>

    <!-- Modal Content -->
    <div class="p-6">
      {#if dialectVariations.length === 0}
        <div class="text-center py-8">
          <p class="text-text-200 text-lg">No other dialect variations found for this word.</p>
          <p class="text-text-200 text-sm mt-2">This word may only exist in {getDialectLabel(word.dialect)}.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Original Word -->
          <div class="bg-tile-400 border-2 border-blue-500 rounded-lg p-4">
            <div class="mb-3">
              <span class="inline-block px-2 py-1 text-xs font-bold bg-blue-500 text-white rounded">
                ORIGINAL
              </span>
              <span class="inline-block ml-2 px-2 py-1 text-xs font-bold text-white rounded {getDialectColor(word.dialect)}">
                {getDialectLabel(word.dialect)}
              </span>
            </div>

            <div class="flex items-center justify-between mb-2">
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

            <p class="text-sm text-text-200 italic mb-2">
              {word.transliterated_word}
            </p>

            <p class="text-lg font-semibold text-text-300 mb-3">
              {word.english_word}
            </p>

            <p class="text-xs text-text-200">
              Category: {word.category.replace(/_/g, ' ')}
            </p>
          </div>

          <!-- Other Dialect Variations -->
          {#each dialectVariations as variation (variation.id)}
            <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-4">
              <div class="mb-3">
                <span class="inline-block px-2 py-1 text-xs font-bold text-white rounded {getDialectColor(variation.dialect)}">
                  {getDialectLabel(variation.dialect)}
                </span>
              </div>

              <div class="flex items-center justify-between mb-2">
                <h3 class="text-2xl font-bold text-text-300 text-left">
                  {variation.arabic_word}
                </h3>
                <AudioButton
                  text={variation.arabic_word}
                  dialect={variation.dialect}
                  audioUrl={variation.audio_url || undefined}
                  className="text-text-300"
                />
              </div>

              <p class="text-sm text-text-200 italic mb-2">
                {variation.transliterated_word}
              </p>

              <p class="text-lg font-semibold text-text-300 mb-3">
                {variation.english_word}
              </p>

              <p class="text-xs text-text-200 mb-3">
                Category: {variation.category.replace(/_/g, ' ')}
              </p>

              <div class="flex gap-2">
                <SaveButton
                  objectToSave={{
                    arabic: variation.arabic_word,
                    english: variation.english_word,
                    transliterated: variation.transliterated_word
                  }}
                  type="Word"
                />
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
