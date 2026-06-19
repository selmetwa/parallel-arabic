<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import RadioButton from '$lib/components/RadioButton.svelte';
  import GeneratedItemsModal from './GeneratedItemsModal.svelte';
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
  import { trackEvent } from '$lib/analytics';

  interface GeneratedItem {
    arabic: string;
    english: string;
    transliteration: string;
  }

  type DialectUser = { target_dialect?: string | null } | null;

  interface Props {
    open?: boolean;
    user?: DialectUser;
    onClose?: () => void;
    /** Called after words are saved so the host can refresh its list. */
    onCompleted?: () => void;
    /** Action for the "Start Reviewing" button on the success screen. */
    onStartReviewing?: () => void;
  }

  let { open = $bindable(false), user = null, onClose, onCompleted, onStartReviewing }: Props = $props();

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic' },
    { value: 'fusha', label: 'Modern Standard Arabic (Fusha)' },
    { value: 'levantine', label: 'Levantine Arabic' },
    { value: 'darija', label: 'Moroccan Arabic (Darija)' }
  ];

  const difficultyOptions = [
    { value: 'a1', label: 'A1 (Beginner)' },
    { value: 'a2', label: 'A2 (Elementary)' },
    { value: 'b1', label: 'B1 (Intermediate)' },
    { value: 'b2', label: 'B2 (Upper Intermediate)' },
    { value: 'c1', label: 'C1 (Advanced)' },
    { value: 'c2', label: 'C2 (Proficient)' }
  ];

  const wordTypeOptions = [
    'nouns', 'verbs', 'adjectives', 'numbers', 'colors', 'food and drinks',
    'family members', 'body parts', 'animals', 'clothing', 'time and dates',
    'places and locations', 'transportation', 'emotions', 'actions', 'adverbs',
    'prepositions', 'common phrases'
  ];

  let dialectOverride = $state<string | null>(null);
  const selectedDialect = $derived(dialectOverride ?? getDefaultDialect(user));
  let difficultyOption = $state('a1');
  let selectedWordTypes = $state<string[]>([]);
  let customWordRequest = $state('');
  let wordGenerateError = $state<string | null>(null);
  let isGenerating = $state(false);

  let showResults = $state(false);
  let generatedItems = $state<GeneratedItem[]>([]);

  const dialectLabel = $derived(dialectOptions.find((d) => d.value === selectedDialect)?.label ?? '');

  function setDialect(event: any) {
    dialectOverride = event.target.value;
  }

  function setDifficultyOption(event: any) {
    difficultyOption = event.target.value;
  }

  function toggleWordType(type: string) {
    if (selectedWordTypes.includes(type)) {
      selectedWordTypes = selectedWordTypes.filter((t) => t !== type);
    } else {
      selectedWordTypes = [...selectedWordTypes, type];
    }
  }

  function filterValidWords(words: any[]): GeneratedItem[] {
    return words.filter(
      (word) =>
        word &&
        typeof word.arabic === 'string' &&
        typeof word.english === 'string' &&
        typeof word.transliteration === 'string' &&
        word.arabic.trim() !== '' &&
        word.english.trim() !== '' &&
        word.transliteration.trim() !== ''
    );
  }

  function closeForm() {
    open = false;
    wordGenerateError = null;
    onClose?.();
  }

  function closeResults() {
    showResults = false;
    generatedItems = [];
  }

  async function generateAndSaveWords() {
    trackEvent('review_words_generation_started', {
      dialect: selectedDialect,
      difficulty: difficultyOption,
      word_types: selectedWordTypes
    });
    isGenerating = true;
    wordGenerateError = null;
    generatedItems = [];
    showResults = true;
    open = false;

    try {
      const res = await fetch('/api/generate-words', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({
          dialect: selectedDialect,
          wordTypes: selectedWordTypes,
          difficulty: difficultyOption,
          customRequest: customWordRequest
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const chatgptres = await res.json();

      if (!chatgptres.message?.message?.content) {
        throw new Error('Invalid response format from server');
      }

      const newWords = filterValidWords(JSON.parse(chatgptres.message.message.content).words || []);

      if (newWords.length === 0) {
        throw new Error('No valid words were generated. Please try again.');
      }

      generatedItems = newWords;
      isGenerating = false;

      selectedWordTypes = [];
      customWordRequest = '';
    } catch (error) {
      console.error('Error generating words:', error);
      wordGenerateError = error instanceof Error ? error.message : 'An unexpected error occurred while generating words. Please try again.';
      isGenerating = false;
      showResults = false;
      open = true;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
    <div class="w-full max-w-3xl bg-tile-300 border-2 border-tile-600 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 z-10 flex justify-between items-center p-6 bg-tile-300 border-b border-tile-500">
        <h2 class="text-2xl font-bold text-text-300 flex items-center gap-3">
          <span class="text-3xl">📝</span> Generate Words
        </h2>
        <button
          aria-label="Close"
          class="p-2 hover:bg-tile-400 rounded-lg transition-colors text-text-200 hover:text-text-300"
          onclick={closeForm}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="p-6 sm:p-8">
        <form class="space-y-8" onsubmit={(e) => { e.preventDefault(); generateAndSaveWords(); }}>
          {#if wordGenerateError}
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-start gap-3">
              <div class="text-xl">⚠️</div>
              <div>
                <p class="font-bold">Error</p>
                <p>{wordGenerateError}</p>
              </div>
            </div>
          {/if}

          <!-- Dialect Selection -->
          <div class="space-y-3">
            <p class="block text-lg font-bold text-text-300">Select Dialect</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each dialectOptions as dialectOption (dialectOption.value)}
                <RadioButton
                  className="!text-base !font-medium"
                  wrapperClass="!p-4 border-2 border-tile-500 bg-tile-400/30 hover:bg-tile-400 hover:border-tile-600 transition-all duration-200 rounded-xl"
                  onClick={setDialect}
                  selectableFor={dialectOption.value}
                  isSelected={selectedDialect === dialectOption.value}
                  value={dialectOption.value}
                  text={dialectOption.label}
                />
              {/each}
            </div>
          </div>

          <!-- Difficulty Selection -->
          <div class="space-y-3">
            <p class="block text-lg font-bold text-text-300">Difficulty Level</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {#each difficultyOptions as option (option.value)}
                <RadioButton
                  className="!text-sm !font-medium"
                  wrapperClass="!p-3 border-2 border-tile-500 bg-tile-400/30 hover:bg-tile-400 hover:border-tile-600 transition-all duration-200 rounded-lg"
                  onClick={setDifficultyOption}
                  selectableFor={option.value}
                  isSelected={difficultyOption === option.value}
                  value={option.value}
                  text={option.label}
                />
              {/each}
            </div>
          </div>

          <!-- Word Types -->
          <div class="space-y-3">
            <p class="block text-lg font-bold text-text-300">Word Categories <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {#each wordTypeOptions as wordType (wordType)}
                <button
                  type="button"
                  class="text-left p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium capitalize {selectedWordTypes.includes(wordType) ? 'bg-tile-500 border-tile-600 text-text-300 shadow-sm' : 'bg-tile-200 border-tile-400 text-text-200 hover:bg-tile-400'}"
                  onclick={() => toggleWordType(wordType)}
                >
                  <div class="flex items-center justify-between">
                    <span>{wordType}</span>
                    {#if selectedWordTypes.includes(wordType)}
                      <span>✓</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- Custom Request -->
          <div class="space-y-3 bg-tile-400/30 p-6 rounded-xl border border-tile-500">
            <label for="custom-word-request" class="block text-lg font-bold text-text-300">Custom Topic <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></label>
            <p class="text-sm text-text-200 mb-4">Be specific! e.g., "kitchen utensils", "office slang", "terms for getting directions".</p>
            <textarea
              id="custom-word-request"
              bind:value={customWordRequest}
              rows="3"
              class="w-full rounded-lg border-2 border-tile-500 bg-tile-200 p-3 text-text-300 focus:border-tile-600 focus:ring-0 transition-colors"
              placeholder="Describe the words you want..."
            ></textarea>
          </div>

          <div class="pt-4">
            <Button type="submit" className="w-full !py-4 !text-lg !rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
              Generate Words
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

{#if showResults}
  {#key generatedItems}
    <GeneratedItemsModal
      type="words"
      dialect={selectedDialect}
      {dialectLabel}
      {isGenerating}
      items={generatedItems}
      onClose={closeResults}
      onSaved={() => onCompleted?.()}
      {onStartReviewing}
    />
  {/key}
{/if}
