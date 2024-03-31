<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Sentence from './components/Sentence.svelte';
	import { Mode, type KeyWord, type TextObj } from './types';
	import Header from './components/Header.svelte';
  import Modal from '../../../components/Modal.svelte';

	export let data: {
    session: any
    formattedStory: {
      text: TextObj[]
      keyWords: KeyWord[]
    }
  };

	const sentences = data.formattedStory?.text || [];
	const sentencesLength = sentences.length || 0;
	const keyWords = data.formattedStory?.keyWords || [];

	let sentence = 0;
	let mode = Mode.SingleText;
  let response = '';

	function updateMode(event: Event) {
    mode = (event.target as HTMLInputElement).value as Mode;
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
  let timer: any = null;

  function closeModal() {
    timer = setTimeout(() => {
      activeWordObj = {
        english: '',
        arabic: '',
        transliterated: ''
      };
    }, 3000)
    isModalOpen = false;
  }

  export let activeWordObj: KeyWord = {
		english: '',
		arabic: '',
		transliterated: ''
	};

  function setActiveWord(word: KeyWord) {
    clearTimeout(timer);
    activeWordObj = word;

    if (mode !== Mode.SentanceView) {
      isModalOpen = true;
    }
  }

  const saveWord = async () => {
		const res = await fetch(`${window.location.origin}/api/save-word`, {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj
			})
		});

    const data = await res.json();
    response = data.message;
    setTimeout(() => {
      response = '';
    }, 3000);
	};
</script>

<Modal isOpen={isModalOpen} handleCloseModal={closeModal}>
  <div class="flex flex-col items-center p-4">
    <p class="text-4xl text-text-300">{activeWordObj.arabic}</p>
    <p class="text-4xl text-text-300">{activeWordObj.english}</p>
    <p class="text-4xl text-text-300">{activeWordObj.transliterated}</p>
    <div class="mt-2">
      <Button
        type="button"
        onClick={saveWord}
      >
        Save Word
      </Button>
      {#if response}
        <p class="text-md text-text-300">{response}</p>
      {/if}
    </div>
  </div>
</Modal>

<main class="h-full">
	<Header {updateMode} {mode} />
	<section class="flex flex-col divide-y divide-tile-600 border-b border-t border-tile-600">
		{#if mode === Mode.SentanceView}
			<Sentence 
        {setActiveWord}
        {activeWordObj}
        sentence={sentences[sentence]} 
        {mode} 
        {keyWords}
      />
		{:else}
			{#each sentences as sentence}
				<Sentence {sentence} {mode} {keyWords} {setActiveWord} {activeWordObj} />
			{/each}
		{/if}
	</section>
	{#if mode === Mode.SentanceView}
		<footer class="mt-8 w-full flex items-center justify-center">
			<div class="flex w-1/4 flex-row gap-1">
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
