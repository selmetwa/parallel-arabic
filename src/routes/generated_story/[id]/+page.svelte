<script lang="ts">
  import { onMount } from "svelte";
  import cn from 'classnames';
	import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';
	import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import { getWordObjectToSave } from '$lib/helpers/get-word-object-to-save';
	import Checkmark from '$lib/components/Checkmark.svelte';
	import { Mode, type KeyWord } from '$lib/types/index';
	import type { PageData } from './$types';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import StoryAudioButton from '$lib/components/StoryAudioButton.svelte';
  import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
  import { goto } from '$app/navigation';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let story = $state({} as any)
  let storyDialect = $state('egyptian-arabic') // Default fallback
  let isHeaderSticky = $state(false);
  let headerRef: HTMLElement;

  // Track scroll for sticky header
  function handleScroll() {
    if (headerRef) {
      isHeaderSticky = window.scrollY > headerRef.offsetHeight;
    }
  }

  onMount(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
  
  // Function to filter out incomplete sentences
  function filterValidSentences(sentences: any[]): any[] {
    return sentences.filter(sentence => 
      sentence && 
      sentence.arabic?.text && 
      sentence.english?.text && 
      sentence.transliteration?.text &&
      typeof sentence.arabic.text === 'string' &&
      typeof sentence.english.text === 'string' &&
      typeof sentence.transliteration.text === 'string' &&
      sentence.arabic.text.trim() !== '' &&
      sentence.english.text.trim() !== '' &&
      sentence.transliteration.text.trim() !== ''
    );
  }

  // Get dialect display name
  function getDialectDisplayName(dialect: string) {
    const dialectNames = {
      'egyptian-arabic': 'Egyptian Arabic',
      'darija': 'Moroccan Darija',
      'fusha': 'Modern Standard Arabic',
      'levantine': 'Levantine Arabic',
      'iraqi': 'Iraqi Arabic',
      'khaleeji': 'Khaleeji Arabic'
    };
    return dialectNames[dialect as keyof typeof dialectNames] || dialect;
  }

  // Get dialect badge color
  function getDialectBadgeColor(dialect: string) {
    const colors = {
      'egyptian-arabic': 'bg-blue-100 text-blue-800',
      'darija': 'bg-green-100 text-green-800',
      'fusha': 'bg-purple-100 text-purple-800',
      'levantine': 'bg-pink-100 text-pink-800',
      'iraqi': 'bg-yellow-100 text-yellow-800',
      'khaleeji': 'bg-indigo-100 text-indigo-800'
    };
    return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  // Load story data
  $effect(() => {
    if (data.story?.[0] && (data.story[0] as any).story_body) {
      const parsedStory = (data.story[0] as any).story_body
      // Get the dialect from the story data
      storyDialect = (data as any).storyData?.dialect || (data.story[0] as any)?.dialect || 'egyptian-arabic';

      // Filter sentences when loading the story
      if (parsedStory.sentences) {
        parsedStory.sentences = filterValidSentences(parsedStory.sentences)
      }
      story = parsedStory
    }
  });

  // Get difficulty badge color
  function getDifficultyBadgeColor(difficulty: string) {
    const colors: Record<string, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  }

  // Get difficulty from story data
  let storyDifficulty = $derived((data as any).storyData?.difficulty || 'beginner');

	// Display mode and toggles
	let mode = $state(Mode.Condensed);
	let showEnglish = $state(true);
	let showTransliteration = $state(true);

	const sentences = $derived(story?.sentences || []);
	const keyVocab = $derived(story?.keyVocab || []);
	const quiz = $derived(story?.quiz || null);
	let currentPlayingSentenceIndex = $state<number | null>(null);

	function handleSentenceChange(index: number | null) {
		currentPlayingSentenceIndex = index;
		// Scroll to the highlighted sentence
		if (index !== null) {
			setTimeout(() => {
				const element = document.querySelector(`[data-sentence-index="${index}"]`) as HTMLElement;
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}, 100);
		}
	}

	
	// Quiz state management
	let quizStates = $state<Record<number, {
		selectedOptionId: string | null;
		isAnswered: boolean;
		isCorrect: boolean;
		showHint: boolean;
	}>>({});
	
	// Initialize quiz states when quiz changes
	$effect(() => {
		if (quiz && quiz.questions) {
			const newStates: Record<number, {
				selectedOptionId: string | null;
				isAnswered: boolean;
				isCorrect: boolean;
				showHint: boolean;
			}> = {};
			quiz.questions.forEach((_: unknown, index: number) => {
				if (!(index in quizStates)) {
					newStates[index] = {
						selectedOptionId: null,
						isAnswered: false,
						isCorrect: false,
						showHint: false
					};
				}
			});
			if (Object.keys(newStates).length > 0) {
				quizStates = { ...quizStates, ...newStates };
			}
		}
	});

  let activeWordObj = $state({
		english: '',
		arabic: '',
		transliterated: '',
		description: '',
		isLoading: false,
		type: ''
	})

	let timer: NodeJS.Timeout | null = null;
	let isLoading = $state(false);
	let isModalOpen = $state(false);
	let response = $state('');
	let error = $state('');

	// Parse description as JSON if possible
	let parsedDescription = $derived.by(() => {
		if (!activeWordObj.description) return null;
		try {
			return JSON.parse(activeWordObj.description);
		} catch {
			return null;
		}
	});

	function closeModal() {
		timer = setTimeout(() => {
			activeWordObj = {
				english: '',
				arabic: '',
				transliterated: '',
				description: '',
				isLoading: false,
				type: ''
			};
		}, 3000);
		isModalOpen = false;
	}

	function setActiveWord(word: KeyWord) {
		if (timer) {
			clearTimeout(timer);
		}
		activeWordObj = word;
		isModalOpen = true;
	}

	const saveWord = async () => {
		isLoading = true;
		const wordToSave = activeWordObj.arabic;
		const type = activeWordObj.type;

		const result = await getWordObjectToSave(wordToSave, type);
		
		if (result.error) {
			error = result.error;
			response = '';
			isLoading = false;

			setTimeout(() => {
				error = '';
				response = '';
			}, 3000);

			return;
		}

		if (!result.success || !result.data) {
			error = 'Failed to get word data';
			response = '';
			isLoading = false;
			setTimeout(() => {
				error = '';
			}, 3000);
			return;
		}

		const _activeWordObj = result.data;

		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: _activeWordObj
			})
		});

		isLoading = false;
		const data = await res.json();

		if (
			[
				'You have already saved this',
				'You must have an account do that',
				'Something went wrong'
			].includes(data.message)
		) {
			error = data.message;
			response = '';
		} else {
			error = '';
			response = data.message;
		}

		setTimeout(() => {
			error = '';
			response = '';
		}, 3000);
	};
