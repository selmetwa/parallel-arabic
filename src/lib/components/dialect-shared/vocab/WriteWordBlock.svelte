<script lang="ts">
	import { onMount } from 'svelte';
	import cn from 'classnames';

	import { hue, theme } from '$lib/store/store';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { type Keyboard, type Dialect } from '$lib/types/index';
	import Button from '$lib/components/Button.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import { getBrowserInfo } from '$lib/helpers/get-browser-info';
  import Modal from '$lib/components/Modal.svelte';
  import KeyboardDocumentation from '$lib/components/KeyboardDocumentation.svelte';
  import SaveButton from '$lib/components/SaveButton.svelte';
  import InfoDisclaimer from '$lib/components/InfoDisclaimer.svelte';
  import AudioButton from "$lib/components/AudioButton.svelte";
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import { askChatGTP } from '$lib/components/dialect-shared/story/helpers/ask-chat-gpt';
  import { normalizeArabicText, normalizeArabicTextLight, filterArabicCharacters } from '$lib/utils/arabic-normalization';

	type Word = {
		english: string;
		arabic: string;
		transliteration: string;
		audioUrl?: string;
	};

	type Attempt = {
		letter: string;
		correct: boolean;
	};

	interface Props {
		word: Word;
		mode: string;
		switchMode: () => void;
		dialect: Dialect;
	}

	let { word, mode, switchMode, dialect }: Props = $props();

	let attemptTemp: Attempt[] = $state([]);
	let showHint = $state(false);
	let showAnswer = $state(false);
	let correctAnswer = $state('');
	let arabicWord = $state(''); // Original word preserved as-is
  let keyboard = $state('virtual')
	let attempt: Attempt[] = $state([]);
	let isCorrect = $state(false);
  let isInfoModalOpen = $state(false);
  let keyboardValue = $state('');
  
  // Multi-word selection state
  let selectedWords = $state<string[]>([]);
  let isSelecting = $state(false);
  let selectionStartIndex = $state(-1);
  let selectionEndIndex = $state(-1);
  let isDefinitionModalOpen = $state(false);
  let isLoadingDefinition = $state(false);
  let definition = $state('');
  let targetWord = $state('');
  let targetArabicWord = $state('');

  const regex = /[-–]/;



	function areArraysEqual(arr1: Array<string>, arr2: Array<string>) {
		if (arr1.length !== arr2.length) {
			return false;
		}

		for (let i = 0; i < arr1.length; i++) {
			if (arr1[i] !== arr2[i]) {
				return false;
			}
		}

		return true;
	}

	function compareMyInput(myInput: string) {
		// Use strict normalization for final comparison
		const normalizedInput = normalizeArabicText(myInput.trim());
		const normalizedTarget = normalizeArabicText(arabicWord.trim());
		
		const myInputArr = normalizedInput.split('');
		const arabicArr = normalizedTarget.split('');

		// For visual feedback, normalize entire strings first, then compare character by character
		const lightNormalizedInput = normalizeArabicTextLight(myInput.trim());
		const lightNormalizedTarget = normalizeArabicTextLight(arabicWord.trim());
		
		const visualInputArr = myInput.trim().split('');
		const normalizedInputArr = lightNormalizedInput.split('');
		const normalizedTargetArr = lightNormalizedTarget.split('');

		const result = visualInputArr.map((letter, index) => {
			// Compare the normalized characters at the same position
			const normalizedUserChar = normalizedInputArr[index] || '';
			const normalizedTargetChar = normalizedTargetArr[index] || '';
			
			if (normalizedUserChar === normalizedTargetChar) {
				return {
					letter,
					correct: true
				};
			}
			return {
				letter,
				correct: false
			};
		});

		attemptTemp = result;

		// Use the strict normalized versions for final correctness check
		if (areArraysEqual(myInputArr, arabicArr)) {
			isCorrect = true;
			correctAnswer = arabicWord; // Show the original word
			const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
			keyboard && keyboard.resetValue();
		}
	}

	onMount(() => {
		const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;

		updateKeyboardStyle();

		document.addEventListener('keydown', () => {
			const value = keyboard && keyboard.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		});

		document.addEventListener('click', () => {
			const value = keyboard && keyboard.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		});
	});

	function toggleAnswer() {
		showAnswer = !showAnswer;
	}

	function toggleHint() {
		showHint = !showHint;
	}

	const isSafari = getBrowserInfo();

  function openInfoModal() {
    isInfoModalOpen = true;
  }

  function closeInfoModal() {
    isInfoModalOpen = false;
  }

  function onRegularKeyboard(e: any) {
    const value = e.target.value;
    keyboardValue = value;
    compareMyInput(value);
  }

  function toggleKeyboard() {
    keyboard = keyboard === 'virtual' ? 'physical' : 'virtual';
  }

  // Multi-word selection functions
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
    if (selectionStartIndex === -1 || selectionEndIndex === -1) return;
    
    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);
    
    const englishWords = word.english.split(' ');
    selectedWords = englishWords.slice(start, end + 1);
  }

  function clearSelection() {
    selectedWords = [];
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
    // For single word vocab, we'll just return the filtered Arabic word
    // since we don't have complex sentence mapping like in sentences
    return filterArabicCharacters(arabicWord);
  }

  async function defineSelectedWords() {
    if (selectedWords.length === 0) return;

    const wordsArray = selectedWords;
    targetWord = wordsArray.join(' ');
    
    // Map English words to Arabic equivalent and filter for Arabic characters only
    targetArabicWord = mapEnglishToArabic(wordsArray);
    
    isLoadingDefinition = true;
    isDefinitionModalOpen = true;
    
    try {
      // Use the shared askChatGTP helper
      const data = await askChatGTP(
        targetWord, 
        'english', 
        {
          english: word.english,
          arabic: arabicWord,
          transliteration: word.transliteration
        }, 
        dialect
      );
      
      definition = data.message.message.content;
    } catch (error) {
      console.error('Error fetching definition:', error);
      definition = 'Error loading definition. Please try again.';
    }
    
    isLoadingDefinition = false;
    clearSelection();
  }

  function closeDefinitionModal() {
    isDefinitionModalOpen = false;
    definition = '';
    targetWord = '';
    targetArabicWord = '';
  }

	
	$effect(() => {
		hue.subscribe(() => {
			updateKeyboardStyle();
		});
	});
	$effect(() => {
		theme.subscribe(() => {
			updateKeyboardStyle();
		});
	});
	$effect(() => {
		if (word.english || mode) {
			attemptTemp = [];
			attempt = [];
			isCorrect = false;
			showHint = false;
			showAnswer = false;
			correctAnswer = '';
	    isInfoModalOpen = false;
	    keyboardValue = '';
	    
	    // Clear selection state when word changes
	    clearSelection();
	    isDefinitionModalOpen = false;
	    isLoadingDefinition = false;
	    definition = '';
	    targetWord = '';
	    targetArabicWord = '';

			if (typeof document !== 'undefined') {
				const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
        keyboard && keyboard.resetValue();
				document.addEventListener('keydown', () => {
					const value = keyboard && keyboard.getTextAreaValue();
					if (typeof value === 'string') {
						compareMyInput(value);
					}
				});
			}
		}
	});
	
	// Initialize arabic word on component mount and word change
	$effect(() => {
		if (regex.test(word.arabic)) {
			arabicWord = word.arabic.split(regex)[0].trim();
		} else {
			arabicWord = word.arabic;
		}
	});
	$effect(() => {
		attempt = attemptTemp;
	});
	
  $effect(() => {
		if (mode) {
	    if (typeof document !== 'undefined') {
	      const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
	      keyboard && keyboard.resetValue();
	    }
	  }
	});
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
	{dialect}
