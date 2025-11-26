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
	import DialectComparisonModal from './DialectComparisonModal.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import { normalizeArabicText, normalizeArabicTextLight, filterArabicCharacters } from '$lib/utils/arabic-normalization';
	import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';

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
					text: sentence.arabic,
					currentDialect: dialect,
					transliteration: sentence.transliteration,
					english: sentence.english
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
	
	// Ref to the keyboard element for this component instance
	let keyboardElement: Keyboard | null = $state(null);
	let keyboardContainer: HTMLDivElement | null = $state(null);
	
	// Multi-word selection state
	let selectedWords = $state<string[]>([]);
	let isSelecting = $state(false);
	let selectionStartIndex = $state(-1);
	let selectionEndIndex = $state(-1);


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
		// Use strict normalization for final comparison
		const normalizedInput = normalizeArabicText(value.trim());
		const normalizedTarget = normalizeArabicText(sentence.arabic.trim());
		
		const myInputArr = normalizedInput.split('');
		const arabicArr = normalizedTarget.split('');

		// For visual feedback, normalize entire strings first, then compare character by character
		const lightNormalizedInput = normalizeArabicTextLight(value.trim());
		const lightNormalizedTarget = normalizeArabicTextLight(sentence.arabic.trim());
		
		const visualInputArr = value.trim().split('');
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
		if (areArraysEqual(myInputArr, arabicArr) && value.trim().length > 0) {
			isCorrect = true;
			keyboardElement && keyboardElement.resetValue();
		} else if (value.trim().length === 0 && !isCorrect) {
			// Reset isCorrect when input is cleared, but only if it wasn't already correct
			// (prevents resetting after successful answer when keyboard is cleared)
			isCorrect = false;
		}
	}

	function checkInput() {
		if (!keyboardElement) return;
		const value = keyboardElement.getTextAreaValue();
		if (typeof value === 'string') {
			compareMyInput(value);
		}
	}

	onMount(() => {
		// Find the keyboard element within this component's container
		if (keyboardContainer) {
			keyboardElement = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
		}
		
		// Update styles for all keyboards (or specific one if available)
		if (keyboardElement) {
			updateKeyboardStyle(keyboardElement);
		} else {
			updateKeyboardStyle();
		}

		// Track sentence view
		fetch('/api/track-sentence-view', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ count: 1 })
		}).catch(err => console.error('Error tracking sentence view:', err));

		// Listen for virtual keyboard changes
		document.addEventListener('keydown', checkInput);
		document.addEventListener('click', checkInput);
		
		// Also check periodically for virtual keyboard changes (fallback)
		// Use a reasonable interval to avoid performance issues
		const intervalId = setInterval(checkInput, 300);
		
		return () => {
			document.removeEventListener('keydown', checkInput);
			document.removeEventListener('click', checkInput);
			clearInterval(intervalId);
		};
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
		const question = `What does ${wordText} mean in ${dialectName[dialect]}? Considering the following sentences:
		Arabic: "${sentence.arabic}"
		English: "${sentence.english}"
		Transliteration: "${sentence.transliteration}"
		
		Please provide a definition based on the context.`;

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
		keyboardValue = value;
		compareMyInput(value);
	}

	function toggleKeyboard() {
		keyboard = keyboard === 'virtual' ? 'physical' : 'virtual';
	}
	$effect(() => {
		hue.subscribe(() => {
			// Update all keyboards when hue changes
			updateKeyboardStyle();
		});
	});
	$effect(() => {
		theme.subscribe(() => {
			// Update all keyboards when theme changes
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
				// Find the keyboard element within this component's container
				if (keyboardContainer) {
					keyboardElement = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
				}
				keyboardElement && keyboardElement.resetValue();
				
				// Update keyboard styles when sentence changes
				// Use setTimeout to ensure DOM is ready
				setTimeout(() => {
					if (keyboardElement) {
						updateKeyboardStyle(keyboardElement);
					} else {
						updateKeyboardStyle();
					}
				}, 0);
			}
		}
	});
	$effect(() => {
		attempt = attemptTemp;
	});
	
	// Update keyboard element reference when keyboard type changes or container is ready
	$effect(() => {
		if (keyboardContainer && keyboard === 'virtual') {
			// Use setTimeout to ensure DOM is updated
			setTimeout(() => {
				keyboardElement = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
				if (keyboardElement) {
					updateKeyboardStyle(keyboardElement);
				}
			}, 0);
		} else {
			keyboardElement = null;
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

<DialectComparisonModal
	isOpen={isComparisonModalOpen}
	closeModal={closeComparisonModal}
	originalText={sentence.arabic}
	originalEnglish={sentence.english}
	{comparisonData}
	isLoading={isComparing}
	error={comparisonError}
	currentDialect={dialect}
/>

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
	
	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
		<Button onClick={() => (showHint = !showHint)} type="button">
			{showHint ? 'Hide' : 'Show'} Hint
		</Button>
		<Button onClick={() => (showAnswer = !showAnswer)} type="button">
			{showAnswer ? 'Hide' : 'Show'} Answer
		</Button>
		<AudioButton text={sentence.arabic} dialect={dialect}>Listen</AudioButton>
		<Button onClick={compareDialects} type="button">
			Compare Dialects
		</Button>
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
	
	<div class="mb-6 p-4" bind:this={keyboardContainer}>
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