</script>

<DefinitionModal {activeWordObj} {isModalOpen} {closeModal} dialect={storyDialect as any}></DefinitionModal>

<!-- Sticky Controls Bar -->
{#if isHeaderSticky && sentences.length > 0}
  <div class="fixed top-0 left-0 right-0 z-40 bg-tile-400/95 backdrop-blur-sm border-b border-tile-600 shadow-lg px-4 py-3">
    <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
      <button
        onclick={() => goto('/stories')}
        class="flex items-center gap-2 text-text-200 hover:text-text-300 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="hidden sm:inline text-sm font-medium">Back</span>
      </button>

      <!-- Sentence count and toggles -->
      <div class="flex-1 flex items-center justify-center gap-4">
        <span class="text-sm text-text-200">{sentences.length} sentences</span>
        <div class="hidden sm:flex items-center gap-3">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" bind:checked={showEnglish} class="w-4 h-4 rounded" />
            <span class="text-xs text-text-200">EN</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" bind:checked={showTransliteration} class="w-4 h-4 rounded" />
            <span class="text-xs text-text-200">Trans</span>
          </label>
        </div>
      </div>

    </div>
  </div>
{/if}

{#if sentences.length > 0}
  <header bind:this={headerRef} class="border-b border-tile-600 px-4 pb-6 sm:px-8">
    <!-- Back Button and Title Row -->
    <div class="pt-4 pb-2">
      <button
        onclick={() => goto('/stories')}
        class="flex items-center gap-2 text-text-200 hover:text-text-300 transition-colors mb-4 group"
      >
        <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="text-sm font-medium">Back to Stories</span>
      </button>
    </div>

    <!-- Story Title -->
    <div class="text-center mb-6">
      <h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-2" dir="rtl">
        {story?.title?.arabic}
      </h1>
      <h2 class="text-xl sm:text-2xl text-text-200">
        {story?.title?.english}
      </h2>

      <!-- Badges -->
      <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
        <span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full {getDialectBadgeColor(storyDialect)}">
          {getDialectDisplayName(storyDialect)}
        </span>
        <span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full {getDifficultyBadgeColor(storyDifficulty)}">
          {storyDifficulty.charAt(0).toUpperCase() + storyDifficulty.slice(1)}
        </span>
        <span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-tile-500 text-text-300">
          {sentences.length} sentences
        </span>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="flex flex-col gap-4">
      <!-- Top row: Audio + Mode Switcher -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <!-- Audio Controls -->
        <div class="flex items-center gap-2">
          <StoryAudioButton
            dialect={storyDialect as any}
            sentences={sentences}
            onSentenceChange={handleSentenceChange}
          />
        </div>
      </div>

      <!-- Bottom row: Display Toggles -->
      <div class="flex items-center justify-center gap-6 py-2 px-4 bg-tile-500/50 rounded-lg">
        <span class="text-sm text-text-200 font-medium">Show:</span>

        <!-- English Toggle -->
        <label class="flex items-center gap-2 cursor-pointer">
          <div class="relative">
            <input
              type="checkbox"
              bind:checked={showEnglish}
              class="sr-only peer"
            />
            <div class="w-10 h-5 bg-tile-600 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
            <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
          <span class="text-sm text-text-300">English</span>
        </label>

        <!-- Transliteration Toggle -->
        <label class="flex items-center gap-2 cursor-pointer">
          <div class="relative">
            <input
              type="checkbox"
              bind:checked={showTransliteration}
              class="sr-only peer"
            />
            <div class="w-10 h-5 bg-tile-600 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
            <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
          <span class="text-sm text-text-300">Transliteration</span>
        </label>
      </div>
    </div>
  </header>
{:else}
  <!-- Loading Skeleton -->
  <div class="px-4 py-8 sm:px-8 animate-pulse">
    <div class="h-4 w-24 bg-tile-500 rounded mb-6"></div>
    <div class="text-center space-y-4">
      <div class="h-10 w-3/4 bg-tile-500 rounded mx-auto"></div>
      <div class="h-6 w-1/2 bg-tile-500 rounded mx-auto"></div>
      <div class="flex justify-center gap-2 mt-4">
        <div class="h-6 w-24 bg-tile-500 rounded-full"></div>
        <div class="h-6 w-20 bg-tile-500 rounded-full"></div>
      </div>
    </div>
    <div class="mt-8 space-y-4">
      <div class="h-32 bg-tile-500 rounded-lg"></div>
      <div class="h-32 bg-tile-500 rounded-lg"></div>
    </div>
  </div>
{/if}

{#if error}
  <div
    class="absolute left-0 top-0 z-50 h-[107px] w-full bg-red-100 py-4 text-center sm:h-[67px]"
  >
    <p class="text-xl font-semibold text-text-300">{error}</p>
  </div>
{/if}

{#if sentences.length > 0}
  <!-- Story sentences with word-aligned display -->
  <div class="space-y-6 px-4 py-6">
    {#each sentences as sentence, sentenceIndex}
      {@const isCurrentlyPlaying = currentPlayingSentenceIndex === sentenceIndex}
      {@const arabicWords = sentence.arabic?.text?.split(' ') || []}

      <section
        data-sentence-index={sentenceIndex}
        class={cn(
          "bg-tile-400 border-2 rounded-xl p-6 transition-all duration-300",
          isCurrentlyPlaying ? "border-tile-700 bg-tile-500 shadow-lg" : "border-tile-600"
        )}
      >
        <!-- Speaker label -->
        {#if sentence.arabic?.speaker}
          <div class="mb-3">
            <p class="text-sm font-semibold text-text-300">{sentence.arabic.speaker}</p>
          </div>
        {/if}

        <!-- English translation with drag-to-select (if showEnglish is true) -->
        {#if showEnglish}
          <div class="mb-4 pb-3 border-b border-tile-600">
            <Sentence
              {sentence}
              {setActiveWord}
              type="english"
              index={sentenceIndex}
              {mode}
              isGenerated={true}
              dialect={storyDialect as any}
              classname="!bg-transparent !border-0 !shadow-none !p-0"
              innerClassname="justify-center"
              size="sm"
            />
          </div>
        {/if}

        <!-- Word-aligned display (when wordAlignments available) OR fallback -->
        {#if sentence.wordAlignments?.length}
          <!-- Word-by-word aligned display -->
          <div class="flex flex-wrap gap-3 sm:gap-4 justify-center" dir="rtl">
            {#each sentence.wordAlignments as wordAlign, wordIndex}
              <button
                class="flex flex-col items-center px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-tile-500 hover:shadow-md transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-tile-600"
                onclick={async (e) => {
                  e.stopPropagation();
                  const cleanWord = wordAlign.arabic.replace(/[،,]/g, '');

                  setActiveWord({
                    english: '',
                    arabic: '',
                    transliterated: '',
                    description: '',
                    isLoading: true,
                    type: ''
                  });

                  isModalOpen = true;

                  try {
                    const res = await fetch('/api/definition-sentence', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        word: cleanWord,
                        type: 'arabic',
                        sentence: {
                          arabic: sentence.arabic.text,
                          english: sentence.english.text,
                          transliteration: sentence.transliteration.text
                        },
                        dialect: storyDialect
                      })
                    });

                    const data = await res.json();

                    setActiveWord({
                      english: wordAlign.english,
                      arabic: cleanWord,
                      transliterated: wordAlign.transliteration,
                      description: data.message?.message?.content || '',
                      isLoading: false,
                      type: 'arabic'
                    });
                  } catch (err) {
                    console.error('Error fetching definition:', err);
                    setActiveWord({
                      english: wordAlign.english,
                      arabic: cleanWord,
                      transliterated: wordAlign.transliteration,
                      description: '',
                      isLoading: false,
                      type: 'arabic'
                    });
                  }
                }}
              >
                <!-- Transliteration (top) -->
                {#if showTransliteration}
                  <span class="text-xs sm:text-sm text-text-200 italic mb-0.5 opacity-75 group-hover:opacity-100 transition-opacity">
                    {wordAlign.transliteration}
                  </span>
                {/if}
                <!-- English (middle) -->
                {#if showEnglish}
                  <span class="text-xs sm:text-sm text-text-200 mb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {wordAlign.english}
                  </span>
                {/if}
                <!-- Arabic (bottom, largest) -->
                <span class="text-xl sm:text-2xl md:text-3xl font-semibold text-text-300">
                  {wordAlign.arabic}
                </span>
              </button>
            {/each}
          </div>
        {:else}
          <!-- Fallback: Sentence-level display for older stories without word alignments -->
          {#if showTransliteration}
            <p class="text-base sm:text-lg text-text-200 italic text-center mb-3 leading-relaxed">
              {sentence.transliteration?.text || ''}
            </p>
          {/if}

          <!-- Arabic words - clickable for definitions -->
          <div class="flex flex-wrap gap-2 sm:gap-3 justify-center" dir="rtl">
            {#each arabicWords as arabicWord, wordIndex}
              <button
                class="px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-tile-500 hover:shadow-md transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-tile-600 text-xl sm:text-2xl md:text-3xl font-semibold text-text-300"
                onclick={async (e) => {
                  e.stopPropagation();
                  const cleanWord = arabicWord.replace(/[،,]/g, '');

                  setActiveWord({
                    english: '',
                    arabic: '',
                    transliterated: '',
                    description: '',
                    isLoading: true,
                    type: ''
                  });

                  isModalOpen = true;

                  try {
                    const res = await fetch('/api/definition-sentence', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        word: cleanWord,
                        type: 'arabic',
                        sentence: {
                          arabic: sentence.arabic.text,
                          english: sentence.english.text,
                          transliteration: sentence.transliteration.text
                        },
                        dialect: storyDialect
                      })
                    });

                    const data = await res.json();

                    setActiveWord({
                      english: '',
                      arabic: cleanWord,
                      transliterated: '',
                      description: data.message?.message?.content || '',
                      isLoading: false,
                      type: 'arabic'
                    });
                  } catch (err) {
                    console.error('Error fetching definition:', err);
                    setActiveWord({
                      english: '',
                      arabic: cleanWord,
                      transliterated: '',
                      description: '',
                      isLoading: false,
                      type: 'arabic'
                    });
                  }
                }}
              >
                {arabicWord}
              </button>
            {/each}
          </div>
        {/if}

        <!-- Footer with sentence number and audio -->
        <div class="mt-4 pt-3 border-t border-tile-600 flex items-center justify-between">
          <span class="text-xs text-text-200">Sentence {sentenceIndex + 1} of {sentences.length}</span>
          <AudioButton text={sentence.arabic.text} dialect={storyDialect as any} />
        </div>
      </section>
    {/each}
  </div>
{/if}

<!-- Key Vocabulary Section -->
{#if keyVocab && keyVocab.length > 0}
  <section class="px-4 py-8 sm:px-8 max-w-5xl mx-auto border-t border-tile-600 mt-8">
    <!-- Section Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-text-300 flex items-center gap-3">
          <span class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          Key Vocabulary
        </h2>
        <p class="text-text-200 mt-1">{keyVocab.length} words from this story</p>
      </div>
      {#if data.user?.id}
        <button
          type="button"
          onclick={async () => {
            try {
              const response = await fetch('/api/save-sentences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sentences: keyVocab,
                  dialect: storyDialect
                })
              });
              const result = await response.json();
              if (result.success) {
                alert(`Saved ${result.saved} word${result.saved !== 1 ? 's' : ''} to your review deck!`);
              }
            } catch (error) {
              console.error('Error saving vocabulary:', error);
            }
          }}
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg active:scale-95"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save All to Review
        </button>
      {/if}
    </div>

    <!-- Vocabulary Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each keyVocab as word, i}
        <div class="group bg-tile-400 border-2 border-tile-600 rounded-xl p-5 hover:bg-tile-500 hover:border-tile-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <!-- Arabic Word -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <p class="text-3xl font-bold text-text-300 flex-1 leading-tight" dir="rtl">{word.arabic}</p>
            <div class="flex items-center gap-2 flex-shrink-0">
              <InlineAudioButton text={word.arabic} dialect={storyDialect as any} />
            </div>
          </div>

          <!-- Divider -->
          <div class="h-px bg-tile-600 my-3"></div>

          <!-- English Translation -->
          <p class="text-lg text-text-300 font-semibold mb-1">{word.english}</p>

          <!-- Transliteration -->
          <p class="text-text-200 italic text-sm">{word.transliteration}</p>

          <!-- Hover indicator -->
          <div class="mt-3 pt-3 border-t border-tile-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <p class="text-xs text-text-200 text-center">Click on the word in the story for more details</p>
          </div>
        </div>
      {/each}
    </div>
  </section>
{/if}

<!-- Quiz Section -->
{#if quiz && quiz.questions && quiz.questions.length > 0}
  {@const answeredCount = Object.values(quizStates).filter(s => s?.isAnswered).length}
  {@const correctCount = Object.values(quizStates).filter(s => s?.isAnswered && s?.isCorrect).length}
  {@const quizProgress = (answeredCount / quiz.questions.length) * 100}

  <section class="px-4 py-8 sm:px-8 max-w-5xl mx-auto border-t border-tile-600 mt-8">
    <!-- Quiz Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-3 mb-4">
        <span class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <h2 class="text-2xl sm:text-3xl font-bold text-text-300">Comprehension Quiz</h2>
      </div>
      <p class="text-text-200">Test your understanding of the story</p>
    </div>

    <!-- Quiz Progress Card -->
    <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Progress Stats -->
        <div class="flex items-center gap-6">
          <div class="text-center">
            <p class="text-3xl font-bold text-text-300">{answeredCount}</p>
            <p class="text-sm text-text-200">Answered</p>
          </div>
          <div class="w-px h-12 bg-tile-600"></div>
          <div class="text-center">
            <p class="text-3xl font-bold text-green-600">{correctCount}</p>
            <p class="text-sm text-text-200">Correct</p>
          </div>
          <div class="w-px h-12 bg-tile-600"></div>
          <div class="text-center">
            <p class="text-3xl font-bold text-text-300">{quiz.questions.length}</p>
            <p class="text-sm text-text-200">Total</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="flex-1 max-w-xs">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-text-200">Progress</span>
            <span class="font-medium text-text-300">{Math.round(quizProgress)}%</span>
          </div>
          <div class="h-3 bg-tile-600 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
              style="width: {quizProgress}%"
            ></div>
          </div>
        </div>
      </div>

      <!-- Score display when complete -->
      {#if answeredCount === quiz.questions.length}
        <div class="mt-6 pt-6 border-t border-tile-600 text-center">
          <p class="text-lg text-text-200 mb-2">Quiz Complete!</p>
          <p class="text-2xl font-bold {correctCount === quiz.questions.length ? 'text-green-600' : correctCount >= quiz.questions.length / 2 ? 'text-yellow-600' : 'text-red-600'}">
            {correctCount} / {quiz.questions.length} correct
            {#if correctCount === quiz.questions.length}
              - Perfect!
            {:else if correctCount >= quiz.questions.length / 2}
              - Good job!
            {:else}
              - Keep practicing!
            {/if}
          </p>
        </div>
      {/if}
    </div>

    <!-- Questions -->
    <div class="space-y-6">
      {#each quiz.questions as question, qIndex}
        {@const questionState = quizStates[qIndex] || {
          selectedOptionId: null,
          isAnswered: false,
          isCorrect: false,
          showHint: false
        }}

        <div class={cn(
          "bg-tile-400 border-2 rounded-xl p-6 transition-all duration-300",
          questionState.isAnswered
            ? questionState.isCorrect
              ? "border-green-500 bg-green-50/10"
              : "border-red-500 bg-red-50/10"
            : "border-tile-600 hover:border-tile-500"
        )}>
          <!-- Question Header -->
          <div class="flex items-start gap-4 mb-5">
            <span class={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
              questionState.isAnswered
                ? questionState.isCorrect
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                : "bg-tile-500 text-text-300"
            )}>
              {qIndex + 1}
            </span>
            <h3 class="text-lg sm:text-xl font-semibold text-text-300 flex-1 pt-1.5">
              {question.question}
            </h3>
            {#if questionState.isAnswered}
              <span class="flex-shrink-0 text-2xl">
                {questionState.isCorrect ? '✅' : '❌'}
              </span>
            {/if}
          </div>

          <!-- Options -->
          <div class="space-y-3 ml-0 sm:ml-14">
            {#each question.options as option, optIndex}
              {@const isSelected = questionState.selectedOptionId === option.id}
              {@const isCorrectOption = option.isCorrect}
              {@const showSuccess = questionState.isAnswered && isCorrectOption}
              {@const showError = questionState.isAnswered && isSelected && !isCorrectOption}
              {@const isArabicOption = question.optionLanguage === 'arabic' || !question.optionLanguage}
              {@const optionLetter = String.fromCharCode(65 + optIndex)}

              <button
                type="button"
                onclick={() => {
                  if (questionState.isAnswered) return;
                  quizStates[qIndex] = {
                    selectedOptionId: option.id,
                    isAnswered: true,
                    isCorrect: isCorrectOption,
                    showHint: questionState.showHint
                  };
                  quizStates = { ...quizStates };
                }}
                disabled={questionState.isAnswered}
                class={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                  isArabicOption ? "text-right flex-row-reverse" : "text-left",
                  !questionState.isAnswered && "hover:bg-tile-500 hover:border-tile-500 cursor-pointer",
                  questionState.isAnswered && "cursor-default",
                  isSelected && !questionState.isAnswered && "border-tile-700 bg-tile-500",
                  !isSelected && !questionState.isAnswered && "border-tile-600 bg-tile-300",
                  showSuccess && "!border-green-500 !bg-green-100",
                  showError && "!border-red-500 !bg-red-100"
                )}
              >
                <!-- Option Letter -->
                <span class={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm",
                  showSuccess ? "bg-green-200 text-green-700" :
                  showError ? "bg-red-200 text-red-700" :
                  isSelected ? "bg-tile-600 text-text-300" :
                  "bg-tile-500 text-text-200"
                )}>
                  {optionLetter}
                </span>

                <!-- Option Text -->
                <p class={cn(
                  "flex-1 text-lg font-medium",
                  showSuccess ? "text-green-800" :
                  showError ? "text-red-800" :
                  "text-text-300"
                )} dir={isArabicOption ? 'rtl' : 'ltr'}>
                  {option.text}
                </p>

                <!-- Audio & Status Icons -->
                <div class="flex items-center gap-2 flex-shrink-0">
                  {#if isArabicOption}
                    <InlineAudioButton text={option.text} dialect={storyDialect as any} />
                  {/if}
                  {#if showSuccess}
                    <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  {:else if showError}
                    <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <!-- Hint Section -->
          {#if questionState.isAnswered && question.hint}
            <div class="mt-5 ml-0 sm:ml-14">
              <button
                type="button"
                onclick={() => {
                  quizStates[qIndex] = {
                    ...questionState,
                    showHint: !questionState.showHint
                  };
                  quizStates = { ...quizStates };
                }}
                class="flex items-center gap-2 text-sm text-text-200 hover:text-text-300 transition-colors"
              >
                <svg class={cn("w-4 h-4 transition-transform", questionState.showHint && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <span class="font-medium">{questionState.showHint ? 'Hide' : 'Show'} explanation</span>
              </button>

              {#if questionState.showHint}
                <div class="mt-3 p-4 bg-tile-500 rounded-lg border border-tile-600">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    <span class="font-semibold text-text-300">Hint</span>
                  </div>
                  {#if question.optionLanguage === 'english'}
                    {#if question.hint.arabic}
                      <p class="text-text-300 text-lg mb-2" dir="rtl">{question.hint.arabic}</p>
                    {/if}
                    {#if question.hint.transliteration}
                      <p class="text-text-200 italic">{question.hint.transliteration}</p>
                    {/if}
                  {:else}
                    {#if question.hint.transliteration}
                      <p class="text-text-200 italic">{question.hint.transliteration}</p>
                    {/if}
                    {#if question.hint.arabic}
                      <p class="text-text-300 text-lg mt-2" dir="rtl">{question.hint.arabic}</p>
                    {/if}
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}