></DefinitionModal>

<div>
	<div class="mb-6">
		<InfoDisclaimer></InfoDisclaimer>
		<div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
			<Button type="button" onClick={toggleAnswer}>{showAnswer ? 'Hide' : 'Show'} answer</Button>
			<Button type="button" onClick={toggleHint}>{showHint ? 'Hide' : 'Show'} hint</Button>
			<AudioButton text={arabicWord} {dialect} audioUrl={word.audioUrl}>Audio</AudioButton>
			<SaveButton 
				type="Word"
				objectToSave={{
					arabic: arabicWord,
					english: word.english,
					transliterated: word.transliteration
				}}></SaveButton>
			<Button type="button" onClick={switchMode}>
				{mode === 'draw' ? 'Type' : 'Draw'}
			</Button>
		</div>
	</div>
	
	{#if isCorrect}
		<div class="flex w-full flex-row items-center justify-center gap-2 py-2 transition-all duration-300 mb-4" style="background-color: var(--green1);">
			<span class="text-lg font-semibold text-text-300">{correctAnswer} is correct</span>
		</div>
	{/if}
	
	<div class="bg-tile-300 border border-tile-500 px-3 py-6 shadow-lg mb-6">
		<div class="text-center">
			<div class="flex flex-col items-center justify-center gap-2 mb-4">
				<!-- Selection controls -->
				{#if selectedWords.length > 0}
					<div class="mb-3 flex gap-2 justify-center">
						<button
							onclick={defineSelectedWords}
							class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors text-sm"
						>
							Define "{selectedWords.join(' ')}"
						</button>
						<button
							onclick={clearSelection}
							class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors text-sm"
						>
							Clear Selection
						</button>
					</div>
				{/if}
				
				<!-- Selectable English word display -->
				<div 
					class="flex flex-wrap gap-1 items-center justify-center select-none mb-2"
					role="group"
					aria-label="Word selection area for definitions"
				>
					{#each word.english.split(' ') as englishWord, index}
						<button
							onmousedown={(e) => handleWordMouseDown(index, e)}
							onmouseenter={() => handleWordMouseEnter(index)}
							onmouseup={handleWordMouseUp}
							onclick={() => {
								// Single click selects the word and defines it immediately
								selectedWords = [englishWord];
								selectionStartIndex = index;
								selectionEndIndex = index;
								defineSelectedWords();
							}}
							aria-label={`Get definition for: ${englishWord}`}
							class={cn("text-4xl sm:text-5xl font-bold cursor-pointer p-1 border-2 transition-all duration-300", {
								"bg-blue-200 border-blue-400 text-text-300": isWordSelected(index),
								"hover:bg-tile-500 border-transparent hover:border-tile-600 text-text-300": !isWordSelected(index)
							})}
						>{englishWord}</button>
					{/each}
				</div>
				
				{#if showHint}
					<p class="text-xl sm:text-2xl text-text-200">({word.transliteration})</p>
				{/if}
				{#if showAnswer}
					<p class="text-2xl sm:text-3xl text-text-300">({arabicWord})</p>
				{/if}
			</div>
			
			<div class="text-center">
				{#if isSafari}
					<span class="text-3xl">
						{@html attempt
							.map(
								({ letter, correct }) =>
									`<span class="${cn('text-3xl', {
										'text-green-500': correct,
										'text-red-500': !correct
									})}">&zwj;&zwj;${letter}&zwj;&zwj;</span>`
							)
							.join('')}
					</span>
				{:else}
					<span class="text-3xl">
						{@html attempt
							.map(
								({ letter, correct }) =>
									`<span class="${cn('text-3xl', {
										'text-green-500': correct,
										'text-red-500': !correct
									})}">${letter}</span>`
							)
							.join('')}
					</span>
				{/if}
			</div>
		</div>
		
		<Modal isOpen={isInfoModalOpen} handleCloseModal={closeInfoModal} height="70%" width="80%">
			<KeyboardDocumentation></KeyboardDocumentation>
		</Modal>
		
		<div class={cn("block mt-6", { '!hidden': mode === 'draw'})}>
			<div class="mb-3 flex items-center justify-between">
				<button onclick={toggleKeyboard} class="text-sm text-text-300 underline">
					{keyboard === 'virtual' ? 'Use native keyboard' : 'Use builtin keyboard'}
				</button>
				{#if keyboard === 'virtual'}
					<button class="text-sm text-text-300 underline" onclick={openInfoModal}>
						How does this keyboard work?
					</button>
				{/if}
			</div>
			
			<div class={cn('block', { 'hidden': keyboard !== 'virtual'})}>
				<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
			</div>
			
			<textarea 
				value={keyboardValue}
				oninput={onRegularKeyboard}
				placeholder="Type your answer here..."
				class={cn(
					"block w-full min-h-32 text-text-300 bg-tile-300 border border-tile-500 p-3",
					{'hidden': keyboard === 'virtual'}
				)}
			></textarea>
		</div>
	</div>
</div>

<div class={cn("hidden", { '!block': mode === 'draw'})}>
	<Canvas letter={word} size={10} />
</div>
