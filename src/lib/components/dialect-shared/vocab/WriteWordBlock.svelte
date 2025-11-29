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
  let keyboard = $state<'virtual' | 'physical'>('virtual')
  
  // Detect mobile on mount and default to native keyboard
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
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
		// Default to native keyboard on mobile
		if (isMobile()) {
			keyboard = 'physical';
		}
		
		const keyboardEl = document.querySelector('arabic-keyboard') as Keyboard | null;

		updateKeyboardStyle();

		// Only process virtual keyboard events when virtual keyboard is active
		const handleVirtualKeyboard = () => {
			if (keyboard !== 'virtual') return;
			const value = keyboardEl && keyboardEl.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		};

		document.addEventListener('keydown', handleVirtualKeyboard);
		document.addEventListener('click', handleVirtualKeyboard);
		
		return () => {
			document.removeEventListener('keydown', handleVirtualKeyboard);
			document.removeEventListener('click', handleVirtualKeyboard);
		};
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

			// Reset the virtual keyboard when word changes
			if (typeof document !== 'undefined') {
				const keyboardEl = document.querySelector('arabic-keyboard') as Keyboard | null;
				keyboardEl && keyboardEl.resetValue();
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
		<div class="flex flex-wrap items-center justify-center gap-2 mt-4 p-3 bg-tile-400 rounded-xl border border-tile-500">
			<!-- Toggle buttons -->
			<div class="flex gap-1.5">
				<button 
					onclick={toggleAnswer}
					class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 {showAnswer ? 'bg-amber-600 text-white shadow-md' : 'bg-tile-500 text-text-300 hover:bg-tile-600 border border-tile-600'}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
					</svg>
					<span>{showAnswer ? 'Hide' : 'Show'} Answer</span>
				</button>
				<button 
					onclick={toggleHint}
					class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 {showHint ? 'bg-amber-600 text-white shadow-md' : 'bg-tile-500 text-text-300 hover:bg-tile-600 border border-tile-600'}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
					</svg>
					<span>{showHint ? 'Hide' : 'Show'} Hint</span>
				</button>
			</div>
			
			<!-- Divider -->
			<div class="hidden sm:block w-px h-8 bg-tile-600"></div>
			
			<!-- Audio button -->
			<button 
				onclick={() => {
					const audioBtn = document.querySelector('.word-audio-btn') as HTMLButtonElement;
					audioBtn?.click();
				}}
				class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-all duration-200 shadow-sm hover:shadow-md"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>
				</svg>
				<span>Listen</span>
			</button>
			<AudioButton text={arabicWord} {dialect} audioUrl={word.audioUrl} className="word-audio-btn hidden" />
			
			<!-- Save button -->
			<SaveButton 
				type="Word"
				objectToSave={{
					arabic: arabicWord,
					english: word.english,
					transliterated: word.transliteration
				}}
			/>
			
			<!-- Mode toggle -->
			<button 
				onclick={switchMode}
				class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-sm hover:shadow-md"
			>
				{#if mode === 'draw'}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
					</svg>
					<span>Type</span>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
					</svg>
					<span>Draw</span>
				{/if}
			</button>
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
			<div class="mb-3 flex items-center justify-between gap-2">
				<button 
					onclick={toggleKeyboard} 
					class="flex items-center gap-2 px-3 py-1.5 text-sm text-text-300 bg-tile-400 hover:bg-tile-500 border border-tile-500 rounded-lg transition-colors"
				>
					<span>{keyboard === 'virtual' ? '📱 Use native keyboard' : '⌨️ Use virtual keyboard'}</span>
				</button>
				{#if keyboard === 'virtual'}
					<button 
						class="text-sm text-text-200 hover:text-text-300 underline transition-colors" 
						onclick={openInfoModal}
					>
						How does this work?
					</button>
				{/if}
			</div>
			
			<div class={cn('block', { 'hidden': keyboard !== 'virtual'})}>
				<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
			</div>
			
			<textarea 
				bind:value={keyboardValue}
				oninput={onRegularKeyboard}
				placeholder="اكتب هنا..."
				dir="rtl"
				class={cn(
					"block w-full min-h-40 text-2xl sm:text-3xl font-arabic text-text-300 bg-tile-200 border-2 border-tile-500 rounded-xl p-4 focus:border-tile-700 focus:outline-none focus:ring-2 focus:ring-tile-600/50 transition-all placeholder:text-text-100",
					{'hidden': keyboard === 'virtual'}
				)}
			></textarea>
		</div>
	</div>
</div>

<div class={cn("hidden", { '!block': mode === 'draw'})}>
	<Canvas letter={word} size={10} />
</div>
