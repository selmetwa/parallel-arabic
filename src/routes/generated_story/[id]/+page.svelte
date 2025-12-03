<script lang="ts">
  import { onMount } from "svelte";
  import cn from 'classnames';
	import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';
	import WordModal from '$lib/components/dialect-shared/story/components/WordModal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import { getWordObjectToSave } from '$lib/helpers/get-word-object-to-save';
	import Checkmark from '$lib/components/Checkmark.svelte';
	import { Mode, type KeyWord } from '$lib/types/index';
	import type { PageData } from './$types';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import StoryAudioButton from '$lib/components/StoryAudioButton.svelte';
  import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';

  interface Props { 
    data: PageData;
  }

  let { data }: Props = $props();
  let story = $state({} as any)
  let storyDialect = $state('egyptian-arabic') // Default fallback

  $inspect({ data })
  
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

  onMount(() => {
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
  })

	let mode = $state(Mode.SingleText);
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
	let index = $state(0);
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
	
	interface Props {
		data: any;
		activeWordObj?: KeyWord;
	}

	$effect(() => {
		if (index) {
			activeWordObj = {
				english: '',
				arabic: '',
				transliterated: '',
				description: '',
				isLoading: false,
				type: ''
			};
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

	function next() {
		if (index < sentences.length - 1) {
			index += 1;
		}
	}

	function previous() {
		if (index > 0) {
			index -= 1;
		}
	}

	const modeOptions = [
		{ value: Mode.SingleText, text: 'Arabic' },
		{ value: Mode.BiText, text: 'English & Arabic' },
		{ value: Mode.SentanceView, text: 'English, Arabic, and Transliteration' }
	];

	function updateMode(event: Event) {
		mode = (event.target as HTMLInputElement).value as Mode;
	}

	function setActiveWord(word: KeyWord) {
		if (timer) {
			clearTimeout(timer);
		}
		activeWordObj = word;

		if (mode !== Mode.SentanceView) {
			isModalOpen = true;
			return;
		}
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

<WordModal {activeWordObj} {isModalOpen} {closeModal} dialect={storyDialect as any}></WordModal>
{#if sentences.length > 0}
  <header class="border-b border-tile-600 px-4 pb-8 text-center sm:px-8">
    <div class="py-4 flex flex-col items-center gap-3">
      <h1 class="text-4xl font-semibold text-text-200">
        {story?.title?.arabic} / {story?.title?.english}
      </h1>
      <!-- Dialect Badge -->
      <span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full {getDialectBadgeColor(storyDialect)}">
        {getDialectDisplayName(storyDialect)}
      </span>
    </div>
    <div class="flex flex-col items-start justify-between sm:flex-row sm:items-center">
      <div class="flex w-fit gap-2">
          {#if mode === Mode.SentanceView && sentences[index]}
            <AudioButton text={sentences[index].arabic.text} dialect={storyDialect as any} />
          {/if}
          <StoryAudioButton 
            dialect={storyDialect as any} 
            sentences={sentences}
            onSentenceChange={handleSentenceChange}
          />
      </div>
      <fieldset class="flex w-full place-content-end">
        <legend class="sr-only">Select Mode</legend>
        <ul class="flex flex-row gap-1">
          {#each modeOptions as option}
            <li>
              <RadioButton
                wrapperClass="!p-1 h-min"
                className="text-xs !p-1 h-min font-semibold"
                selectableFor={option.value}
                value={option.value}
                text={option.text}
                isSelected={option.value === mode}
                onClick={updateMode}
              />
            </li>
          {/each}
        </ul>
      </fieldset>
    </div>
  </header>
{:else}
  <div class="flex items-center justify-center py-20">
    <p class="text-xl text-text-200">Loading story...</p>
  </div>
{/if}

{#if error}
  <div
    class="absolute left-0 top-0 z-50 h-[107px] w-full bg-red-100 py-4 text-center sm:h-[67px]"
  >
    <p class="text-xl font-semibold text-text-300">{error}</p>
  </div>
{/if}

{#if mode === Mode.SentanceView && sentences.length > 0 && sentences[index]}
  {@const isCurrentlyPlaying = currentPlayingSentenceIndex === index}
  <section
    data-sentence-index={index}
    class={cn(
      "grid grid-cols-1 grid-rows-4 divide-x divide-tile-600 sm:grid-cols-2 sm:grid-rows-2 transition-all duration-300",
      isCurrentlyPlaying ? 'bg-tile-500 border-2 border-tile-700 shadow-lg' : 'bg-tile-300'
    )}
  >
    <Sentence
    isGenerated={true}
      {index}
      sentence={sentences[index]}
      {setActiveWord}
      type="english"
      classname="row-[2] sm:row-[1] sm:col-[1]"
      {mode}
      dialect={storyDialect as any}
    />
    <Sentence
    isGenerated={true}
      {index}
      classname="row-[1] sm:row-[1] sm:col-[2]"
      sentence={sentences[index]}
      {setActiveWord}
      type="arabic"
      {mode}
      dialect={storyDialect as any}
    />
    <div
      class="col-[1] row-[4] flex flex-col items-center justify-center border-b border-tile-600 px-5 py-10 text-text-300 sm:row-[2]"
    >
      {#if activeWordObj.description || activeWordObj.isLoading}
        <div class="flex flex-col items-center p-4 w-full">
          <p class="text-4xl text-text-300 mb-4" dir={activeWordObj.type === 'arabic' ? 'rtl' : 'ltr'}>
            {activeWordObj.type === 'transliteration' ? activeWordObj.transliterated : 
             activeWordObj.type === 'english' ? activeWordObj.english : 
             activeWordObj.arabic || activeWordObj.transliterated || activeWordObj.english}
          </p>
          
          {#if activeWordObj.description && !activeWordObj.isLoading}
            <div class="bg-tile-300 border border-tile-500 p-4 rounded mb-4 w-full">
              <h4 class="text-sm font-bold text-text-200 mb-2">Definition</h4>
              {#if parsedDescription}
                <!-- Arabic and Transliteration from definition -->
                {#if parsedDescription.arabic || parsedDescription.transliteration}
                  <div class="mb-3 pb-3 border-b border-tile-400">
                    {#if parsedDescription.arabic}
                      <p class="text-2xl text-text-300 font-bold mb-1" dir="rtl">{parsedDescription.arabic}</p>
                    {/if}
                    {#if parsedDescription.transliteration}
                      <p class="text-lg text-text-200 italic">{parsedDescription.transliteration}</p>
                    {/if}
                  </div>
                {/if}
                
                <p class="text-text-300 leading-relaxed mb-2">{parsedDescription.definition}</p>
                
                {#if parsedDescription.contextualMeaning}
                  <p class="text-text-200 text-sm mt-2 italic">Context: {parsedDescription.contextualMeaning}</p>
                {/if}

                {#if parsedDescription.breakdown && parsedDescription.breakdown.length > 0}
                  <div class="mt-3 pt-3 border-t border-tile-400">
                    <p class="text-sm font-bold text-text-200 mb-2">Breakdown:</p>
                    <div class="space-y-2">
                      {#each parsedDescription.breakdown as item}
                        <div class="flex flex-col text-sm">
                          <div class="flex items-baseline gap-2">
                            <span class="font-bold text-text-300" dir="rtl">{item.arabic}</span>
                            <span class="text-text-200">({item.word})</span>
                          </div>
                          <div class="text-text-200 ml-2">
                            <span class="italic">{item.transliteration}</span>
                            <span> - {item.meaning}</span>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              {:else}
                <p class="text-text-300 leading-relaxed">{activeWordObj.description}</p>
              {/if}
            </div>
          {/if}

          {#if activeWordObj.isLoading}
            <div role="status">
              <svg
                aria-hidden="true"
                class="my-3 h-12 w-12 animate-spin fill-tile-500 text-text-200 dark:text-text-200"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span class="sr-only">Loading...</span>
            </div>
          {/if}
          <div class="mt-2 flex w-full flex-row items-center gap-2">
            <Button type="button" onClick={saveWord}>
              {#if isLoading}
                <span class="mx-auto flex w-fit flex-row items-center gap-2 text-center">
                  <div role="status">
                    <svg
                      aria-hidden="true"
                      class="h-[24px] w-[24px] animate-spin fill-tile-300 text-text-200 dark:text-text-200"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span class="sr-only">Loading...</span>
                  </div>
                  Saving
                </span>
              {:else if response && !error}
                <span class="mx-auto flex w-fit flex-row items-center gap-2 text-center">
                  <Checkmark></Checkmark>
                  Saved
                </span>
              {:else}
                Save Word
              {/if}
            </Button>
          </div>
        </div>
      {:else}
        <h3 class="text-xl font-semibold">No Active Word</h3>
        <p class="text-lg">Click on a word to get a full definition.</p>
      {/if}
    </div>
    <Sentence
    isGenerated={true}
      {index}
      classname="row-[3] sm:row-[2] sm:col-[2]"
      sentence={sentences[index]}
      {setActiveWord}
      type="transliteration"
      {mode}
      dialect={storyDialect as any}
    />
  </section>
  <div class="flex flex-col items-center gap-2">
    <div class="mt-4 flex w-fit flex-row items-center gap-2">
      {#if index > 0}
        <Button onClick={previous} type="button">Previous</Button>
      {/if}
      {#if index < sentences.length - 1}
        <Button onClick={next} type="button">Next</Button>
      {/if}
    </div>
    <p class="text-md text-text-300">
      {index + 1} / {sentences.length}
    </p>
  </div>
{:else if sentences.length > 0}
  {#each sentences as sentence, sentenceIndex}
    {@const isCurrentlyPlaying = currentPlayingSentenceIndex === sentenceIndex}
    <section
      data-sentence-index={sentenceIndex}
      class={cn(
        'divide-tile-600 sm:grid transition-all duration-300',
        { 'grid-cols-1 grid-rows-1': mode === Mode.SingleText },
        { 'flex flex-col-reverse divide-x sm:grid-cols-2 sm:grid-rows-1': mode === Mode.BiText },
        isCurrentlyPlaying ? 'bg-tile-500 border-2 border-tile-700 shadow-lg' : 'bg-tile-300'
      )}
    >
      {#if mode === Mode.BiText}
        <Sentence
          {sentence}
          {setActiveWord}
          type="english"
          index={sentences.indexOf(sentence)}
          {mode}
          isGenerated={true}
          dialect={storyDialect as any}
        />
      {/if}
      <Sentence
      isGenerated={true}
        {sentence}
        type="arabic"
        {setActiveWord}
        {mode}
        index={sentences.indexOf(sentence)}
        dialect={storyDialect as any}
      />
    </section>
  {/each}
{/if}

<!-- Key Vocabulary Section -->
{#if keyVocab && keyVocab.length > 0}
  <section class="px-4 py-8 sm:px-8 max-w-4xl mx-auto border-t border-tile-600 mt-8">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-3xl font-bold text-text-300">📚 Key Vocabulary</h2>
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
          class="px-4 py-2 bg-tile-500 text-text-300 rounded-lg border-2 border-tile-600 hover:bg-tile-600 transition-colors font-semibold text-sm"
        >
          💾 Save All to Review
        </button>
      {/if}
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each keyVocab as word}
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-4 hover:bg-tile-500 transition-colors">
          <div class="flex items-start justify-between gap-2 mb-2">
            <p class="text-2xl font-bold text-text-300 flex-1" dir="rtl">{word.arabic}</p>
            <InlineAudioButton text={word.arabic} dialect={storyDialect as any} />
          </div>
          <p class="text-text-200 font-semibold mb-1">{word.english}</p>
          <p class="text-text-200 italic text-sm">{word.transliteration}</p>
        </div>
      {/each}
    </div>
  </section>
{/if}

<!-- Quiz Section -->
{#if quiz && quiz.questions && quiz.questions.length > 0}
  <section class="px-4 py-8 sm:px-8 max-w-4xl mx-auto border-t border-tile-600 mt-8">
    <h2 class="text-3xl font-bold text-text-300 mb-6 text-center">❓ Quiz</h2>
    <p class="text-text-200 text-center mb-8">Test your understanding of the story</p>
    
    <div class="space-y-8">
      {#each quiz.questions as question, qIndex}
        {@const questionState = quizStates[qIndex] || {
          selectedOptionId: null,
          isAnswered: false,
          isCorrect: false,
          showHint: false
        }}
        
        <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6">
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-xl font-bold text-text-300 flex-1">
              Question {qIndex + 1}: {question.question}
            </h3>
            {#if questionState.isAnswered && questionState.isCorrect}
              <span class="text-2xl">✅</span>
            {:else if questionState.isAnswered && !questionState.isCorrect}
              <span class="text-2xl">❌</span>
            {/if}
          </div>
          
          <div class="space-y-3">
            {#each question.options as option}
              {@const isSelected = questionState.selectedOptionId === option.id}
              {@const isCorrectOption = option.isCorrect}
              {@const showSuccess = questionState.isAnswered && isCorrectOption}
              {@const showError = questionState.isAnswered && isSelected && !isCorrectOption}
              {@const isArabicOption = question.optionLanguage === 'arabic' || !question.optionLanguage}
              {@const isEnglishOption = question.optionLanguage === 'english'}
              
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
                class="w-full flex items-center justify-between gap-3 p-4 rounded-lg border-2 transition-all
                  {isArabicOption ? 'text-right' : 'text-left'}
                  {isSelected ? 'border-tile-700 bg-tile-500' : 'border-tile-600 bg-tile-300 hover:bg-tile-400'}
                  {showSuccess ? '!border-green-600 !bg-green-100' : ''}
                  {showError ? '!border-red-600 !bg-red-100' : ''}
                  {questionState.isAnswered ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
                "
              >
                <div class="flex-1">
                  <p class="text-xl font-semibold text-text-300 mb-1" dir={isArabicOption ? 'rtl' : 'ltr'}>
                    {option.text}
                  </p>
                </div>
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
          
          {#if questionState.isAnswered && question.hint}
            <div class="mt-4 p-4 bg-tile-500 rounded-lg border border-tile-600">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-bold text-text-300">💡 Hint</p>
                <button
                  type="button"
                  onclick={() => {
                    quizStates[qIndex] = {
                      ...questionState,
                      showHint: !questionState.showHint
                    };
                    quizStates = { ...quizStates };
                  }}
                  class="text-xs text-tile-700 hover:text-text-300 font-semibold underline"
                >
                  {questionState.showHint ? 'Hide' : 'Show'} hint
                </button>
              </div>
              {#if questionState.showHint}
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
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}
