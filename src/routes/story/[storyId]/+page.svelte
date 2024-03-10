<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Sentence from './components/Sentence.svelte';
	import type { PageData } from './$types';
	import { Mode } from './types';
	import Header from './components/Header.svelte';
  import Modal from '../../../components/Modal.svelte';
	export let data: PageData;
	const sentences = data.formattedStory?.text || [];
	const sentencesLength = sentences.length || 0;
	const keyWords = data.formattedStory?.keyWords || [];

	let sentence = 0;
	let mode = Mode.SentanceView;

	function updateMode(event: Event) {
		const value = (event.target as HTMLInputElement).value;

		switch (value) {
			case 'single-text':
				mode = Mode.SingleText;
				break;
			case 'bi-text':
				mode = Mode.BiText;
				break;
			case 'sentence-view':
				mode = Mode.SentanceView;
				break;
			default:
				break;
		}
	}

	function nextSentence() {
		if (sentence === sentencesLength - 1) {
			sentence = 0;
			return;
		}
		sentence++;
	}

	function previousSentence() {
		if (sentence === 0) {
			sentence = sentencesLength - 1;
			return;
		}
		sentence--;
	}
 let isModalOpen = false;

  function openModal() {
    isModalOpen = true;
  }
  function closeModal() {
    isModalOpen = false;
  }
</script>

<Modal isOpen={isModalOpen} handleCloseModal={closeModal}>
  <h1>modal</h1>
</Modal>

<main class="h-full">
  <button on:click={openModal}>Open Modal</button>
	<Header {updateMode} />

	<section class="flex flex-col divide-y divide-tile-600 border-b border-t border-tile-600">
		{#if mode === Mode.SentanceView}
			<Sentence sentence={sentences[sentence]} {mode} {keyWords} />
		{:else}
			{#each sentences as sentence}
				<Sentence {sentence} {mode} {keyWords} />
			{/each}
		{/if}
	</section>
	{#if mode === Mode.SentanceView}
		<footer class="mt-4 w-full flex items-center justify-center">
			<div class="flex w-2/4 flex-row gap-1">
        {#if sentence > 0}
          <Button onClick={previousSentence} type="button">Back</Button>
        {/if}
        {#if sentence < sentencesLength - 1}
          <Button onClick={nextSentence} type="button">Next</Button>
        {/if}
			</div>
		</footer>
	{/if}
</main>
