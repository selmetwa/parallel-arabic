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

  const regex = /[-–]/;


	/**
	 * Normalize Arabic text by removing diacritics and standardizing letter forms
	 * This includes:
	 * - Removing diacritics (تشكيل): َ ً ُ ٌ ِ ٍ ْ ّ ٓ ٔ ٕ ٖ ٗ ٘ ٙ ٚ ٛ ٜ ٝ ٞ ٟ ٠ ٭ ٰ ۥ ۦ
	 * - Normalizing Alif variants: آ أ إ ٱ → ا
	 * - Normalizing Ya variants: ى (Ya Maqsoura) → ي
	 * - Normalizing Ta Marbuta: ة → ه
	 * - Normalizing Waw with Hamza: ؤ → و
	 */
	function normalizeArabicText(text: string): string {
		return text
			// Remove diacritics first
			// .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g, '')
			// Normalize Alif variants to plain Alif (ا)
			.replace(/[آأإٱ]/g, 'ا')
			// Normalize Ya Maqsoura (ى) to regular Ya (ي)
			.replace(/ى/g, 'ي')
			// Normalize Waw with Hamza (ؤ) to plain Waw (و)
			.replace(/ؤ/g, 'و')
			// Normalize Ya with Hamza (ئ) to plain Ya (ي)
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

	function compareMyInput(myInput: string) {
		// Normalize both user input and target word for comparison only
		const normalizedInput = normalizeArabicText(myInput.trim());
		const normalizedTarget = normalizeArabicText(arabicWord.trim());
		
		const myInputArr = normalizedInput.split('');
		const arabicArr = normalizedTarget.split('');

		// For visual feedback, compare character by character using normalized versions
		const visualInputArr = myInput.trim().split('');

		const result = visualInputArr.map((letter, index) => {
			// Check if the normalized versions match at this position
			const normalizedUserChar = normalizeArabicText(letter);
			const normalizedTargetChar = normalizeArabicText(arabicWord.trim().split('')[index] || '');
			
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

		// Use the normalized versions for final correctness check
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
			<div class="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
				<h1 class="text-4xl sm:text-5xl font-bold text-text-300">{word.english}</h1>
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
					{keyboard === 'virtual' ? 'Use other keyboard' : 'Use builtin keyboard'}
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
