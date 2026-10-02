<script lang="ts">
	/**
	 * SentenceBlock Component
	 * 
	 * Features:
	 * - Two practice modes: Typing and Sentence Reordering
	 * - Single word click for individual definitions
	 * - Multi-word selection by dragging across words
	 * - Visual feedback for selected words with blue highlighting
	 * - "Define" button appears when words are selected
	 * - "Clear Selection" button to reset selection
	 */
	import { get } from 'svelte/store';
	import { wordDragSelect } from '$lib/actions/word-drag-select';
	import { type Keyboard, type Dialect } from '$lib/types/index';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { hue, theme } from '$lib/store/store';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import { arabicRunsHtml } from '$lib/helpers/arabic-runs';
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
	import { trackEvent } from '$lib/analytics';

	interface Props {
		sentence: {
			arabic: string;
			arabicTashkeel?: string;
			english: string;
			transliteration: string;
		};
		resetSentences: () => void;
		next: () => void;
    dialect: Dialect;
	}

	let { sentence, resetSentences, dialect, next }: Props = $props();

	type Attempt = {
		letter: string;
		correct: boolean;
	};

	// Practice Mode State - defaults to trace (guided writing)
	type PracticeMode = 'typing' | 'reorder' | 'trace';
	let practiceMode = $state<PracticeMode>('trace');

	const practiceModes: Array<{
		value: PracticeMode;
		label: string;
		sub: string;
		accent: string;
		deep: string;
		icon: string;
		dashed?: boolean;
	}> = [
		{
			value: 'trace',
			label: 'Trace',
			sub: 'Fill in the faded answer',
			accent: '#0ea5e9',
			deep: '#0369a1',
			icon: 'M4 20h16M4 20l4-12 4 8 4-12 4 16',
			dashed: true
		},
		{
			value: 'typing',
			label: 'Typing',
			sub: 'Type it from memory',
			accent: '#10b981',
			deep: '#047857',
			icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
		},
		{
			value: 'reorder',
			label: 'Reorder',
			sub: 'Arrange the words',
			accent: '#8b5cf6',
			deep: '#6d28d9',
			icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
		}
	];

	// Modes that use the keyboard (virtual or native) for free-form input
	let usesKeyboard = $derived(practiceMode === 'typing' || practiceMode === 'trace');

	let attempt: Attempt[] = $state([]);
	let attemptTemp: Attempt[] = $state([]);

	// Trace mode: the live input, used to "fill in" the dimmed target answer
	let traceInput = $state('');
	let keyboard = $state<'virtual' | 'physical'>('virtual');
	
	// Detect mobile on mount and default to native keyboard
	const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
	let isCorrect = $state(false);
	let xpAwardedThisSentence = $state(false);

	$effect(() => {
		if (isCorrect && !xpAwardedThisSentence) {
			xpAwardedThisSentence = true;
			trackEvent('sentences_typing_completed_correct', { dialect });
			fetch('/api/award-xp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventType: 'sentence_correct' })
			})
				.then((r) => r.json())
				.then((data) => {
					if (data.success) {
						userXp.set(data.newTotalXp);
						if (data.leveledUp) userLevel.set(data.newLevel);
						const title = LEVEL_TIERS.find((t) => t.level === data.newLevel)?.title;
						showXpToast(data.xpAwarded, data.leveledUp, data.newLevel, title);
					}
				})
				.catch(() => {});
		}
	});

	$effect(() => {
		// Reset XP guard and correct state when sentence changes
		if (sentence.arabic) {
			xpAwardedThisSentence = false;
			isCorrect = false;
		}
	});

	let isInfoModalOpen = $state(false);
	let showHint = $state(false);  // Transliteration
	let showAnswer = $state(false);  // Arabic answer
	let showTashkeel = $state(false);  // Arabic with diacritics
	let isDefinitionModalOpen = $state(false);

	async function handleToggleHint() {
		showHint = !showHint;
		trackEvent('sentences_hint_toggled', { visible: showHint });
	}

	async function handleToggleAnswer() {
		showAnswer = !showAnswer;
		trackEvent('sentences_answer_toggled', { visible: showAnswer });
	}
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
	
	// Sentence Reordering Mode State
	let shuffledArabicWords = $state<string[]>([]);
	let selectedReorderWords = $state<string[]>([]);
	let reorderChecked = $state(false);
	let reorderCorrect = $state(false);
	
	// Shuffle array utility function
	function shuffleArray<T>(array: T[]): T[] {
		const _arr = [...array];
		for (let i = _arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[_arr[i], _arr[j]] = [_arr[j], _arr[i]];
		}
		return _arr;
	}
	
	// Initialize shuffled words for reordering mode
	function initializeShuffledWords() {
		const words = sentence.arabic.split(' ').filter(w => w.trim());
		// Keep shuffling until order is different from original (if more than 1 word)
		let shuffled = shuffleArray(words);
		if (words.length > 1) {
			while (shuffled.join(' ') === words.join(' ')) {
				shuffled = shuffleArray(words);
			}
		}
		shuffledArabicWords = shuffled;
	}

	async function compareDialects() {
		trackEvent('sentences_dialect_comparison_opened', { dialect });
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
	
	// Ref to the keyboard container for this component instance
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
		// Drive trace-mode "fill in" feedback from the same input
		traceInput = value;

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
			// Reset virtual keyboard if it exists and is active
			if (keyboard === 'virtual' && usesKeyboard && keyboardContainer) {
				const keyboardEl = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
				if (keyboardEl && typeof keyboardEl.resetValue === 'function') {
					keyboardEl.resetValue();
				}
			}
		} else if (value.trim().length === 0 && !isCorrect) {
			// Reset isCorrect when input is cleared, but only if it wasn't already correct
			// (prevents resetting after successful answer when keyboard is cleared)
			isCorrect = false;
		}
	}

	function checkInput() {
		// Only check virtual keyboard when it's active
		if (keyboard !== 'virtual' || !usesKeyboard) return;
		
		// Get the keyboard element fresh each time to ensure it exists
		const keyboardEl = keyboardContainer?.querySelector('arabic-keyboard') as Keyboard | null;
		if (!keyboardEl || typeof keyboardEl.getTextAreaValue !== 'function') return;
		
		const value = keyboardEl.getTextAreaValue();
		if (typeof value === 'string') {
			compareMyInput(value);
		}
	}

	onMount(() => {
		// Default to native keyboard on mobile
		if (isMobile()) {
			keyboard = 'physical';
		}
		
		// Update keyboard styles
		updateKeyboardStyle();

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

	// Trace mode: map each target character to a fill-in state based on input.
	// 'pending' = not yet reached (dimmed), 'correct' = filled in, 'incorrect' = red.
	let traceChars = $derived.by(() => {
		const target = sentence.arabic.trim();
		const lightTarget = normalizeArabicTextLight(target).split('');
		const lightInput = normalizeArabicTextLight(traceInput.trim()).split('');

		return target.split('').map((char, i) => {
			let state: 'pending' | 'correct' | 'incorrect';
			if (i >= lightInput.length) {
				state = 'pending';
			} else {
				state = lightInput[i] === lightTarget[i] ? 'correct' : 'incorrect';
			}
			return { char, state };
		});
	});

	let traceHtml = $derived(
		arabicRunsHtml(
			traceChars,
			(c) => c.char,
			(c) =>
				cn({
					'text-text-300': c.state === 'correct',
					'text-red-500': c.state === 'incorrect',
					'text-[color-mix(in_srgb,var(--text1)_40%,transparent)]': c.state === 'pending'
				})
		)
	);

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


	function countTokens(text: string) {
		return text.trim().split(/\s+/).filter(Boolean).length;
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
		const isSingleWordDefinition = wordsArray.length === 1 && countTokens(targetArabicWord) === 1;
		trackEvent('sentences_definition_requested', { single_word: isSingleWordDefinition, dialect });

		isLoadingDefinition = true;
		openDefinitionModal();

		const wordText = wordsArray.length === 1 ? wordsArray[0] : `the phrase "${wordsArray.join(' ')}"`;
		const question = `What does ${wordText} mean in ${dialectName[dialect]}? Considering the following sentences:
		Arabic: "${sentence.arabic}"
		English: "${sentence.english}"
		Transliteration: "${sentence.transliteration}"

		Please provide a definition based on the context.`;

		try {
			const res = await fetch('/api/definition-sentence', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					question,
					isSingleWordDefinition
				})
			});

			if (!res.ok) {
				console.error('Definition API error:', res.status);
				definition = 'Failed to load definition. Please try again.';
				isLoadingDefinition = false;
				return;
			}

			const data = await res.json();

			// Handle nested response structure: data.message.message.content or data.message.content
			let content = data.message?.message?.content || data.message?.content || '';

			if (!content) {
				console.error('No content found in response:', data);
				definition = 'No definition available';
				isLoadingDefinition = false;
				return;
			}

			// Strip markdown code blocks if present
			if (content.includes('```')) {
				content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
			}

			// Verify it's valid JSON by trying to parse it
			try {
				JSON.parse(content);
				// If parsing succeeds, store the content as-is (it's already a JSON string)
				// DefinitionModal will parse it when rendering
				definition = content;
			} catch (e) {
				console.error('Error: content is not valid JSON:', e, 'Content:', content);
				definition = content || 'No definition available';
			}
		} catch (error) {
			console.error('Error fetching definition:', error);
			definition = 'Error loading definition. Please try again.';
		}

		isLoadingDefinition = false;
	}

	// Word selection functions
	function handleWordMouseDown(index: number) {
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

	// Sentence Reordering Mode Functions
	function handleReorderWordClick(word: string, index: number) {
		if (reorderChecked) return;
		
		// Add word to selected order
		selectedReorderWords = [...selectedReorderWords, word];
		
		// Remove from shuffled list
		shuffledArabicWords = shuffledArabicWords.filter((_, i) => i !== index);
	}
	
	function removeLastReorderWord() {
		if (selectedReorderWords.length === 0 || reorderChecked) return;
		
		const lastWord = selectedReorderWords[selectedReorderWords.length - 1];
		selectedReorderWords = selectedReorderWords.slice(0, -1);
		shuffledArabicWords = [...shuffledArabicWords, lastWord];
	}
	
	function clearReorderSelection() {
		if (reorderChecked) return;
		trackEvent('sentences_reorder_cleared', { dialect });
		initializeShuffledWords();
		selectedReorderWords = [];
	}
	
	function checkReorderAnswer() {
		const userAnswer = selectedReorderWords.join(' ');
		const correctAnswer = sentence.arabic;

		// Use normalization for comparison
		const normalizedUser = normalizeArabicText(userAnswer);
		const normalizedCorrect = normalizeArabicText(correctAnswer);

		reorderCorrect = normalizedUser === normalizedCorrect;
		reorderChecked = true;
		isCorrect = reorderCorrect;
		trackEvent('sentences_reorder_submitted', { correct: reorderCorrect, dialect });
	}

	function resetReorder() {
		trackEvent('sentences_reorder_retry', { dialect });
		initializeShuffledWords();
		selectedReorderWords = [];
		reorderChecked = false;
		reorderCorrect = false;
		isCorrect = false;
	}

	// Reset mode-specific state when mode changes
	function handleModeChange(newMode: PracticeMode) {
		trackEvent('sentences_practice_mode_changed', { practice_mode: newMode });
		practiceMode = newMode;
		isCorrect = false;
		
		// Reset typing/trace mode state
		attemptTemp = [];
		attempt = [];
		keyboardValue = '';
		traceInput = '';

		// Reset reorder mode state
		if (newMode === 'reorder') {
			initializeShuffledWords();
		}
		selectedReorderWords = [];
		reorderChecked = false;
		reorderCorrect = false;
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
			traceInput = '';

			// Clear selection state
			selectedWords = [];
			isSelecting = false;
			selectionStartIndex = -1;
			selectionEndIndex = -1;
			
			// Reset sentence reordering state
			initializeShuffledWords();
			selectedReorderWords = [];
			reorderChecked = false;
			reorderCorrect = false;

			if (typeof document !== 'undefined') {
				// Reset virtual keyboard if it exists and is active
				if (keyboard === 'virtual' && usesKeyboard && keyboardContainer) {
					const container = keyboardContainer; // Capture for closure
					setTimeout(() => {
						const keyboardEl = container.querySelector('arabic-keyboard') as Keyboard | null;
						if (keyboardEl && typeof keyboardEl.resetValue === 'function') {
							keyboardEl.resetValue();
						}
						// Update keyboard styles
						if (keyboardEl) {
							updateKeyboardStyle(keyboardEl);
						} else {
							updateKeyboardStyle();
						}
					}, 0);
				} else {
					// Update keyboard styles even if not virtual
					setTimeout(() => {
						updateKeyboardStyle();
					}, 0);
				}
			}
		}
	});
	$effect(() => {
		attempt = attemptTemp;
	});
	
	// Update keyboard styles when keyboard type changes or container is ready
	$effect(() => {
		if (keyboardContainer && keyboard === 'virtual' && usesKeyboard) {
			// Capture the container reference for the setTimeout closure
			const container = keyboardContainer;
			// Use setTimeout to ensure DOM is updated
			setTimeout(() => {
				const keyboardEl = container.querySelector('arabic-keyboard') as Keyboard | null;
				if (keyboardEl) {
					updateKeyboardStyle(keyboardEl);
				} else {
					updateKeyboardStyle();
				}
			}, 0);
		} else {
			// Update styles even when keyboard is not virtual
			setTimeout(() => {
				updateKeyboardStyle();
			}, 0);
		}
	});

