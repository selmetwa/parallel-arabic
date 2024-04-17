<script lang="ts">
	import { onMount } from 'svelte';
	import cn from 'classnames';
	import { hue, theme } from '../../../../store/store';
	import { speakText } from '../../../../helpers/speak-arabic';
  import { updateKeyboardStyle } from '../../../../helpers/update-keyboard-style';
  import { type Keyboard } from '../../../../types/index';
	import Button from '../../../../components/Button.svelte';

	type Word = {
		english: string;
		egyptianArabic: string;
		standardArabic: string;
		standardArabicTransliteration: string;
		egyptianArabicTransliteration: string;
	};

	type Attempt = {
		letter: string;
		correct: boolean;
	};

	export let word: Word;
	let attemptTemp: Attempt[] = [];
	let showHint = false;
	let showAnswer = false;
	let response = '';
	let correctAnswer = '';

	let egyptianArabicWord = '';
	if (word.egyptianArabic.includes('–') || word.egyptianArabic.includes('-')) {
		if (word.egyptianArabic.includes('–')) {
			egyptianArabicWord = word.egyptianArabic.split('–')[0].trim();
		}

		if (word.egyptianArabic.includes('-')) {
			egyptianArabicWord = word.egyptianArabic.split('-')[0].trim();
		}
	} else {
		egyptianArabicWord = word.egyptianArabic;
	}

	$: hue.subscribe(() => {
		updateKeyboardStyle();
	});

	$: theme.subscribe(() => {
		updateKeyboardStyle();
	});

	$: if (word.english) {
		attempt = [];
		isCorrect = false;
		showHint = false;
		showAnswer = false;
		response = '';
		correctAnswer = '';

		if (word.egyptianArabic.includes('–') || word.egyptianArabic.includes('-')) {
			if (word.egyptianArabic.includes('–')) {
				egyptianArabicWord = word.egyptianArabic.split('–')[0].trim();
			}

			if (word.egyptianArabic.includes('-')) {
				egyptianArabicWord = word.egyptianArabic.split('-')[0].trim();
			}
		} else {
			egyptianArabicWord = word.egyptianArabic;
		}

		if (typeof document !== 'undefined') {
			const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
			document.addEventListener('keydown', () => {
				const value = keyboard && keyboard.getTextAreaValue();
				if (typeof value === 'string') {
					compareMyInput(value);
				}
			});
		}
	}

	$: attempt = attemptTemp;
	$: isCorrect = false;

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
		const myInputArr = myInput.split('');
		const egyptianArabicArr = egyptianArabicWord.split('');

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

	const saveWord = async () => {
		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: {
					arabic: egyptianArabicWord,
					english: word.english,
					transliterated: word.egyptianArabicTransliteration
				}
			})
		});

		const data = await res.json();
		response = data.message;

		setTimeout(() => {
			response = '';
		}, 3000);
	};


</script>

<div>
	<div class="bg-tile-300 px-8 py-4">
		{#if response}
			<p class="mb-1 w-fit text-sm text-text-300">{response}</p>
		{/if}
		<div class="flex w-full flex-col items-center gap-2 sm:w-2/4 sm:flex-row">
			<Button type="button" onClick={toggleAnswer}>{showAnswer ? 'Hide' : 'Show'} answer</Button>
			<Button type="button" onClick={toggleHint}>{showHint ? 'Hide' : 'Show'} hint</Button>
			<Button type="button" onClick={saveWord}>Save word</Button>
			<Button type="button" onClick={() => speakText(egyptianArabicWord)}>Hear word</Button>
		</div>
	</div>
	{#if isCorrect}
		<div
			class="flex w-full flex-row items-center justify-center gap-2 bg-green-100 py-2 transition-all duration-300"
		>
			<span class="text-lg font-semibold text-text-300">{correctAnswer} is correct</span>
		</div>
	{/if}
	<div class="mt-8 flex flex-col text-wrap">
		<div class="mx-auto w-fit text-center">
			<div class="flex flex-row items-center justify-center gap-2">
				<h1 class="w-fit text-[50px] font-bold text-text-300">{word.english}</h1>
				{#if showHint}
					<p class="w-fit text-[25px] text-text-300">({word.egyptianArabicTransliteration})</p>
				{/if}
				{#if showAnswer}
					<p class="w-fit text-[35px] text-text-300">({egyptianArabicWord})</p>
				{/if}
			</div>
      <span class='text-[35px]'>
        {@html attempt.map(({ letter, correct }) => 
        `<span class="${cn('text-[35px]', { 'text-green-500': correct, 'text-red-500': !correct })}">${letter}</span>`
      ).join('')}
      </span>
		</div>
		<div class="mt-4 px-2">
			<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
		</div>
	</div>
</div>
