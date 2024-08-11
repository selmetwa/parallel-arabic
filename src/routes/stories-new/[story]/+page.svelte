<script lang="ts">
	import cn from 'classnames';
	import Sentence from './components/Sentence.svelte';
	import WordModal from './components/WordModal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import Button from '$lib/components/Button.svelte';
  import { getWordObjectToSave } from '$lib/helpers/get-word-object-to-save';
  import Checkmark from "$lib/components/Checkmark.svelte";

	import { Mode, type KeyWord } from './types';
	export let data;

	let mode = Mode.SentanceView;
	const sentences = data.sentences;



	let timer: any = null;
	$: index = 0;
	$: isLoading = false;
	$: isModalOpen = false;
  $: response = "";
  $: error = "";

  export let activeWordObj: KeyWord = {
		english: '',
		arabic: '',
		transliterated: '',
		description: '',
		isLoading: false,
		type: ''
	};
  
  $: if (index) {
    activeWordObj = {
      english: '',
      arabic: '',
      transliterated: '',
      description: '',
      isLoading: false,
      type: ''
    };
  }
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

	function next() {
		if (index < sentences.length - 1) {
			index += 1;
		}
	}

	function previous() {
		if (index > 0) {
			index -= 1;
		}
	}

	const modeOptions = [
		{ value: Mode.SingleText, text: 'Single Text' },
		{ value: Mode.BiText, text: 'Bi Text' },
		{ value: Mode.SentanceView, text: 'Sentence View' }
	];

	function updateMode(event: Event) {
		mode = (event.target as HTMLInputElement).value as Mode;
	}

	function setActiveWord(word: KeyWord) {
		clearTimeout(timer);
		activeWordObj = word;

		if (mode !== Mode.SentanceView) {
			isModalOpen = true;
      return;
		}
	}

  const saveWord = async () => {
    isLoading = true;
    const wordToSave = activeWordObj.arabic;
    const type = activeWordObj.type;

    const chatgptres = await getWordObjectToSave(wordToSave, type);
    const message = chatgptres.message;
    if ([
      'You must have an account do that',
      'Something went wrong'
    ].includes(message)) {
      error = message;
      response = '';
      isLoading = false;

      setTimeout(() => {
        error = '';
        response = '';
      }, 3000);

      return
    }

    const jsonBlob = chatgptres.message.message.content;
    const _activeWordObj = JSON.parse(jsonBlob);
  
		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: _activeWordObj
			})
		});

    isLoading = false;
		const data = await res.json();

    if ([
      'You have already saved this', 
      'You must have an account do that',
      'Something went wrong'
    ].includes(data.message)) {
      error = data.message;
      response = '';
    } else {
      error = '';
      response = data.message;
    }

		setTimeout(() => {
      error = '';
			response = '';
		}, 3000);
	};
</script>

<WordModal {activeWordObj} {isModalOpen} {closeModal}></WordModal>
<header class="flex flex-row items-center justify-between border-b border-tile-600 px-8 py-8">
	<div>Audio goes here</div>
	<fieldset>
		<legend class="sr-only">Select Mode</legend>
		<ul class="flex flex-row gap-1">
			{#each modeOptions as option}
				<li>
					<RadioButton
						wrapperClass="!p-2 h-min"
						className="text-sm !p-1 h-min font-semibold"
						selectableFor={option.value}
						value={option.value}
						text={option.text}
						isSelected={option.value === mode}
						onClick={updateMode}
					/>
				</li>
			{/each}
		</ul>
	</fieldset>
</header>

{#if error}
  <div class="absolute top-0 w-full py-4 bg-red-100 h-[107px] sm:h-[67px] left-0 text-center z-50">
    <p class="font-semibold text-text-300 text-xl">{error}</p>
  </div>
{/if}

{#if mode === Mode.SentanceView}
	<section class="grid grid-cols-2 grid-rows-2 divide-x divide-tile-600 bg-tile-400">
		<Sentence sentence={sentences[index].english} {setActiveWord} type="english" />
		<Sentence sentence={sentences[index].arabic} {setActiveWord} type="arabic" />
		<div
			class="flex flex-col items-center justify-center border-b border-tile-600 px-5 py-12 text-text-300"
		>
			{#if activeWordObj.description || activeWordObj.isLoading}
				<div class="flex flex-col items-center p-4">
					<p class="text-4xl text-text-300">{activeWordObj.arabic}</p>
					<p class="my-2 text-text-200">{activeWordObj.description}</p>

					{#if activeWordObj.isLoading}
						<div role="status">
							<svg
								aria-hidden="true"
								class="my-3 h-12 w-12 animate-spin fill-tile-500 text-text-200 dark:text-text-200"
								viewBox="0 0 100 101"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
									fill="currentColor"
								/>
								<path
									d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
									fill="currentFill"
								/>
							</svg>
							<span class="sr-only">Loading...</span>
						</div>
					{/if}
					<div class="mt-2 flex w-full flex-row items-center gap-2">
						<Button type="button" onClick={saveWord}>
							{#if isLoading}
								<span class="mx-auto flex w-fit flex-row items-center gap-2 text-center">
									<div role="status">
										<svg
											aria-hidden="true"
											class="h-[24px] w-[24px] animate-spin fill-tile-300 text-text-200 dark:text-text-200"
											viewBox="0 0 100 101"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
												fill="currentColor"
											/>
											<path
												d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
												fill="currentFill"
											/>
										</svg>
										<span class="sr-only">Loading...</span>
									</div>
									Saving
								</span>
							{:else if response && !error}
								<span class="mx-auto flex w-fit flex-row items-center gap-2 text-center">
									<Checkmark></Checkmark>
									Saved
								</span>
							{:else}
								Save Word
							{/if}
						</Button>
					</div>
				</div>
			{:else}
				<h3 class="text-xl font-semibold">No Active Word</h3>
				<p class="text-lg">Click on a word to get a full definition.</p>
			{/if}
		</div>
		<Sentence sentence={sentences[index].transliteration} {setActiveWord} type="transliterated" />
	</section>
	<div class="flex flex-col items-center gap-2">
		<div class="mt-4 flex w-fit flex-row items-center gap-2">
			{#if index > 0}
				<Button onClick={previous} type="button">Previous</Button>
			{/if}
			{#if index < sentences.length - 1}
				<Button onClick={next} type="button">Next</Button>
			{/if}
		</div>
		<p class="text-md text-text-300">
			{index + 1} / {sentences.length}
		</p>
	</div>
{:else}
	{#each sentences as sentence}
		<section
			class={cn(
				'grid divide-tile-600 bg-tile-400',
				{ 'grid-cols-1 grid-rows-1': mode === Mode.SingleText },
				{ 'grid-cols-2 grid-rows-1 divide-x': mode === Mode.BiText }
			)}
		>
			{#if mode === Mode.BiText}
				<Sentence sentence={sentence.english} {setActiveWord} type="english" />
			{/if}
			<Sentence sentence={sentence.arabic} type="arabic" {setActiveWord} />
		</section>
	{/each}
{/if}
