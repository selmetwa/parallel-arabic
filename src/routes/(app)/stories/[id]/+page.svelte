<script lang="ts">
	import Button from '../../../../components/Button.svelte';
	import Sentence from './components/Sentence.svelte';
	import { Mode, type KeyWord, type TextObj } from './types';
	import Header from './components/Header.svelte';
	import Modal from '../../../../components/Modal.svelte';
  import { getWordObjectToSave } from '../../../../helpers/get-word-object-to-save';
  
	export let data: {
		session: any;
		formattedStory: {
			text: TextObj[];
			keyWords: KeyWord[];
		};
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

  export let activeWordObj: KeyWord = {
		english: '',
		arabic: '',
		transliterated: '',
    description: '',
    isLoading: false,
    type: ''
	};

	function closeModal() {
		timer = setTimeout(() => {
			activeWordObj = {
				english: '',
				arabic: '',
				transliterated: '',
        description: '',
        isLoading: false,
        type: ''
			};
		}, 3000);
		isModalOpen = false;
	}

	function setActiveWord(word: KeyWord) {
		clearTimeout(timer);
		activeWordObj = word;

		if (mode !== Mode.SentanceView) {
			isModalOpen = true;
		}
	}

	const saveWord = async () => {
    const wordToSave = activeWordObj.arabic;
    const type = activeWordObj.type;

    const chatgptres = await getWordObjectToSave(wordToSave, type);
    const jsonBlob = chatgptres.message.message.content;
    const _activeWordObj = JSON.parse(jsonBlob);
  
		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: _activeWordObj
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
    <p class="my-2 text-text-200">{activeWordObj.description}</p>

    {#if activeWordObj.isLoading}
      <div role="status">
        <svg aria-hidden="true" class="my-3 w-12 h-12 text-text-200 animate-spin dark:text-text-200 fill-tile-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
        <span class="sr-only">Loading...</span>
      </div>
    {/if}
		<div class="mt-2 flex w-full flex-row items-center gap-2">
			<Button type="button" onClick={saveWord}>Save Word</Button>
		</div>
		{#if response}
			<p class="mt-2 text-md text-text-300">{response}</p>
		{/if}
	</div>
</Modal>

<main>
	<Header {updateMode} {mode} />
	<section class="flex flex-col divide-y divide-tile-600 border-b border-t border-tile-600">
		{#if mode === Mode.SentanceView}
			<Sentence {setActiveWord} {activeWordObj} sentence={sentences[sentence]} {mode} {keyWords} />
		{:else}
			{#each sentences as sentence}
				<Sentence {sentence} {mode} {keyWords} {setActiveWord} {activeWordObj} />
			{/each}
		{/if}
	</section>
	{#if mode === Mode.SentanceView}
		<footer class="mt-8 flex w-full items-center justify-center">
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
