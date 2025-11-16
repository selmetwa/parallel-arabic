<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import type { Dialect } from '$lib/types';
  import cn from 'classnames';
  import { filterArabicCharacters } from '$lib/utils/arabic-normalization';

  interface ReviewWord {
    id: string;
    arabic: string;
    english: string;
    transliteration: string;
    audioUrl?: string;
    dialect: string;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewDate: number | null;
    lastReviewDate: number | null;
    isLearning: boolean;
  }

  interface Props {
    word: ReviewWord;
    onReview: (difficulty: 1 | 2 | 3) => void;
  }

  let { word, onReview }: Props = $props();

  let showAnswer = $state(false);
  let showHint = $state(false);
  let selectedDifficulty = $state<1 | 2 | 3 | null>(null);
  
  // Drag-to-highlight state
  let selectedWords = $state<string[]>([]);
  let isSelecting = $state(false);
  let selectionStartIndex = $state(-1);
  let selectionEndIndex = $state(-1);
  let isDefinitionModalOpen = $state(false);
  let isLoadingDefinition = $state(false);
  let definition = $state('');
  let targetWord = $state('');
  let targetArabicWord = $state('');

  const dialectName: Record<string, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic'
  };

  function handleDifficultyClick(difficulty: 1 | 2 | 3) {
    selectedDifficulty = difficulty;
    // Reset immediately to prevent showing answer for next word
    showAnswer = false;
    showHint = false;
    clearSelection();
    onReview(difficulty);
    // Reset selectedDifficulty after a delay for visual feedback
    setTimeout(() => {
      selectedDifficulty = null;
    }, 500);
  }
  
  // Reset state when word changes
  $effect(() => {
    if (word) {
      showAnswer = false;
      showHint = false;
      selectedDifficulty = null;
      clearSelection();
    }
  });

  function toggleAnswer() {
    showAnswer = !showAnswer;
    if (!showAnswer) {
      clearSelection();
    }
  }

  // Word selection functions for drag-to-highlight
  function handleWordMouseDown(index: number, event: MouseEvent) {
    event.preventDefault();
    isSelecting = true;
    selectionStartIndex = index;
    selectionEndIndex = index;
    updateSelectedWords();
  }

  function handleWordMouseEnter(index: number) {
    if (isSelecting) {
      selectionEndIndex = index;
      updateSelectedWords();
    }
  }

  function handleWordMouseUp() {
    isSelecting = false;
  }

  function updateSelectedWords() {
    const words = word.english.split(' ');
    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);
    selectedWords = words.slice(start, end + 1);
  }

  function clearSelection() {
    selectedWords = [];
    isSelecting = false;
    selectionStartIndex = -1;
    selectionEndIndex = -1;
  }

  function isWordSelected(index: number): boolean {
    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);
    return selectedWords.length > 0 && index >= start && index <= end;
  }

  // Function to map English words to corresponding Arabic words
  function mapEnglishToArabic(englishWords: string[]): string {
    const allEnglishWords = word.english.split(' ');
    const allArabicWords = word.arabic.split(' ');
    
    // Find the indices of the selected English words
    const selectedIndices: number[] = [];
    
    for (const englishWord of englishWords) {
      const index = allEnglishWords.findIndex((word, i) => 
        word.toLowerCase() === englishWord.toLowerCase() && !selectedIndices.includes(i)
      );
      if (index !== -1) {
        selectedIndices.push(index);
      }
    }
    
    // Extract corresponding Arabic words
    const correspondingArabicWords = selectedIndices
      .sort((a, b) => a - b) // Maintain order
      .map(index => allArabicWords[index])
      .filter(word => word); // Remove undefined/empty words
    
    if (correspondingArabicWords.length > 0) {
      const arabicText = correspondingArabicWords.join(' ');
      return filterArabicCharacters(arabicText);
    }
    
    // Fallback: filter the entire Arabic word
    return filterArabicCharacters(word.arabic);
  }

  async function askChatGTP(words: string | string[]) {
    const wordsArray = Array.isArray(words) ? words : [words];
    targetWord = wordsArray.join(' ');
    
    // Map English words to Arabic equivalent and filter for Arabic characters only
    targetArabicWord = mapEnglishToArabic(wordsArray);
    
    isLoadingDefinition = true;
    isDefinitionModalOpen = true;
    
    const wordText = wordsArray.length === 1 ? wordsArray[0] : `the phrase "${wordsArray.join(' ')}"`;
    const question = `What does ${wordText} mean in ${dialectName[word.dialect] || word.dialect}? Considering the following: "${word.arabic}" means "${word.english}" in ${dialectName[word.dialect] || word.dialect}. Please provide a detailed definition but do not reveal the entire meaning if this is part of a phrase, and don't say anything about the rest of the sentence at all, just use it as a reference to derive the definition.`;

    try {
      const res = await fetch('/api/open-ai', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({
          question: question
        })
      });

      const data = await res.json();
      definition = data.message.message.content;
    } catch (error) {
      console.error('Error fetching definition:', error);
      definition = 'Error loading definition. Please try again.';
    } finally {
      isLoadingDefinition = false;
    }
  }

  function closeDefinitionModal() {
    isDefinitionModalOpen = false;
    definition = '';
    targetWord = '';
    targetArabicWord = '';
    clearSelection();
  }
</script>

<DefinitionModal
  activeWordObj={{
    english: targetWord,
    arabic: targetArabicWord,
    isLoading: isLoadingDefinition,
    description: definition
  }}
  isModalOpen={isDefinitionModalOpen}
  closeModal={closeDefinitionModal}
  dialect={word.dialect as Dialect}
