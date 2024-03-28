<script lang="ts">
	import { onMount } from 'svelte';
	import cn from 'classnames';

	import Button from '../../../../components/Button.svelte';

	type Word = {
		english: string;
		egyptianArabic: string;
		standardArabic: string;
		standardArabicTransliteration: string;
		egyptianArabicTransliteration: string;
	};

	type Keyboard = {
		getTextAreaValue: () => string | undefined;
		resetValue: () => void;
		style: {
			setProperty: (key: string, value: string) => void;
		};
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

	$: if (word.english) {
		attempt = [];
		isCorrect = false;
		showHint = false;
		showAnswer = false;
		response = '';

		if (typeof document !== 'undefined') {
			const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
			console.log(keyboard);
			document.addEventListener('keydown', () => {
				const value = keyboard && keyboard.getTextAreaValue();
				console.log(value);
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
		const egyptianArabicArr = word.egyptianArabic.split('');

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

			const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
			keyboard && keyboard.resetValue();
		}
	}

	onMount(() => {
		const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;

		console.log({ keyboard });

		const tile1 = getComputedStyle(document.body).getPropertyValue('--tile1');
		const tile3 = getComputedStyle(document.body).getPropertyValue('--tile3');
		const tile4 = getComputedStyle(document.body).getPropertyValue('--tile4');
		const tile5 = getComputedStyle(document.body).getPropertyValue('--tile5');
		const tile6 = getComputedStyle(document.body).getPropertyValue('--tile6');
		const text3 = getComputedStyle(document.body).getPropertyValue('--text3');

		if (keyboard) {
			keyboard.style.setProperty('--button-color', text3);
			keyboard.style.setProperty('--button-background-color', tile4);
			keyboard.style.setProperty('--button-active-background-color', tile5);
			keyboard.style.setProperty('--button-active-border', `1px solid ${tile6}`);
			keyboard.style.setProperty('--button-hover-background-color', tile3);
			keyboard.style.setProperty('--textarea-background-color', tile1);
			keyboard.style.setProperty('--textarea-input-color', text3);
			keyboard.style.setProperty('--max-keyboard-width', '900px');
		}

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

	console.log({ word });
	const saveWord = async () => {
		const res = await fetch(`${window.location.origin}/api/save-word`, {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: {
					arabic: word.egyptianArabic,
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
	<div class="bg-tile-300 px-8 py-8">
		{#if response}
			<p class="mb-1 w-fit text-sm text-text-300">{response}</p>
		{/if}
		<div class="flex w-full sm:w-2/4 flex-col sm:flex-row items-center gap-2">
			<Button type="button" onClick={toggleAnswer}>{showAnswer ? 'Hide' : 'Show'} answer</Button>
			<Button type="button" onClick={toggleHint}>{showHint ? 'Hide' : 'Show'} hint</Button>
			<Button type="button" onClick={saveWord}>Save word</Button>
		</div>
	</div>
	<div class="mt-8 flex flex-col">
		<div class="mx-auto">
			<div class="flex flex-row items-center gap-2">
				<h1 class="text-[50px] font-bold text-text-300">{word.english}</h1>
				{#if showHint}
					<p class="text-[25px] text-text-300">({word.egyptianArabicTransliteration})</p>
				{/if}
			</div>
			{#if showAnswer}
				<p class="text-[50px] text-text-300">{word.egyptianArabic}</p>
			{/if}
			<div>
				{#if isCorrect}
					<p class="text-[25px] text-text-300">Correct!</p>
				{/if}
				{#each attempt as { letter, correct }}
					<span class={cn('text-[50px]', { 'text-green-500': correct, 'text-red-500': !correct })}
						>{letter}</span
					>
				{/each}
			</div>
		</div>

		<div class="mt-4 px-6">
			<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
		</div>
	</div>
</div>
