<script lang="ts">
	import cn from 'classnames';
	import Sentence from '$lib/components/dialect-shared/story/components/Sentence.svelte';
	import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
	import Button from '$lib/components/Button.svelte';
	import { getWordObjectToSave } from '$lib/helpers/get-word-object-to-save';
	import Checkmark from '$lib/components/Checkmark.svelte';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import Audio from '$lib/components/Audio.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';
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

	// Display mode and toggles
	let mode = $state(Mode.Condensed);
	let showEnglish = $state(true);
	let showTransliteration = $state(true);

	const sentences = data.sentences;

	let timer: ReturnType<typeof setTimeout> | null = null;
	let isLoading = $state(false);
	let isModalOpen = $state(false);
	let response = $state('');
	let error = $state('');

	// Parse description as JSON if possible
	let parsedDescription = $derived.by(() => {
		if (!activeWordObj.description) return null;
		try {
			let content = activeWordObj.description;

			// Strip markdown code blocks if present
			if (content.includes('```')) {
				content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
			}

			return JSON.parse(content);
		} catch {
			return null;
		}
	});

	interface Props {
		data: any;
		activeWordObj?: KeyWord;
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

	function setActiveWord(word: KeyWord) {
		if (timer) {
			clearTimeout(timer);
		}
		activeWordObj = word;
		isModalOpen = true;
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
		const fetchData = await res.json();

		if (
			[
				'You have already saved this',
				'You must have an account do that',
				'Something went wrong'
			].includes(fetchData.message)
		) {
			error = fetchData.message;
			response = '';
		} else {
			error = '';
			response = fetchData.message;
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
	<DefinitionModal {activeWordObj} {isModalOpen} {closeModal} dialect="egyptian-arabic"></DefinitionModal>
	<header class="border-b border-tile-600 bg-tile-400">
		<div class="max-w-5xl mx-auto px-3 sm:px-8">
			<!-- Title Section -->
			<div class="py-6 text-center">
				<h1 class="text-3xl sm:text-4xl font-bold text-text-300 tracking-tight">
					<span class="block text-xl sm:text-2xl text-text-200 mb-1" dir="rtl">
						{data.title.arabic}
					</span>
					<span class="block">
						{data.title.english}
					</span>
				</h1>
				<p class="mt-2 text-sm text-text-200">{sentences.length} sentences</p>
			</div>

			<!-- Controls Section -->
			<div class="pb-6 space-y-4">
				<!-- Audio Controls -->
				{#if data.audio}
					<div class="bg-tile-300 border border-tile-500 px-4 py-4 shadow-lg rounded-lg">
						<h3 class="text-sm font-semibold text-text-200 tracking-wide mb-3">Story Audio</h3>
						<Audio src={data.audio}></Audio>
					</div>
				{/if}

				<!-- Display Toggles -->
				<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:justify-end">
					<div class="flex items-center gap-6 py-2 px-4 bg-tile-500/50 rounded-lg">
						<span class="text-sm text-text-200 font-medium">Show:</span>

						<!-- English Toggle -->
						<label class="flex items-center gap-2 cursor-pointer">
							<div class="relative">
								<input
									type="checkbox"
									bind:checked={showEnglish}
									class="sr-only peer"
								/>
								<div class="w-10 h-5 bg-tile-600 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
								<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
							</div>
							<span class="text-sm text-text-300">English</span>
						</label>

						<!-- Transliteration Toggle -->
						<label class="flex items-center gap-2 cursor-pointer">
							<div class="relative">
								<input
									type="checkbox"
									bind:checked={showTransliteration}
									class="sr-only peer"
								/>
								<div class="w-10 h-5 bg-tile-600 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
								<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
							</div>
							<span class="text-sm text-text-300">Transliteration</span>
						</label>
					</div>
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

	<!-- Condensed View: Word-by-word display with optional alignments -->
		<!-- Condensed View: Transliteration stacked above Arabic, English as sentence subtitle -->
		<div class="space-y-6 px-4 py-6">
			{#each sentences as sentence, sentenceIndex}
				{@const arabicWords = sentence.arabic?.text?.split(' ') || []}

				<section
					data-sentence-index={sentenceIndex}
					class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6 transition-all duration-300"
				>
					<!-- Speaker label -->
					{#if sentence.arabic?.speaker}
						<div class="mb-3">
							<p class="text-sm font-semibold text-text-300">{sentence.arabic.speaker}</p>
						</div>
					{/if}

					<!-- English translation with drag-to-select (if showEnglish is true) -->
					{#if showEnglish}
						<div class="mb-4 pb-3 border-b border-tile-600">
							<Sentence
								{sentence}
								{setActiveWord}
								type="english"
								index={sentenceIndex}
								{mode}
								dialect="egyptian-arabic"
								classname="!bg-transparent !border-0 !shadow-none !p-0"
								innerClassname="justify-center"
								size="sm"
							/>
						</div>
					{/if}

					<!-- Word-aligned display (when wordAlignments available) OR fallback -->
					{#if sentence.wordAlignments?.length}
						<!-- Word-by-word aligned display -->
						<div class="flex flex-wrap gap-3 sm:gap-4 justify-center" dir="rtl">
							{#each sentence.wordAlignments as wordAlign, wordIndex}
								<button
									class="flex flex-col items-center px-2 py-2 sm:px-3 sm:py-3 rounded-lg hover:bg-tile-500 hover:shadow-md transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-tile-600"
									onclick={async (e) => {
										e.stopPropagation();
										const cleanWord = wordAlign.arabic.replace(/[،,]/g, '');

										setActiveWord({
											english: '',
											arabic: '',
											transliterated: '',
											description: '',
											isLoading: true,
											type: ''
										});

										isModalOpen = true;

										try {
											const res = await fetch('/api/definition-sentence', {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({
													word: cleanWord,
													type: 'arabic',
													sentence: {
														arabic: sentence.arabic.text,
														english: sentence.english.text,
														transliteration: sentence.transliteration.text
													},
													dialect: 'egyptian-arabic'
												})
											});

											const data = await res.json();

											setActiveWord({
												english: wordAlign.english,
												arabic: cleanWord,
												transliterated: wordAlign.transliteration,
												description: data.message?.message?.content || '',
												isLoading: false,
												type: 'arabic'
											});
										} catch (err) {
											console.error('Error fetching definition:', err);
											setActiveWord({
												english: wordAlign.english,
												arabic: cleanWord,
												transliterated: wordAlign.transliteration,
												description: '',
												isLoading: false,
												type: 'arabic'
											});
										}
									}}
								>
									<!-- Transliteration (top) -->
									{#if showTransliteration}
										<span class="text-xs sm:text-sm text-text-200 italic mb-0.5 opacity-75 group-hover:opacity-100 transition-opacity">
											{wordAlign.transliteration}
										</span>
									{/if}
									<!-- English (middle) -->
									{#if showEnglish}
										<span class="text-xs sm:text-sm text-text-200 mb-1 opacity-90 group-hover:opacity-100 transition-opacity">
											{wordAlign.english}
										</span>
									{/if}
									<!-- Arabic (bottom, largest) -->
									<span class="text-xl sm:text-2xl md:text-3xl font-semibold text-text-300">
										{wordAlign.arabic}
									</span>
								</button>
							{/each}
						</div>
					{:else}
						<!-- Fallback: Sentence-level display for older stories without word alignments -->
						{#if showTransliteration}
							<p class="text-base sm:text-lg text-text-200 italic text-center mb-3 leading-relaxed">
								{sentence.transliteration?.text || ''}
							</p>
						{/if}

						<!-- Arabic words - clickable for definitions -->
						<div class="flex flex-wrap gap-2 sm:gap-3 justify-center" dir="rtl">
							{#each arabicWords as arabicWord, wordIndex}
								<button
									class="px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-tile-500 hover:shadow-md transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-tile-600 text-xl sm:text-2xl md:text-3xl font-semibold text-text-300"
									onclick={async (e) => {
										e.stopPropagation();
										const cleanWord = arabicWord.replace(/[،,]/g, '');

										setActiveWord({
											english: '',
											arabic: '',
											transliterated: '',
											description: '',
											isLoading: true,
											type: ''
										});

										isModalOpen = true;

										try {
											const res = await fetch('/api/definition-sentence', {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({
													word: cleanWord,
													type: 'arabic',
													sentence: {
														arabic: sentence.arabic.text,
														english: sentence.english.text,
														transliteration: sentence.transliteration.text
													},
													dialect: 'egyptian-arabic'
												})
											});

											const data = await res.json();

											setActiveWord({
												english: '',
												arabic: cleanWord,
												transliterated: '',
												description: data.message?.message?.content || '',
												isLoading: false,
												type: 'arabic'
											});
										} catch (err) {
											console.error('Error fetching definition:', err);
											setActiveWord({
												english: '',
												arabic: cleanWord,
												transliterated: '',
												description: '',
												isLoading: false,
												type: 'arabic'
											});
										}
									}}
								>
									{arabicWord}
								</button>
							{/each}
						</div>
					{/if}

					<!-- Footer with sentence number and audio -->
					<div class="mt-4 pt-3 border-t border-tile-600 flex items-center justify-between">
						<span class="text-xs text-text-200">Sentence {sentenceIndex + 1} of {sentences.length}</span>
						{#if sentence.arabic?.audio}
							<Audio src={sentence.arabic.audio}></Audio>
						{:else}
							<AudioButton text={sentence.arabic.text} dialect="egyptian-arabic" />
						{/if}
					</div>
				</section>
			{/each}
		</div>
{/if}