/>

<div class="bg-tile-300 border border-tile-500 rounded-lg shadow-lg p-6 sm:p-8">
  <div class="text-center mb-6">
    {#if !showAnswer}
      <h2 class="text-4xl sm:text-5xl font-bold text-text-100 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          onclick={() => askChatGTP(word.arabic)}
          title="Click to get definition"
      >
        {word.arabic}
      </h2>
      {#if showHint}
        <p class="text-xl text-text-200 mb-2">({word.transliteration})</p>
      {/if}
      <div class="flex justify-center gap-2 mt-4 flex-row flex-wrap">
        <Button onClick={() => (showHint = !showHint)} type="button">
          {showHint ? 'Hide' : 'Show'} Hint
        </Button>
        <Button onClick={toggleAnswer} type="button">Show Answer</Button>
        <AudioButton text={word.arabic} dialect={word.dialect as Dialect} audioUrl={word.audioUrl}>
          Listen
        </AudioButton>
      </div>
    {:else}
      <div class="space-y-4">
        <h2 class="text-4xl sm:text-5xl font-bold text-text-100 cursor-pointer hover:opacity-80 transition-opacity"
            onclick={() => askChatGTP(word.arabic)}
            title="Click to get definition"
        >
          {word.arabic}
        </h2>
        
        <!-- Multi-word selection tip -->
        <div class="mb-4 p-3 bg-tile-400 border-l-4 border-tile-500 rounded-r hover:bg-tile-500 transition-colors duration-300">
          <p class="text-sm text-text-300">
            <strong>💡 Tip:</strong> Click individual words for definitions, or 
            <strong>click and drag across multiple words</strong> to select a phrase and get its definition!
          </p>
        </div>
        
        <div class="flex flex-col items-center justify-center gap-3">
          <!-- Selection controls -->
          {#if selectedWords.length > 0}
            <div class="flex gap-2 mb-2">
              <button
                onclick={() => askChatGTP(selectedWords)}
                class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
              >
                Define "{selectedWords.join(' ')}"
              </button>
              <button
                onclick={clearSelection}
                class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          {/if}
          
          <div 
            class="flex w-fit flex-row flex-wrap text-3xl sm:text-4xl font-bold text-text-300 select-none"
            onmouseup={handleWordMouseUp}
            role="application"
            aria-label="Word selection area for definitions"
          >
            {#each word.english.split(' ') as englishWord, index}
              <span
                onmousedown={(e) => handleWordMouseDown(index, e)}
                onmouseenter={() => handleWordMouseEnter(index)}
                onclick={() => askChatGTP(englishWord)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    askChatGTP(englishWord);
                  }
                }}
                role="button"
                tabindex="0"
                aria-label={`Get definition for: ${englishWord}`}
                class={cn("p-1 text-3xl sm:text-4xl duration-300 cursor-pointer border-2", {
                  "bg-blue-200 border-blue-400": isWordSelected(index),
                  "hover:bg-tile-500 border-transparent hover:border-tile-600": !isWordSelected(index)
                })}
              >{englishWord}</span>
            {/each}
          </div>
          {#if showHint}
            <p class="text-xl text-text-200">({word.transliteration})</p>
          {/if}
        </div>
        
        <div class="flex justify-center gap-2 mt-4 flex-wrap">
          <AudioButton text={word.arabic} dialect={word.dialect as Dialect} audioUrl={word.audioUrl}>
            Listen
          </AudioButton>
          <Button onClick={toggleAnswer} type="button">Hide Answer</Button>
        </div>
      </div>
    {/if}
  </div>

  {#if showAnswer}
    <div class="border-t border-tile-500 pt-6 mt-6">
      <p class="text-center text-text-200 mb-4 font-semibold">How well did you remember this word?</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onclick={() => handleDifficultyClick(1)}
          disabled={selectedDifficulty !== null}
          class="border-2 border-green-500 bg-green-100 hover:bg-green-200 text-text-300 py-4 px-6 rounded-lg font-semibold text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="text-2xl mb-2">😊</div>
          <div>Easy</div>
          <div class="text-sm font-normal mt-1">Remembered easily</div>
        </button>
        
        <button
          type="button"
          onclick={() => handleDifficultyClick(2)}
          disabled={selectedDifficulty !== null}
          class="border-2 border-yellow-500 bg-yellow-100 hover:bg-yellow-200 text-text-300 py-4 px-6 rounded-lg font-semibold text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="text-2xl mb-2">🤔</div>
          <div>Medium</div>
          <div class="text-sm font-normal mt-1">Remembered with effort</div>
        </button>
        
        <button
          type="button"
          onclick={() => handleDifficultyClick(3)}
          disabled={selectedDifficulty !== null}
          class="border-2 border-red-500 bg-red-100 hover:bg-red-200 text-text-300 py-4 px-6 rounded-lg font-semibold text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="text-2xl mb-2">😓</div>
          <div>Hard</div>
          <div class="text-sm font-normal mt-1">Forgot or struggled</div>
        </button>
      </div>
    </div>
  {/if}

  {#if word.repetitions > 0}
    <div class="mt-6 pt-4 border-t border-tile-500 text-center text-sm text-text-200">
      <p>Reviewed {word.repetitions} time{word.repetitions !== 1 ? 's' : ''}</p>
      {#if word.intervalDays > 0}
        <p>Next review in {word.intervalDays} day{word.intervalDays !== 1 ? 's' : ''}</p>
      {/if}
    </div>
  {/if}
</div>

