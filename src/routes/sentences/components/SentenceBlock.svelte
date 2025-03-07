<script lang="ts">
	import { type Keyboard } from '$lib/types/index';
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
	}

	let { sentence, resetSentences }: Props = $props();

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
	let keyboardValue = $state('');

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

	function openDefinitionModal() {
		isDefinitionModalOpen = true;
	}

	function closeDefinitionModal() {
		isDefinitionModalOpen = false;
		definition = '';
	}

	async function askChatGTP(word: string) {
		targetWord = word;
		isLoadingDefinition = true;
		openDefinitionModal();
		const question = `What does ${word} mean in Egyptian Arabic? Considering the following sentences ${sentence.arabic} ${sentence.english} ${sentence.transliteration} but please do not reveal the entire meaning of the sentence, and dont say anything about the rest of the sentence at all, just use it as a reference to derive the definition.`;

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
	$effect(() => {
		attempt = attemptTemp;
	});
</script>

<DefinitionModal
	activeWordObj={{
		english: targetWord,
		isLoading: isLoadingDefinition,
		description: definition
	}}
	isModalOpen={isDefinitionModalOpen}
	closeModal={closeDefinitionModal}
></DefinitionModal>
{#if sentence}
	{#if isCorrect}
		<div class="mt-5 bg-green-100 py-2 text-center font-semibold">
			<p class="text-xl text-text-300">{sentence.arabic} is Correct</p>
		</div>
	{/if}
	<InfoDisclaimer></InfoDisclaimer>
	<div class="mt-10 grid grid-cols-2 flex-row gap-2 sm:w-full sm:grid-cols-5">
		<Button onClick={() => (showHint = !showHint)} type="button">Show Hint</Button>
		<Button onClick={() => (showAnswer = !showAnswer)} type="button">Show Answer</Button>
		<AudioButton text={sentence.arabic}>Listen</AudioButton>
		<SaveButton
			objectToSave={{
				arabic: sentence.arabic,
				english: sentence.english,
				transliterated: sentence.transliteration
			}}
			type="Sentence"
		></SaveButton>
		<Button onClick={resetSentences} type="button">Reset</Button>
	</div>
	<div class="mx-auto mt-6 w-fit text-center">
		<div class="flex flex-col items-center justify-center gap-2">
			<!-- <h1 class="w-fit text-[40px] font-bold text-text-300">{sentence.english}</h1> -->
			<h1 class="flex w-fit flex-row flex-wrap text-[40px] font-bold text-text-300">
				{#each sentence.english.split(' ') as word}
					<button
						onclick={() => askChatGTP(word)}
						class="p-1 text-[40px] duration-300 hover:bg-tile-500">{word}</button
					>
				{/each}
			</h1>
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
	<div class="mt-4 block">
		<button onclick={toggleKeyboard}>
			{keyboard === 'virtual' ? 'Use other keyboard' : 'Use builtin keyboard'}
		</button>
		<div class={cn('block', { hidden: keyboard !== 'virtual' })}>
			<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
			<button class="mt-3 text-text-300 underline" onclick={openInfoModal}
				>How does this keyboard work?</button
			>
		</div>
		<textarea
			oninput={onRegularKeyboard}
			value={keyboardValue}
			class={cn('block min-h-32 w-full bg-tile-400 text-text-300', {
				hidden: keyboard === 'virtual'
			})}
		></textarea>
	</div>
{/if}
