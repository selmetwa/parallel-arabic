<script lang="ts">
	import { onMount } from 'svelte';
	import cn from 'classnames';

	import { hue, theme } from '../../../../store/store';
	import { speakText } from '../../../../helpers/speak-arabic';
  import { updateKeyboardStyle } from '../../../../helpers/update-keyboard-style';
  import { type Keyboard } from '../../../../types/index';
	import Button from '../../../../components/Button.svelte';
  import Canvas from '../../../alphabet/practice/components/Canvas.svelte';
import { getBrowserInfo } from '../../../../helpers/get-browser-info'
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
  export let mode: string;
  export let switchMode: () => void;

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

  $: if (mode === 'keyboard') {
		updateKeyboardStyle();
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

  const isSafari = getBrowserInfo()
</script>

<div>
	<div class="bg-tile-300 px-8 py-4">
		{#if response}
			<p class="mb-1 w-fit text-sm text-text-300">{response}</p>
		{/if}
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
			<Button type="button" onClick={toggleAnswer}>{showAnswer ? 'Hide' : 'Show'} answer</Button>
			<Button type="button" onClick={toggleHint}>{showHint ? 'Hide' : 'Show'} hint</Button>
			<Button type="button" onClick={saveWord}>Save word</Button>
			<Button type="button" onClick={() => speakText(egyptianArabicWord)}>Hear word</Button>
			<Button type="button" onClick={switchMode}>
        {mode === 'draw' ? 'Type' : 'Draw'}
      </Button>
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
      {#if isSafari}
        <span class='text-[35px]'>
          {@html attempt.map(({ letter, correct }) => 
          `<span class="${cn('text-[35px]', { 'text-green-500': correct, 'text-red-500': !correct })}">&zwj;&zwj;${letter}&zwj;&zwj;</span>`
        ).join('')}
        </span>
      {:else}
        <span class='text-[35px]'>
          {@html attempt.map(({ letter, correct }) => 
          `<span class="${cn('text-[35px]', { 'text-green-500': correct, 'text-red-500': !correct })}">${letter}</span>`
        ).join('')}
        </span>
      {/if}
		</div>
    {#if mode === 'keyboard'}
      <div class="mt-4 px-2">
        <arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
      </div>
    {/if}
	</div>
</div>


{#if mode === 'draw'}
  <div class="mt-4 px-6">
    <Canvas letter={word} size={10} />
  </div>
{/if}