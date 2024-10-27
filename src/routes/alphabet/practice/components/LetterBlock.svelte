<script lang="ts">
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
	import { hue, theme } from '$lib/store/store';
	import { type Letter, type Keyboard } from '$lib/types';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import KeyboardDocumentation from '$lib/components/KeyboardDocumentation.svelte';
	import Audio from '$lib/components/Audio.svelte';

	import cn from 'classnames';
	type Props = { letter: Letter; }

	let { letter }: Props = $props();

	let attempt = $state('');
	let isCorrect = $state(false);
	let showHint = $state(false);
	let showAnswer = $state(false);
	let isInfoModalOpen = $state(false);
	let keyboardValue = $state('');
	let keyboard = $state('virtual');

	$effect(() => {
		if (letter.isolated) {
			if (window !== undefined) {
				const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
				if (keyboard) {
					keyboard.resetValue();
				}
			}

			attempt = '';
			isCorrect = false;
			showHint = false;
			showAnswer = false;
			isInfoModalOpen = false;
			keyboardValue = '';
		}
	});

	function toggleHint() {
		showHint = !showHint;
	}

	function toggleAnswer() {
		showAnswer = !showAnswer;
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

	function compareMyInput(value: string) {
		attempt = value;
		if (value === letter.isolated) {
			isCorrect = true;
			if (window !== undefined) {
				const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
				if (keyboard) {
					keyboard.resetValue();
				}
			}
		} else {
			isCorrect = false;
		}
	}

	onMount(() => {
		const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;

		updateKeyboardStyle();

		keyboard?.addEventListener('keydown', () => {
			const value = keyboard && keyboard.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		});

		keyboard?.addEventListener('click', () => {
			const value = keyboard && keyboard.getTextAreaValue();
			if (typeof value === 'string') {
				compareMyInput(value);
			}
		});
	});

	function openInfoModal() {
		isInfoModalOpen = true;
	}

	function closeInfoModal() {
		isInfoModalOpen = false;
	}

	function onRegularKeyboard(e: Event) {
		const target = e.target as HTMLInputElement | null;
		if (target) {
			const value = target.value;
			compareMyInput(value);
			keyboardValue = value;
		}
	}

	function toggleKeyboard() {
		keyboard = keyboard === 'virtual' ? 'physical' : 'virtual';
	}
</script>

<div class="flex flex-col justify-between sm:flex-row">
	<div class="flex flex-col gap-1">
		<h2 class="text-text-200">Listen to the audio and type the letter</h2>
		<Audio src={`/letters/audios/${letter.key}.mp3`}></Audio>
	</div>
	<div>
		<div class="mt-2 flex flex-row gap-2 sm:mt-0">
			<Button className="!h-fit !w-fit" onClick={toggleHint} type="button">
				{showHint ? 'Hide' : 'Show'} hint
			</Button>
			<Button className="!h-fit !w-fit" onClick={toggleAnswer} type="button">
				{showAnswer ? 'Hide' : 'Show'} answer
			</Button>
		</div>
		{#if showHint}
			<p class="mt-2 text-xl text-text-200">{letter.name}</p>
		{/if}
		{#if showAnswer}
			<p class="mt-2 text-3xl text-text-200">{letter.isolated}</p>
		{/if}
	</div>
</div>
<div class="mt-8">
	{#if isCorrect}
		<p class="text-text-200">Correct!</p>
	{/if}
	{#if !isCorrect && attempt.length > 0}
		<p class="text-text-200">Incorrect!</p>
	{/if}
	<div
		class={cn(
			'flex items-center justify-center text-[125px] text-text-300',
			{ 'bg-green-100': isCorrect },
			{ 'bg-red-100': !isCorrect && attempt.length > 0 }
		)}
	>
		{attempt}
	</div>
	<Modal isOpen={isInfoModalOpen} handleCloseModal={closeInfoModal} height="70%" width="80%">
		<KeyboardDocumentation></KeyboardDocumentation>
	</Modal>
	<div>
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
			value={keyboardValue}
			oninput={onRegularKeyboard}
			class={cn('block min-h-32 w-full bg-tile-400 text-text-300', {
				hidden: keyboard === 'virtual'
			})}
		></textarea>
	</div>
</div>
