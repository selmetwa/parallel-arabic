<script lang="ts">
	/**
	 * SentenceBlock Component
	 * 
	 * Features:
	 * - Single word click for individual definitions
	 * - Multi-word selection by dragging across words
	 * - Visual feedback for selected words with blue highlighting
	 * - "Define" button appears when words are selected
	 * - "Clear Selection" button to reset selection
	 */
	import { type Keyboard, type Dialect } from '$lib/types/index';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { hue, theme } from '$lib/store/store';
	import { getBrowserInfo } from '$lib/helpers/get-browser-info';
	import KeyboardDocumentation from '$lib/components/KeyboardDocumentation.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
	import { onMount } from 'svelte';
	import cn from 'classnames';
	import InfoDisclaimer from '$lib/components/InfoDisclaimer.svelte';
	import DefinitionModal from './DefinitionModal.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';

	interface Props {
		sentence: {
			arabic: string;
			english: string;
			transliteration: string;
		};
		resetSentences: () => void;
    dialect: Dialect;
	}

	let { sentence, resetSentences, dialect }: Props = $props();

	type Attempt = {
		letter: string;
		correct: boolean;
	};

	let attempt: Attempt[] = $state([]);
	let attemptTemp: Attempt[] = $state([]);
	let keyboard = $state('virtual');
	let isCorrect = $state(false);
	let isInfoModalOpen = $state(false);
	let showHint = $state(false);
	let showAnswer = $state(false);
	let isDefinitionModalOpen = $state(false);
	let isLoadingDefinition = $state(false);
	let definition = $state('');
	let targetWord = $state('');
	let targetArabicWord = $state('');
	let keyboardValue = $state('');
	
	// Multi-word selection state
	let selectedWords = $state<string[]>([]);
	let isSelecting = $state(false);
	let selectionStartIndex = $state(-1);
	let selectionEndIndex = $state(-1);

	// Function to normalize Arabic text for comparison
	function normalizeArabicText(text: string): string {
		return text
			// Remove diacritics
			.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g, '')
			// Normalize Alif variants to plain Alif (ا)
			.replace(/[آأإٱ]/g, 'ا')
			// Normalize Ya Maqsoura (ى) to regular Ya (ي)
			.replace(/ى/g, 'ي')
			// Normalize Waw with Hamza (ؤ) to plain Waw (و)
			.replace(/ؤ/g, 'و')
			// Normalize Ya with Hamza (ئ) to regular Ya (ي)
			.replace(/ئ/g, 'ي');
	}

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

	function compareMyInput(value: string) {
		// Normalize both user input and target sentence for comparison only
		const normalizedInput = normalizeArabicText(value.trim());
		const normalizedTarget = normalizeArabicText(sentence.arabic.trim());
		
		const myInputArr = normalizedInput.split('');
		const arabicArr = normalizedTarget.split('');

		// For visual feedback, compare character by character using normalized versions
		const visualInputArr = value.trim().split('');

		const result = visualInputArr.map((letter, index) => {
			// Check if the normalized versions match at this position
			const normalizedUserChar = normalizeArabicText(letter);
			const normalizedTargetChar = normalizeArabicText(sentence.arabic.trim().split('')[index] || '');
			
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

		if (areArraysEqual(myInputArr, arabicArr)) {
			isCorrect = true;
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

	const isSafari = getBrowserInfo();

	function openInfoModal() {
		isInfoModalOpen = true;
	}

	function closeInfoModal() {
		isInfoModalOpen = false;
	}

	function openDefinitionModal() {
		isDefinitionModalOpen = true;
	}

	function closeDefinitionModal() {
		isDefinitionModalOpen = false;
		definition = '';
	}

  const dialectName: Record<Dialect, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Khaleeji Arabic'
  }

	// Function to filter only Arabic characters
	function filterArabicCharacters(text: string): string {
		// Arabic Unicode range: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
		return text.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]/g, '').trim();
	}

	// Function to map English words to corresponding Arabic words
	function mapEnglishToArabic(englishWords: string[]): string {
		const allEnglishWords = sentence.english.split(' ');
		const allArabicWords = sentence.arabic.split(' ');
		
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
		
		// Fallback: filter the entire Arabic sentence
		return filterArabicCharacters(sentence.arabic);
	}

	async function askChatGTP(words: string | string[]) {
		const wordsArray = Array.isArray(words) ? words : [words];
		targetWord = wordsArray.join(' ');
		
		// Map English words to Arabic equivalent and filter for Arabic characters only
		targetArabicWord = mapEnglishToArabic(wordsArray);
		
		isLoadingDefinition = true;
		openDefinitionModal();
		
		const wordText = wordsArray.length === 1 ? wordsArray[0] : `the phrase "${wordsArray.join(' ')}"`;
		const question = `What does ${wordText} mean in ${dialectName[dialect]}? Considering the following sentences ${sentence.arabic} ${sentence.english} ${sentence.transliteration} but please do not reveal the entire meaning of the sentence, and dont say anything about the rest of the sentence at all, just use it as a reference to derive the definition.`;

		const res = await fetch('/api/open-ai', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				question: question
			})
		});

		const data = await res.json();

		definition = data.message.message.content;
		isLoadingDefinition = false;
	}

	// Word selection functions
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
		const words = sentence.english.split(' ');
		const start = Math.min(selectionStartIndex, selectionEndIndex);
		const end = Math.max(selectionStartIndex, selectionEndIndex);
		selectedWords = words.slice(start, end + 1);
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

	function onRegularKeyboard(e: any) {
		const value = e.target.value;
		compareMyInput(value);
		keyboardValue = value;
	}

	function toggleKeyboard() {
		keyboard = keyboard === 'virtual' ? 'physical' : 'virtual';
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
		if (sentence.arabic) {
			attemptTemp = [];
			attempt = [];
			isCorrect = false;
			showHint = false;
			showAnswer = false;
			isInfoModalOpen = false;
			isDefinitionModalOpen = false;
			isLoadingDefinition = false;
			definition = '';
			targetWord = '';
			targetArabicWord = '';
			keyboardValue = '';
			
			// Clear selection state
			selectedWords = [];
			isSelecting = false;
			selectionStartIndex = -1;
			selectionEndIndex = -1;

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
	$effect(() => {
		attempt = attemptTemp;
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
{#if sentence}
	{#if isCorrect}
		<div class="mb-4 bg-green-100 py-3 px-4 text-center border-2 border-green-100">
			<p class="text-lg font-bold text-text-300">{sentence.arabic} is Correct</p>
		</div>
	{/if}
	
	<InfoDisclaimer></InfoDisclaimer>
	
	<!-- Multi-word selection instructions -->
	<div class="mb-4 p-3 bg-tile-400 border-l-4 border-tile-500 rounded-r hover:bg-tile-500 transition-colors duration-300">
		<p class="text-sm text-text-300">
			<strong>💡 Tip:</strong> Click individual words for definitions, or 
			<strong>click and drag across multiple words</strong> to select a phrase and get its definition!
		</p>
	</div>
	
	<div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
		<Button onClick={() => (showHint = !showHint)} type="button">
			{showHint ? 'Hide' : 'Show'} Hint
		</Button>
		<Button onClick={() => (showAnswer = !showAnswer)} type="button">
			{showAnswer ? 'Hide' : 'Show'} Answer
		</Button>
		<AudioButton text={sentence.arabic} dialect={dialect}>Listen</AudioButton>
		<SaveButton
			objectToSave={{
				arabic: sentence.arabic,
				english: sentence.english,
				transliterated: sentence.transliteration
			}}
			type="Sentence"
		/>
		<Button onClick={resetSentences} type="button">Reset</Button>
	</div>
	
	<div class="text-center mb-6">
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
				{#each sentence.english.split(' ') as word, index}
					<span
						onmousedown={(e) => handleWordMouseDown(index, e)}
						onmouseenter={() => handleWordMouseEnter(index)}
						onclick={() => askChatGTP(word)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								askChatGTP(word);
							}
						}}
						role="button"
						tabindex="0"
						aria-label={`Get definition for: ${word}`}
						class={cn("p-1 text-3xl sm:text-4xl duration-300 cursor-pointer border-2", {
							"bg-blue-200 border-blue-400": isWordSelected(index),
							"hover:bg-tile-500 border-transparent hover:border-tile-600": !isWordSelected(index)
						})}
						>{word}</span
					>
				{/each}
			</div>
			{#if showHint}
				<p class="text-xl text-text-200">({sentence.transliteration})</p>
			{/if}
			{#if showAnswer}
				<p class="text-2xl text-text-300">({sentence.arabic})</p>
			{/if}
		</div>
		
		<div class="mt-4">
			{#if isSafari}
				<span class="text-2xl sm:text-3xl">
					{@html attempt
						.map(
							({ letter, correct }) =>
								`<span class="${cn('text-2xl sm:text-3xl', {
									'text-green-500': correct,
									'text-red-500': !correct
								})}">&zwj;&zwj;${letter}&zwj;&zwj;</span>`
						)
						.join('')}
				</span>
			{:else}
				<span class="text-2xl sm:text-3xl">
					{@html attempt
						.map(
							({ letter, correct }) =>
								`<span class="${cn('text-2xl sm:text-3xl', {
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
	
	<div class="mb-6 p-4">
		<div class="mb-3 flex items-center justify-between">
			<button onclick={toggleKeyboard} class="text-sm text-text-300 underline">
				{keyboard === 'virtual' ? 'Use other keyboard' : 'Use builtin keyboard'}
			</button>
			{#if keyboard === 'virtual'}
				<button class="text-sm text-text-300 underline" onclick={openInfoModal}>
					How does this keyboard work?
				</button>
			{/if}
		</div>
		
		<div class={cn('block', { hidden: keyboard !== 'virtual' })}>
			<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
		</div>
		
		<textarea
			oninput={onRegularKeyboard}
			value={keyboardValue}
			placeholder="Type your answer here..."
			class={cn('block min-h-32 w-full rounded border bg-tile-300 p-3 text-text-300', {
				hidden: keyboard === 'virtual'
			})}
		></textarea>
	</div>
{/if}
