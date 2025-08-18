<script lang="ts">
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
	let keyboardValue = $state('');

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

	async function askChatGTP(word: string) {
		targetWord = word;
		isLoadingDefinition = true;
		openDefinitionModal();
		const question = `What does ${word} mean in ${dialectName[dialect]}? Considering the following sentences ${sentence.arabic} ${sentence.english} ${sentence.transliteration} but please do not reveal the entire meaning of the sentence, and dont say anything about the rest of the sentence at all, just use it as a reference to derive the definition.`;

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
		<div class="mb-4 bg-green-100 py-3 px-4 text-center border-2 border-green-100">
			<p class="text-lg font-bold text-text-300">{sentence.arabic} is Correct</p>
		</div>
	{/if}
	
	<InfoDisclaimer></InfoDisclaimer>
	
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
			<h1 class="flex w-fit flex-row flex-wrap text-3xl sm:text-4xl font-bold text-text-300">
				{#each sentence.english.split(' ') as word}
					<button
						onclick={() => askChatGTP(word)}
						class="p-1 text-3xl sm:text-4xl duration-300 hover:bg-tile-500 border-2 border-transparent hover:border-tile-600"
						>{word}</button
					>
				{/each}
			</h1>
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
