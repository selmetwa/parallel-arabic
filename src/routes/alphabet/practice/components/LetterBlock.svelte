<script lang="ts">
	import { onMount } from 'svelte';
	import { updateKeyboardStyle } from '../../../../helpers/update-keyboard-style';
	import { hue, theme } from '../../../../store/store';
	import { type Letter, type Keyboard } from '../../../../types';
	import Button from '../../../../components/Button.svelte';
  import Modal from '../../../../components/Modal.svelte';
  import KeyboardDocumentation from '../../../../components/KeyboardDocumentation.svelte';
	import cn from 'classnames';
	export let letter: Letter;
  export let handleNext: () => void;

	$: attempt = '';
	$: isCorrect = false;
	let showHint = false;
  let showAnswer = false;
  $: isInfoModalOpen = false;


	$: if (letter.isolated) {
		attempt = '';
		isCorrect = false;
		showHint = false;
    showAnswer = false;
    isInfoModalOpen = false;
	}

	function toggleHint() {
		showHint = !showHint;
	}

  function toggleAnswer() {
    showAnswer = !showAnswer;
  }
	$: hue.subscribe(() => {
		updateKeyboardStyle();
	});

	$: theme.subscribe(() => {
		updateKeyboardStyle();
	});

	function compareMyInput(value: string) {
		attempt = value;
		if (value === letter.isolated) {
			isCorrect = true;
      setTimeout(() => {
        if (window !== undefined) {
          const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
          if (keyboard) {
            keyboard.resetValue()
          }
        }
        handleNext();
      }, 3000)
		} else {
			isCorrect = false;
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

  function openInfoModal() {
    isInfoModalOpen = true;
  }

  function closeInfoModal() {
    isInfoModalOpen = false;
  }
</script>

<div class="flex flex-col sm:flex-row justify-between">
	<div class="flex flex-col gap-1">
		<h2 class="text-text-200">Listen to the audio and type the letter</h2>
		<audio src={`/letters/audios/${letter.key}.mp3`} controls></audio>
	</div>
	<div>
    <div class="flex flex-row mt-2 sm:mt-0 gap-2">
      <Button className="!h-fit !w-fit" onClick={toggleHint} type="button">
        {showHint ? 'Hide' : 'Show'} hint
      </Button>
      <Button className="!h-fit !w-fit" onClick={toggleAnswer} type="button">
        {showAnswer ? 'Hide' : 'Show'} answer
      </Button>
    </div>
		{#if showHint}
			<p class="text-xl mt-2 text-text-200">{letter.name}</p>
		{/if}
    {#if showAnswer}
      <p class="text-3xl mt-2 text-text-200">{letter.isolated}</p>
    {/if}
	</div>
</div>
<div class="mt-4 w-1/4"></div>
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
	<div class="my-3 sm:mt-8">
		<arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
	</div>
  <button class="text-text-300 underline" on:click={openInfoModal}>How does this keyboard work?</button>
</div>
