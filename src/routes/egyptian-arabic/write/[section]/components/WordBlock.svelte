<script lang="ts">
	import { onMount } from 'svelte';
	import cn from 'classnames';

	import { hue, theme } from '$lib/store/store';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { type Keyboard } from '$lib/types/index';
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
	}

	let { word, mode, switchMode }: Props = $props();

	let attemptTemp: Attempt[] = $state([]);
	let showHint = $state(false);
	let showAnswer = $state(false);
	let correctAnswer = $state('');
	let egyptianArabicWord = $state('');
  let keyboard = $state('virtual')
	let attempt: Attempt[] = $state([]);
	let isCorrect = $state(false);
  let isInfoModalOpen = $state(false);
  let keyboardValue = $state('');

  const regex = /[-–]/;

	if (regex.test(word.arabic)) {
    egyptianArabicWord = word.arabic.split(regex)[0].trim();
	} else {
		egyptianArabicWord = word.arabic;
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
		const myInputArr = myInput.trim().split('');
		const egyptianArabicArr = egyptianArabicWord.trim().split('');

		const result = myInputArr.map((letter, index) => {
			if (letter === egyptianArabicArr[index]) {
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

		if (areArraysEqual(myInputArr, egyptianArabicArr)) {
			isCorrect = true;
			correctAnswer = egyptianArabicWord;
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

			if (regex.test(word.arabic)) {
	      egyptianArabicWord = word.arabic.split(regex)[0].trim();
			} else {
				egyptianArabicWord = word.arabic;
			}

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
			<AudioButton text={egyptianArabicWord} dialect="egyptian-arabic">Audio</AudioButton>
			<SaveButton 
				type="Word"
				objectToSave={{
					arabic: egyptianArabicWord,
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
					<p class="text-2xl sm:text-3xl text-text-300">({egyptianArabicWord})</p>
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
