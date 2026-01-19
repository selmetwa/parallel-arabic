<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import type { Dialect } from '$lib/types';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
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
    onForgot?: () => void;
  }

  let { word, onReview, onForgot }: Props = $props();

  let showAnswer = $state(false);
  let showHint = $state(false);
  let selectedDifficulty = $state<1 | 2 | 3 | null>(null);
  
  // Drag-to-highlight state (English words)
  let selectedWords = $state<string[]>([]);
  let isSelecting = $state(false);
  let selectionStartIndex = $state(-1);
  let selectionEndIndex = $state(-1);
  
  // Drag-to-highlight state (Arabic words)
  let selectedArabicWords = $state<string[]>([]);
  let isSelectingArabic = $state(false);
  let selectionStartIndexArabic = $state(-1);
  let selectionEndIndexArabic = $state(-1);
  let isDefinitionModalOpen = $state(false);
  let isLoadingDefinition = $state(false);
  let definition = $state('');
  let targetWord = $state('');
  let targetArabicWord = $state('');

  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state<DialectComparisonSchema | null>(null);
  let isComparing = $state(false);
  let comparisonError = $state<string | null>(null);

  async function compareDialects() {
    isComparing = true;
    isComparisonModalOpen = true;
    comparisonData = null;
    comparisonError = null;

    try {
      const res = await fetch('/api/compare-dialects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: word.arabic,
          currentDialect: word.dialect,
          transliteration: word.transliteration
        })
      });
      
      if (res.ok) {
        comparisonData = await res.json();
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to compare dialects' }));
        comparisonError = errorData.message || 'Failed to compare dialects. Please try again.';
      }
    } catch (e) {
      comparisonError = e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
    } finally {
      isComparing = false;
    }
  }

  function closeComparisonModal() {
    isComparisonModalOpen = false;
  }

  const dialectName: Record<string, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Khaleeji Arabic'
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

  function handleForgot() {
    selectedDifficulty = null;
    showAnswer = false;
    showHint = false;
    clearSelection();
    if (onForgot) {
      onForgot();
    }
  }
  
  // Reset state when word changes
  $effect(() => {
    if (word) {
      showAnswer = false;
      showHint = false;
      selectedDifficulty = null;
      isFlipping = false;
      clearSelection();
      clearArabicSelection();
    }
  });

  let isFlipping = $state(false);
  let flipCardInner: HTMLDivElement | null = null;
  let frontFace: HTMLDivElement | null = null;
  let backFace: HTMLDivElement | null = null;
  let cardMinHeight = $state(0);

  // Calculate and set min-height based on content
  $effect(() => {
    // Recalculate when word changes or when UI state changes
    // Dependencies: word, showHint, selectedWords, selectedArabicWords, showAnswer
    if (frontFace && backFace && word) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (frontFace && backFace) {
          const frontHeight = frontFace.scrollHeight;
          const backHeight = backFace.scrollHeight;
          const maxHeight = Math.max(frontHeight, backHeight);
          cardMinHeight = maxHeight;
        }
      });
    }
    // Access state variables to make them dependencies
    void showHint;
    void selectedWords;
    void selectedArabicWords;
    void showAnswer;
  });

  function handleCardClick(event: MouseEvent) {
    if (isFlipping) return;
    toggleFlip();
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
  }

  function toggleFlip() {
    if (isFlipping) return;

    isFlipping = true;
    showAnswer = !showAnswer;

    if (!showAnswer) {
      clearSelection();
      clearArabicSelection();
    }

    setTimeout(() => {
      isFlipping = false;
    }, 600);
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
  
  // Arabic word selection functions
  function handleArabicWordMouseDown(index: number, event: MouseEvent) {
    event.preventDefault();
    isSelectingArabic = true;
    selectionStartIndexArabic = index;
    selectionEndIndexArabic = index;
    updateSelectedArabicWords();
  }

  function handleArabicWordMouseEnter(index: number) {
    if (isSelectingArabic) {
      selectionEndIndexArabic = index;
      updateSelectedArabicWords();
    }
  }

  function handleArabicWordMouseUp() {
    isSelectingArabic = false;
  }

  function updateSelectedArabicWords() {
    const arabicWords = word.arabic.split(' ');
    const start = Math.min(selectionStartIndexArabic, selectionEndIndexArabic);
    const end = Math.max(selectionStartIndexArabic, selectionEndIndexArabic);
    selectedArabicWords = arabicWords.slice(start, end + 1);
  }

  function clearArabicSelection() {
    selectedArabicWords = [];
    isSelectingArabic = false;
    selectionStartIndexArabic = -1;
    selectionEndIndexArabic = -1;
  }

  function isArabicWordSelected(index: number): boolean {
    const start = Math.min(selectionStartIndexArabic, selectionEndIndexArabic);
    const end = Math.max(selectionStartIndexArabic, selectionEndIndexArabic);
    return selectedArabicWords.length > 0 && index >= start && index <= end;
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
    const wordsText = wordsArray.join(' ');
    
    // Check if the input contains Arabic characters
    const hasArabicChars = /[\u0600-\u06FF]/.test(wordsText);
    
    if (hasArabicChars) {
      // Input is Arabic - use it directly
      targetArabicWord = wordsText;
      targetWord = ''; // No English equivalent needed
    } else {
      // Input is English - map to Arabic
      targetWord = wordsText;
      targetArabicWord = mapEnglishToArabic(wordsArray);
    }
    
    isLoadingDefinition = true;
    isDefinitionModalOpen = true;
    
    const wordText = wordsArray.length === 1 ? wordsArray[0] : `the phrase "${wordsText}"`;
    const question = `What does ${wordText} mean in ${dialectName[word.dialect] || word.dialect}? Considering the following sentences:
		Arabic: "${word.arabic}"
		English: "${word.english}"
		Transliteration: "${word.transliteration}"
		
		Please provide a definition based on the context.`;

    try {
      const res = await fetch('/api/definition-sentence', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({
          question: question
        })
      });

      const data = await res.json();

      // Store the structured JSON response as a string so the UI can parse it
      // The response should already be valid JSON from the API
      try {
        // Verify it's valid JSON and store it as a string for the UI components
        const parsed = JSON.parse(data.message.content);
        // Store the entire parsed object as JSON string for the UI to parse
        definition = JSON.stringify(parsed);
      } catch (e) {
        // Fallback for plain text responses (shouldn't happen with structured output)
        definition = data.message.content;
      }
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
    clearArabicSelection();
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

<DialectComparisonModal
  isOpen={isComparisonModalOpen}
  closeModal={closeComparisonModal}
  originalText={word.arabic}
  originalEnglish={word.english}
  {comparisonData}
  isLoading={isComparing}
  error={comparisonError}
  currentDialect={word.dialect as Dialect}
/>

<div
  class="flip-card p-4 sm:p-6 bg-gradient-to-br from-tile-400/60 to-tile-400/40 border-2 border-tile-600 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
  onclick={handleCardClick}
  onkeydown={handleCardKeydown}
  role="button"
  tabindex="0"
  aria-label={showAnswer ? "Hide translation" : "Reveal translation"}
  aria-pressed={showAnswer}
>
  <div
    bind:this={flipCardInner}
    class={cn("flip-card-inner p-4 sm:p-6", {
      "flipped": showAnswer,
      "is-animating": isFlipping
    })}
    style={showAnswer && cardMinHeight > 0 ? `min-height: ${cardMinHeight}px` : ''}
  >
    <!-- Front Face -->
    <div class="flip-card-front" bind:this={frontFace}>
      <div class="text-left mb-6">
        <!-- Dialect Badge -->
        <div class="mb-4">
          <span class="inline-block px-3 py-1 bg-tile-500 text-text-300 rounded-full text-sm font-semibold">
            {dialectName[word.dialect] || word.dialect}
          </span>
        </div>
      <div class="flex flex-col items-center justify-center gap-3 mb-4">
        <!-- Arabic word selection controls -->
        {#if selectedArabicWords.length > 0}
          <div class="flex gap-2 mb-2" onclick={(e) => e.stopPropagation()}>
            <button
              onclick={() => askChatGTP(selectedArabicWords.join(' '))}
              class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
            >
              Define "{selectedArabicWords.join(' ')}"
            </button>
            <button
              onclick={clearArabicSelection}
              class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        {/if}
        
        <div 
          class="flex w-fit flex-row flex-wrap text-4xl sm:text-5xl font-bold text-text-100 select-none"
          onmouseup={handleArabicWordMouseUp}
          aria-label="Arabic word selection area for definitions"
          role="application"
          dir="rtl"
        >
          {#each word.arabic.split(' ') as arabicWord, index}
            <span
              onmousedown={(e) => handleArabicWordMouseDown(index, e)}
              onmouseenter={() => handleArabicWordMouseEnter(index)}
              onclick={(e) => {
                e.stopPropagation();
                askChatGTP(arabicWord);
              }}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  askChatGTP(arabicWord);
                }
              }}
              role="button"
              tabindex="0"
              aria-label={`Get definition for: ${arabicWord}`}
              class={cn("p-1 text-4xl sm:text-5xl duration-300 cursor-pointer border-2 rounded-lg transition-all", {
                "bg-gradient-to-br from-blue-200 to-blue-300 border-blue-500 shadow-lg scale-110 animate-pulse-subtle": isArabicWordSelected(index),
                "hover:bg-tile-400/50 border-transparent hover:border-tile-600 hover:scale-105": !isArabicWordSelected(index)
              })}
              dir="rtl"
            >{arabicWord}</span>
          {/each}
        </div>
      </div>
        {#if showHint}
          <p class="text-xl text-text-200 mb-2">({word.transliteration})</p>
        {/if}
        <div class="flex flex-col items-center gap-3 mt-4">
          <div class="flex flex-row justify-center gap-2" onclick={(e) => e.stopPropagation()}>
            <Button onClick={() => (showHint = !showHint)} type="button">
              {showHint ? 'Hide' : 'Show'} Hint
            </Button>
            <AudioButton text={word.arabic} dialect={word.dialect as Dialect} audioUrl={word.audioUrl}>
              Listen
            </AudioButton>
          </div>
          <p class="text-xs text-text-200 text-center mt-4 opacity-60">
            Click anywhere to reveal translation
          </p>
        </div>
      </div>
    </div>

    <!-- Back Face -->
    <div class="flip-card-back" bind:this={backFace}>
      <div class="text-left mb-6">
        <!-- Dialect Badge -->
        <div class="mb-4">
          <span class="inline-block px-3 py-1 bg-tile-500 text-text-300 rounded-full text-sm font-semibold">
            {dialectName[word.dialect] || word.dialect}
          </span>
        </div>
      <div class="space-y-4">
        <div class="flex flex-col items-center justify-center gap-3">
          <!-- Arabic word selection controls -->
          {#if selectedArabicWords.length > 0}
            <div class="flex gap-2 mb-2">
              <button
                onclick={() => askChatGTP(selectedArabicWords.join(' '))}
                class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
              >
                Define "{selectedArabicWords.join(' ')}"
              </button>
              <button
                onclick={clearArabicSelection}
                class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          {/if}
          
          <div 
            class="flex w-fit flex-row flex-wrap text-4xl sm:text-5xl font-bold text-text-100 select-none"
            onmouseup={handleArabicWordMouseUp}
            aria-label="Arabic word selection area for definitions"
            role="application"
            dir="rtl"
          >
            {#each word.arabic.split(' ') as arabicWord, index}
              <span
                onmousedown={(e) => handleArabicWordMouseDown(index, e)}
                onmouseenter={() => handleArabicWordMouseEnter(index)}
                onclick={(e) => {
                  e.stopPropagation();
                  askChatGTP(arabicWord);
                }}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    askChatGTP(arabicWord);
                  }
                }}
                role="button"
                tabindex="0"
                aria-label={`Get definition for: ${arabicWord}`}
                class={cn("p-1 text-4xl sm:text-5xl duration-300 cursor-pointer border-2", {
                  "bg-blue-200 border-blue-400": isArabicWordSelected(index),
                  "hover:opacity-80 border-transparent hover:border-tile-600": !isArabicWordSelected(index)
                })}
                dir="rtl"
              >{arabicWord}</span>
            {/each}
          </div>
        </div>

        <div class="flex flex-col items-center justify-center gap-3">
          <!-- Selection controls -->
          {#if selectedWords.length > 0}
            <div class="flex gap-2 mb-2" onclick={(e) => e.stopPropagation()}>
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
            aria-label="Word selection area for definitions"
            role="application"
          >
            {#each word.english.split(' ') as englishWord, index}
              <span
                onmousedown={(e) => handleWordMouseDown(index, e)}
                onmouseenter={() => handleWordMouseEnter(index)}
                onclick={(e) => {
                  e.stopPropagation();
                  askChatGTP(englishWord);
                }}
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
        
        <div class="flex justify-center gap-2 mt-4 flex-row flex-wrap" onclick={(e) => e.stopPropagation()}>
          <AudioButton text={word.arabic} dialect={word.dialect as Dialect} audioUrl={word.audioUrl}>
            Listen
          </AudioButton>
          <Button onClick={compareDialects} type="button">Compare Dialects</Button>
        </div>
      </div>

      <div class="border-t border-tile-500 pt-6 mt-6" onclick={(e) => e.stopPropagation()}>
        <p class="text-left text-text-200 mb-4 font-semibold">How well did you remember this word?</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <button
            type="button"
            onclick={() => handleDifficultyClick(1)}
            disabled={selectedDifficulty !== null}
            class="group relative overflow-hidden border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 active:scale-95 py-5 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="absolute inset-0 bg-white/40 scale-0 group-active:scale-100 group-active:opacity-0 transition-all duration-500 rounded-xl"></span>
            <div class="text-3xl mb-2 transform group-hover:scale-110 transition-transform duration-300">😊</div>
            <div class="relative z-10">Easy</div>
            <div class="text-sm font-normal mt-1 text-green-700">Remembered easily</div>
          </button>

          <button
            type="button"
            onclick={() => handleDifficultyClick(2)}
            disabled={selectedDifficulty !== null}
            class="group relative overflow-hidden border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 active:scale-95 py-5 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="absolute inset-0 bg-white/40 scale-0 group-active:scale-100 group-active:opacity-0 transition-all duration-500 rounded-xl"></span>
            <div class="text-3xl mb-2 transform group-hover:scale-110 transition-transform duration-300">🤔</div>
            <div class="relative z-10">Medium</div>
            <div class="text-sm font-normal mt-1 text-yellow-700">Remembered with effort</div>
          </button>

          <button
            type="button"
            onclick={() => handleDifficultyClick(3)}
            disabled={selectedDifficulty !== null}
            class="group relative overflow-hidden border-2 border-red-500 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 active:scale-95 py-5 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="absolute inset-0 bg-white/40 scale-0 group-active:scale-100 group-active:opacity-0 transition-all duration-500 rounded-xl"></span>
            <div class="text-3xl mb-2 transform group-hover:scale-110 transition-transform duration-300">😓</div>
            <div class="relative z-10">Hard</div>
            <div class="text-sm font-normal mt-1 text-red-700">Struggled</div>
          </button>
        </div>
        {#if onForgot}
          <div class="flex justify-center mt-4">
            <button
              type="button"
              onclick={handleForgot}
              disabled={selectedDifficulty !== null}
              class="group relative overflow-hidden border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-text-300 py-3 px-8 rounded-xl font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
            >
              <span class="absolute inset-0 bg-white/40 scale-0 group-active:scale-100 group-active:opacity-0 transition-all duration-500 rounded-xl"></span>
              <span class="text-xl transform group-hover:scale-110 transition-transform duration-300">❌</span>
              <span class="relative z-10">Forgot - Review Again</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

  {#if word.repetitions > 0}
    <div class="mt-6 pt-4 border-t border-tile-500">
      <div class="bg-gradient-to-br from-tile-300/30 to-tile-300/60 rounded-xl p-5 border border-tile-500/30 shadow-inner">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-tile-400 flex items-center justify-center text-xl shadow-md">📊</div>
          <p class="text-base font-bold text-text-300">Your Progress</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-tile-400/40 rounded-lg p-3">
            <p class="text-xs text-text-200 mb-1">Reviews</p>
            <p class="text-2xl font-bold text-text-300">{word.repetitions}</p>
          </div>
          {#if word.intervalDays > 0}
            <div class="bg-tile-400/40 rounded-lg p-3">
              <p class="text-xs text-text-200 mb-1">Next in</p>
              <p class="text-2xl font-bold text-text-300">{word.intervalDays}d</p>
            </div>
          {:else if word.isLearning}
            <div class="bg-blue-100/50 rounded-lg p-3 col-span-2">
              <p class="text-xs text-blue-600 font-medium">Currently learning - will appear more frequently</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else if word.isLearning}
    <div class="mt-6 pt-4 border-t border-tile-500">
      <div class="bg-gradient-to-br from-blue-50/50 to-blue-100/30 border-2 border-blue-200 rounded-xl p-4 text-left shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-xl">✨</span>
          <p class="text-sm text-text-200">
            <span class="font-semibold text-text-300">New word</span> - This word will appear more frequently until you've mastered it
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .flip-card {
    perspective: 1000px;
    cursor: pointer;
    overflow: visible;
  }

  .flip-card-inner {
    position: relative;
    width: 100%;
    transition: transform 0.6s, min-height 0.3s ease;
    transform-style: preserve-3d;
  }

  .flip-card-inner.flipped {
    transform: rotateY(180deg);
  }

  .flip-card-front,
  .flip-card-back {
    width: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .flip-card-front {
    position: relative;
  }

  .flip-card-back {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    transform: rotateY(180deg);
  }
</style>
