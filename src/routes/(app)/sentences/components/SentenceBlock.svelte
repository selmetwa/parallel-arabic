<script lang="ts">
	import { type Keyboard } from '../../../../types/index';
	import { updateKeyboardStyle } from '../../../../helpers/update-keyboard-style';
	import { hue, theme } from '../../../../store/store';
	import { getBrowserInfo } from '../../../../helpers/get-browser-info';
	import KeyboardDocumentation from '../../../../components/KeyboardDocumentation.svelte';
	import Modal from '../../../../components/Modal.svelte';
	import Button from '../../../../components/Button.svelte';
	import { speakText } from '../../../../helpers/speak-arabic';

	import { onMount } from 'svelte';
	import cn from 'classnames';

	export let sentence: {
		arabic: string;
		english: string;
		transliteration: string;
	};

	type Attempt = {
		letter: string;
		correct: boolean;
	};

	$: hue.subscribe(() => {
		updateKeyboardStyle();
	});

	$: theme.subscribe(() => {
		updateKeyboardStyle();
	});

	let attemptTemp: Attempt[] = [];
	$: attempt = attemptTemp;
	$: isCorrect = false;
	$: isInfoModalOpen = false;
	$: showHint = false;
	$: showAnswer = false;
  $: response = '';

  $: if (sentence.arabic) {
		attemptTemp = [];
		attempt = [];
		isCorrect = false;
		showHint = false;
		showAnswer = false;
    isInfoModalOpen = false;
    response = '';
  
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
		console.log({ value });

		const myInputArr = value.split('');
		const egyptianArabicArr = sentence.arabic.split('');

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

  const saveWord = async () => {
    console.log({ sentence})
		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: {
          arabic: sentence.arabic,
          english: sentence.english,
          transliterated: sentence.transliteration,
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

{#if sentence}
  {#if response}
    <div class="bg-tile-500 py-2 text-center font-semibold">
      <p class="text-md text-text-300">{response}</p>
    </div>
    {/if}
	{#if isCorrect}
  <div class="bg-green-100 py-2 text-center font-semibold">
    <p class="text-xl text-text-300">{sentence.arabic} is Correct</p>
  </div>
	{/if}
	<div class="mt-10 flex w-full flex-row gap-2 px-4 sm:w-1/2">
		<Button onClick={() => (showHint = !showHint)} type="button">Show Hint</Button>
		<Button onClick={() => (showAnswer = !showAnswer)} type="button">Show Answer</Button>
		<Button onClick={saveWord} type="button">Save Sentence</Button>
	</div>
  <div class="mx-auto w-fit text-center mt-6">
    <div class="flex flex-col items-center justify-center gap-2">
      <h1 class="w-fit text-[40px] font-bold text-text-300">{sentence.english}</h1>
      {#if showHint}
        <p class="w-fit text-[25px] text-text-300">({sentence.transliteration})</p>
      {/if}
      {#if showAnswer}
        <p class="w-fit text-[35px] text-text-300">({sentence.arabic})</p>
      {/if}
    </div>
    {#if isSafari}
      <span class="text-[35px]">
        {@html attempt
          .map(
            ({ letter, correct }) =>
              `<span class="${cn('text-[35px]', {
                'text-green-500': correct,
                'text-red-500': !correct
              })}">&zwj;&zwj;${letter}&zwj;&zwj;</span>`
          )
          .join('')}
      </span>
    {:else}
      <span class="text-[35px]">
        {@html attempt
          .map(
            ({ letter, correct }) =>
              `<span class="${cn('text-[35px]', {
                'text-green-500': correct,
                'text-red-500': !correct
              })}">${letter}</span>`
          )
          .join('')}
      </span>
    {/if}
  </div>

	<Modal isOpen={isInfoModalOpen} handleCloseModal={closeInfoModal} height="70%" width="80%">
		<KeyboardDocumentation></KeyboardDocumentation>
	</Modal>
	<div class="mt-4 block px-4">
		<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
		<button class="mt-3 text-text-300 underline" on:click={openInfoModal}
			>How does this keyboard work?</button
		>
	</div>
{/if}