</script>


{#snippet englishWordDisplay()}
	<div class="prompt">
		{#if selectedWords.length > 0}
			<div class="mb-3 flex flex-wrap justify-center gap-2">
				<button type="button" onclick={() => askChatGTP(selectedWords)} class="chip is-on">
					Define "{selectedWords.join(' ')}"
				</button>
				<button type="button" onclick={clearSelection} class="chip">Clear selection</button>
			</div>
		{/if}

		<div
			class="prompt-words"
			use:wordDragSelect={{ onStart: handleWordMouseDown, onExtend: handleWordMouseEnter, onEnd: handleWordMouseUp }}
			role="application"
			aria-label="Word selection area for definitions"
		>
			{#each sentence.english.split(' ') as word, index (index)}
				<span
					data-word-index={index}
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
					class="word {isWordSelected(index) ? 'is-on' : ''}">{word}</span
				>
			{/each}
		</div>
		{#if showHint}
			<p class="reveal">{sentence.transliteration}</p>
		{/if}
		{#if showAnswer || showTashkeel}
			<p class="reveal reveal--ar font-arabic" dir="rtl">
				{showTashkeel && sentence.arabicTashkeel ? sentence.arabicTashkeel : sentence.arabic}
			</p>
		{/if}
	</div>
{/snippet}

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
		<div class="note note--good banner">
			<p class="banner-text">
				{#if usesKeyboard}
					<span class="font-arabic" dir="rtl">{sentence.arabic}</span> is correct!
				{:else}
					Sentence arranged correctly!
				{/if}
			</p>
			<button
				type="button"
				onclick={next}
				class="press press--sm px-4 py-2"
				style="--accent:#22c55e; --deep:#15803d;"
			>
				Next
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path>
				</svg>
			</button>
		</div>
	{/if}

	<InfoDisclaimer></InfoDisclaimer>

	<!-- Practice Mode Selector -->
	<div class="mb-6 grid gap-2.5 sm:grid-cols-3">
		{#each practiceModes as m (m.value)}
			<button
				type="button"
				onclick={() => handleModeChange(m.value)}
				aria-pressed={practiceMode === m.value}
				class="pick {practiceMode === m.value ? 'is-on' : ''}"
				style="--accent:{m.accent}; --deep:{m.deep};"
			>
				<span class="pick-icon" aria-hidden="true">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							stroke-dasharray={m.dashed ? '3 3' : undefined}
							d={m.icon}
						></path>
					</svg>
				</span>
				<span class="min-w-0 text-left">
					<span class="pick-name">{m.label}</span>
					<span class="pick-sub">{m.sub}</span>
				</span>
			</button>
		{/each}
	</div>

	<!-- Toolbar -->
	<div class="toolbar">
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={handleToggleHint}
				aria-pressed={showHint}
				class="chip {showHint ? 'is-on' : ''}"
				title="Your preference will be saved"
			>
				Hint
			</button>
			<button
				type="button"
				onclick={handleToggleAnswer}
				aria-pressed={showAnswer}
				class="chip {showAnswer ? 'is-on' : ''}"
				title="Your preference will be saved"
			>
				Answer
			</button>
			{#if sentence.arabicTashkeel}
				<button
					type="button"
					onclick={() => {
						showTashkeel = !showTashkeel;
						trackEvent('sentences_tashkeel_toggled', { visible: showTashkeel });
					}}
					aria-pressed={showTashkeel}
					class="chip {showTashkeel ? 'is-on' : ''}"
				>
					Tashkeel
				</button>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={() => {
					trackEvent('sentences_audio_played', { dialect });
					const audioBtn = document.querySelector('.sentence-audio-btn') as HTMLButtonElement;
					audioBtn?.click();
				}}
				class="press press--sm px-4 py-2"
				style="--accent:#0ea5e9; --deep:#0369a1;"
			>
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
				</svg>
				Listen
			</button>
			<AudioButton text={sentence.arabic} {dialect} className="sentence-audio-btn hidden" />
			<button type="button" onclick={compareDialects} class="chip">Compare</button>
			<SaveButton
				objectToSave={{
					arabic: sentence.arabic,
					english: sentence.english,
					transliterated: sentence.transliteration
				}}
				type="Sentence"
				className="!rounded-full !px-4 !py-2 !text-[0.83rem] !shadow-none"
			/>
			<button type="button" onclick={resetSentences} class="chip">Reset</button>
		</div>
	</div>

	<!-- ==================== TYPING / TRACE MODE ==================== -->
	{#if usesKeyboard}
		<div class="mb-6">
			{@render englishWordDisplay()}

			{#if practiceMode === 'trace'}
				<!-- Trace mode: dimmed answer that fills in as you type -->
				<div class="mt-5 text-center" dir="rtl">
					<span class="font-arabic text-2xl leading-loose sm:text-3xl">{@html traceHtml}</span>
				</div>
			{:else}
				<div class="mt-5 text-center">
					<span class="text-2xl sm:text-3xl">
						{@html arabicRunsHtml(attempt, (a) => a.letter, (a) => (a.correct ? 'text-green-700' : 'text-red-500'))}
					</span>
				</div>
			{/if}
		</div>

		<Modal isOpen={isInfoModalOpen} handleCloseModal={closeInfoModal} height="70%" width="80%">
			<KeyboardDocumentation></KeyboardDocumentation>
		</Modal>

		<div class="mb-6" bind:this={keyboardContainer}>
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<div class="seg-wrap">
					<button
						type="button"
						onclick={() => (keyboard = 'virtual')}
						class="seg {keyboard === 'virtual' ? 'is-on' : ''}">Virtual keyboard</button
					>
					<button
						type="button"
						onclick={() => (keyboard = 'physical')}
						class="seg {keyboard === 'physical' ? 'is-on' : ''}">Native keyboard</button
					>
				</div>
				{#if keyboard === 'virtual'}
					<button type="button" class="link-btn" onclick={openInfoModal}>
						How does this work?
					</button>
				{/if}
			</div>

			<div class={cn('block', { hidden: keyboard !== 'virtual' })}>
				<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
			</div>

			<textarea
				oninput={onRegularKeyboard}
				bind:value={keyboardValue}
				placeholder="اكتب هنا..."
				dir="rtl"
				class="arabic-input font-arabic {keyboard === 'virtual' ? 'hidden' : ''}"
			></textarea>
		</div>
	{/if}

	<!-- ==================== SENTENCE REORDERING MODE ==================== -->
	{#if practiceMode === 'reorder'}
		<div class="mb-6">
			<!-- English sentence display with drag-and-define -->
			{@render englishWordDisplay()}

			<!-- Your answer area -->
			<div class="zone">
				<p class="zone-label">Your answer</p>
				{#if selectedReorderWords.length > 0}
					<div class="flex flex-wrap justify-center gap-2" dir="rtl">
						{#each selectedReorderWords as word, i (i)}
							<span
								class="tile {reorderChecked
									? reorderCorrect
										? 'tile--good'
										: 'tile--bad'
									: 'tile--on'}"
							>
								{word}
							</span>
						{/each}
					</div>
				{:else}
					<p class="zone-empty">Tap the words below to build your sentence</p>
				{/if}
			</div>

			<!-- Action buttons -->
			{#if !reorderChecked}
				<div class="my-4 flex flex-wrap justify-center gap-3">
					<button
						type="button"
						onclick={removeLastReorderWord}
						disabled={selectedReorderWords.length === 0}
						class="press press--off press--sm px-5 py-2.5"
					>
						Undo last
					</button>
					<button
						type="button"
						onclick={clearReorderSelection}
						disabled={selectedReorderWords.length === 0}
						class="press press--off press--sm px-5 py-2.5"
					>
						Clear all
					</button>
					<button
						type="button"
						onclick={checkReorderAnswer}
						disabled={shuffledArabicWords.length > 0}
						class="press press--sm px-6 py-2.5"
						style="--accent:#8b5cf6; --deep:#6d28d9;"
					>
						Check answer
					</button>
				</div>
			{/if}

			<!-- Available words -->
			{#if !reorderChecked && shuffledArabicWords.length > 0}
				<div class="flex flex-wrap justify-center gap-2" dir="rtl">
					{#each shuffledArabicWords as word, index (index)}
						<button type="button" onclick={() => handleReorderWordClick(word, index)} class="tile">
							{word}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Results -->
			{#if reorderChecked}
				{#if reorderCorrect}
					<p class="note note--good">Perfect! You arranged the sentence correctly.</p>
				{:else}
					<div class="note note--bad">
						<p>Not quite right. Here's the correct order:</p>
						<p class="mt-1 font-arabic text-xl font-semibold" dir="rtl">{sentence.arabic}</p>
					</div>
				{/if}
				<div class="mt-5 text-center">
					<button
						type="button"
						onclick={resetReorder}
						class="press px-7 py-3"
						style="--accent:#8b5cf6; --deep:#6d28d9;"
					>
						Try again
					</button>
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	/* Mode picker */
	.pick {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		cursor: pointer;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			background 0.18s ease;
	}
	.pick:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 6px 0 var(--deep);
	}
	.pick:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 var(--deep);
	}
	.pick.is-on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--tile3));
		box-shadow: 0 4px 0 var(--deep);
	}

	.pick-icon {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 0.7rem;
		flex-shrink: 0;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 16%, var(--tile4));
	}
	.pick-icon svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	.pick-name {
		display: block;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--text1);
	}
	.pick-sub {
		display: block;
		font-size: 0.78rem;
		font-style: italic;
		color: var(--text2);
	}

	/* Toolbar */
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin-bottom: 1.25rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.95rem;
		border-radius: 100px;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.18s ease,
			border-color 0.18s ease,
			color 0.18s ease;
	}
	.chip:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
		color: var(--text1);
	}
	.chip.is-on {
		background: #0ea5e9;
		border-color: #0369a1;
		color: #fff;
	}

	/* Pressable button */
	.press {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 4px 0 var(--deep);
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}
	.press:hover:not(:disabled) {
		filter: brightness(1.06);
	}
	.press:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 0 0 var(--deep);
	}
	.press:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.press--sm {
		font-size: 0.83rem;
		border-radius: 100px;
		box-shadow: 0 3px 0 var(--deep);
	}
	.press--sm:active:not(:disabled) {
		transform: translateY(3px);
	}
	.press--off {
		background: var(--tile5);
		color: var(--text1);
		box-shadow: 0 3px 0 var(--tile6);
	}

	/* Correct banner */
	.banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin: 0 0 1rem;
	}
	.banner-text {
		font-size: 1rem;
		font-weight: 600;
	}

	/* Notes — tint carries the meaning, text stays on the theme's own ink */
	.note {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		line-height: 1.5;
		font-weight: 500;
		color: var(--text2);
		border-radius: 0.8rem;
		background: var(--tile3);
		padding: 0.7rem 0.95rem;
	}
	.note--good {
		color: var(--text1);
		background: color-mix(in srgb, #10b981 18%, var(--tile3));
		box-shadow: inset 3px 0 0 #10b981;
	}
	.note--bad {
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 18%, var(--tile3));
		box-shadow: inset 3px 0 0 #f43f5e;
	}

	/* Prompt card */
	.prompt {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1.5rem 1.25rem;
		text-align: center;
	}

	.prompt-words {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.1rem;
		font-size: clamp(1.25rem, 3.5vw, 1.6rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
		user-select: none;
	}

	.word {
		padding: 0.1rem 0.3rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.word:hover {
		background: var(--tile5);
	}
	.word:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: 1px;
	}
	.word.is-on {
		background: color-mix(in srgb, #0ea5e9 25%, var(--tile3));
		box-shadow: inset 0 -2px 0 #0ea5e9;
	}

	.reveal {
		margin-top: 0.9rem;
		font-size: 1.05rem;
		font-style: italic;
		color: var(--text2);
	}
	.reveal--ar {
		font-size: 1.6rem;
		font-style: normal;
		color: var(--text1);
	}

	/* Keyboard */
	.seg-wrap {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 100px;
		background: var(--tile3);
		border: 2px solid var(--tile5);
	}
	.seg {
		padding: 0.45rem 1rem;
		border-radius: 100px;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}
	.seg.is-on {
		background: var(--tile5);
		color: var(--text1);
	}

	.link-btn {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	.link-btn:hover {
		color: var(--text1);
	}

	.arabic-input {
		display: block;
		width: 100%;
		min-height: 10rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.85rem 1rem;
		font-size: 1.75rem;
		color: var(--text1);
		transition: border-color 0.2s ease;
	}
	.arabic-input.hidden {
		display: none;
	}
	.arabic-input:focus {
		outline: none;
		border-color: #0ea5e9;
	}
	.arabic-input::placeholder {
		color: var(--text2);
		opacity: 0.65;
	}

	/* Reorder */
	.zone {
		margin-top: 1rem;
		min-height: 5.5rem;
		border-radius: 1.1rem;
		border: 2px dashed var(--tile5);
		padding: 0.9rem 1rem 1.1rem;
	}
	.zone-label {
		margin-bottom: 0.6rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}
	.zone-empty {
		text-align: center;
		font-size: 0.9rem;
		color: var(--text2);
	}

	.tile {
		padding: 0.5rem 1rem;
		border-radius: 0.9rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text1);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		box-shadow: 0 3px 0 var(--tile5);
	}
	button.tile {
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}
	button.tile:hover {
		transform: translateY(-2px);
		border-color: #8b5cf6;
		box-shadow: 0 5px 0 #6d28d9;
	}
	button.tile:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 #6d28d9;
	}
	.tile--on {
		border-color: #8b5cf6;
		background: color-mix(in srgb, #8b5cf6 12%, var(--tile3));
		box-shadow: 0 3px 0 #6d28d9;
	}
	.tile--good {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 15%, var(--tile3));
		box-shadow: 0 3px 0 #047857;
	}
	.tile--bad {
		border-color: #f43f5e;
		background: color-mix(in srgb, #f43f5e 15%, var(--tile3));
		box-shadow: 0 3px 0 #9f1239;
	}

	@media (prefers-reduced-motion: reduce) {
		.pick,
		.chip,
		.press,
		button.tile {
			transition: none;
		}
		.pick:hover,
		.chip:hover,
		button.tile:hover {
			transform: none;
		}
	}
</style>
