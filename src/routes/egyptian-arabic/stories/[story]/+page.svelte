<script lang="ts">
	import cn from 'classnames';
	// import Sentence from './components/Sentence.svelte';
	// import WordModal from './components/WordModal.svelte';
  import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';
  import WordModal from '$lib/components/dialect-shared/story/components/WordModal.svelte';
	import IntersectionObserver from '$lib/components/IntersectionObserver.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import { getWordObjectToSave } from '$lib/helpers/get-word-object-to-save';
	import Checkmark from '$lib/components/Checkmark.svelte';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import Audio from '$lib/components/Audio.svelte';
	// import { Mode, type KeyWord } from './types';
  import { Mode, type KeyWord } from '$lib/types/index';

  let { data, activeWordObj = $bindable({
		english: '',
		arabic: '',
		transliterated: '',
		description: '',
		isLoading: false,
		type: ''
	}) }: Props = $props();

	const isPaywalled = data.isPaywalled;

	let mode = $state(Mode.SingleText);
	const sentences = data.sentences;

	let timer: ReturnType<typeof setTimeout> | null = null;
	let index = $state(0);
	let isLoading = $state(false);
	let isModalOpen = $state(false);
	let response = $state('');
	let error = $state('');
	
	interface Props {
		data: any;
		activeWordObj?: KeyWord;
	}

	$effect(() => {
		if (index) {
			activeWordObj = {
				english: '',
				arabic: '',
				transliterated: '',
				description: '',
				isLoading: false,
				type: ''
			};
		}
	});

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
		{ value: Mode.SingleText, text: 'Arabic' },
		{ value: Mode.BiText, text: 'English & Arabic' },
		{ value: Mode.SentanceView, text: 'English, Arabic, and Transliteration' }
	];

	function updateMode(event: Event) {
		mode = (event.target as HTMLInputElement).value as Mode;
	}

	function setActiveWord(word: KeyWord) {
		if (timer) {
			clearTimeout(timer);
		}
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

		const result = await getWordObjectToSave(wordToSave, type);
		
		if (result.error) {
			error = result.error;
			response = '';
			isLoading = false;

			setTimeout(() => {
				error = '';
				response = '';
			}, 3000);

			return;
		}

		if (!result.success || !result.data) {
			error = 'Failed to get word data';
			response = '';
			isLoading = false;
			setTimeout(() => {
				error = '';
			}, 3000);
			return;
		}

		const _activeWordObj = result.data;

		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: _activeWordObj
			})
		});

		isLoading = false;
		const data = await res.json();

		if (
			[
				'You have already saved this',
				'You must have an account do that',
				'Something went wrong'
			].includes(data.message)
		) {
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

{#if isPaywalled && !data.hasActiveSubscription}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">You are not subscribed.</h1>
		<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
		<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
			<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
			<Button type="submit">Subscribe</Button>
		</form>
	</div>
{:else}
	<WordModal {activeWordObj} {isModalOpen} {closeModal} dialect="egyptian-arabic"></WordModal>
	<header class="border-b border-tile-600 bg-tile-400">
		<div class="max-w-5xl mx-auto px-3 sm:px-8">
			<!-- Title Section -->
			<div class="py-6 text-center">
				<h1 class="text-3xl sm:text-4xl font-bold text-text-300 tracking-tight">
					<span class="block text-xl sm:text-2xl text-text-200 mb-1">
						{data.title.arabic}
					</span>
					<span class="block">
						{data.title.english}
					</span>
				</h1>
			</div>
			
			<!-- Controls Section -->
			<div class="pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<!-- Audio Controls -->
				<div class="bg-tile-300 border border-tile-500 px-4 py-4 shadow-lg">
					<div class="flex justify-between items-center mb-3">
						<h3 class="text-sm font-semibold text-text-200 tracking-wide">Audio</h3>
						{#if mode === Mode.SentanceView}
							<div class="flex items-center gap-3">
								{#if index > 0}
									<Button onClick={previous} type="button">Previous</Button>
								{/if}
                <div class="flex flex-row items-center gap-3">
                  <span class="text-text-300 font-semibold">
                    {index + 1}
                  </span>
                  <span>/</span>
                  <span class="text-text-300 font-semibold">
                    {sentences.length}
                  </span>
                </div>
								{#if index < sentences.length - 1}
									<Button onClick={next} type="button">Next</Button>
								{/if}
							</div>
						{/if}
					</div>
					{#if data.audio}
						{#if mode === Mode.SentanceView}
							<Audio src={sentences[index].arabic.audio}></Audio>
						{:else}
							<Audio src={data.audio}></Audio>
						{/if}
					{:else}
						<div class="flex items-center justify-center py-4">
							<p class="text-text-300 text-sm">No audio available</p>
						</div>
					{/if}
				</div>
				
				<!-- Mode Selection -->
				<div class="bg-tile-300 border border-tile-500 px-4 py-4 shadow-lg">
					<fieldset>
						<legend class="text-sm font-semibold text-text-200 mb-3 tracking-wide">Reading Mode</legend>
						<div class="space-y-2">
							{#each modeOptions as option}
								<RadioButton
									wrapperClass="!p-2 w-full"
									className="text-sm !p-2 font-medium w-full text-left"
									selectableFor={option.value}
									value={option.value}
									text={option.text}
									isSelected={option.value === mode}
									onClick={updateMode}
								/>
							{/each}
						</div>
					</fieldset>
				</div>
			</div>
		</div>
	</header>

	{#if error}
		<div
			class="absolute left-0 top-0 z-50 h-[107px] w-full bg-red-100 py-4 text-center sm:h-[67px]"
		>
			<p class="text-xl font-semibold text-text-300">{error}</p>
		</div>
	{/if}

	{#if mode === Mode.SentanceView}
		<section
			class="grid grid-cols-1 grid-rows-4 divide-x divide-tile-600 bg-tile-300 sm:grid-cols-2 sm:grid-rows-2"
		>
			<Sentence
				{index}
				sentence={sentences[index]}
				{setActiveWord}
				type="english"
				classname="row-[2] sm:row-[1] sm:col-[1]"
				{mode}
				dialect="egyptian-arabic"
			/>
			<Sentence
				{index}
				classname="row-[1] sm:row-[1] sm:col-[2]"
				sentence={sentences[index]}
				{setActiveWord}
				type="arabic"
				{mode}
				dialect="egyptian-arabic"
			/>
			<div
				class="col-[1] row-[4] flex flex-col items-center justify-center border-b border-tile-600 px-5 py-10 text-text-300 sm:row-[2]"
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
			<Sentence
				{index}
				classname="row-[3] sm:row-[2] sm:col-[2]"
				sentence={sentences[index]}
				{setActiveWord}
				type="transliteration"
				{mode}
				dialect="egyptian-arabic"
			/>
		</section>
		{#if mode !== Mode.SentanceView}
			<div class="flex flex-col items-center gap-2 py-6">
				<div class="flex w-fit flex-row items-center gap-3">
					{#if index > 0}
						<Button onClick={previous} type="button">Previous</Button>
					{/if}
					<span class="text-text-300 font-semibold">
						{index + 1} / {sentences.length}
					</span>
					{#if index < sentences.length - 1}
						<Button onClick={next} type="button">Next</Button>
					{/if}
				</div>
			</div>
		{/if}
	{:else}
		{#each sentences as sentence}
			<IntersectionObserver top={100} bottom={100} preventRefetch={true} let:intersecting let:shouldLoad>
				{#if shouldLoad}
					<section
						class={cn(
							'divide-tile-600 bg-tile-300 sm:grid',
							{ 'grid-cols-1 grid-rows-1': mode === Mode.SingleText },
							{ 'flex flex-col-reverse divide-x sm:grid-cols-2 sm:grid-rows-1': mode === Mode.BiText }
						)}
					>
						{#if mode === Mode.BiText}
							<Sentence
								{sentence}
								{setActiveWord}
								type="english"
								index={sentences.indexOf(sentence)}
								{mode}
								dialect="egyptian-arabic"
								{intersecting}
							/>
						{/if}
						<Sentence
							{sentence}
							type="arabic"
							{setActiveWord}
							{mode}
							index={sentences.indexOf(sentence)}
							dialect="egyptian-arabic"
							{intersecting}
						/>
					</section>
				{:else}
					<!-- Placeholder to maintain layout while sentence is not in view -->
					<div class="min-h-[200px] bg-tile-300 border-b border-tile-600"></div>
				{/if}
			</IntersectionObserver>
		{/each}
	{/if}
{/if}
