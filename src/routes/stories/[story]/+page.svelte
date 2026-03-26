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
	import ArabicWordDisplay from '$lib/components/dialect-shared/story/components/ArabicWordDisplay.svelte';
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

	// Per-sentence overrides (null = follow global)
	let sentenceOverrides = $state<Record<number, { english: boolean; transliteration: boolean }>>({});

	function getSentenceEnglish(i: number) {
		return sentenceOverrides[i]?.english ?? showEnglish;
	}
	function getSentenceTransliteration(i: number) {
		return sentenceOverrides[i]?.transliteration ?? showTransliteration;
	}
	function toggleSentenceEnglish(i: number) {
		sentenceOverrides = {
			...sentenceOverrides,
			[i]: {
				english: !(sentenceOverrides[i]?.english ?? showEnglish),
				transliteration: sentenceOverrides[i]?.transliteration ?? showTransliteration
			}
		};
	}
	function toggleSentenceTransliteration(i: number) {
		sentenceOverrides = {
			...sentenceOverrides,
			[i]: {
				english: sentenceOverrides[i]?.english ?? showEnglish,
				transliteration: !(sentenceOverrides[i]?.transliteration ?? showTransliteration)
			}
		};
	}

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

	<!-- Sentences -->
	<div class="space-y-6 px-4 py-6">
		{#each sentences as sentence, sentenceIndex}
			{@const sentenceEnglish = getSentenceEnglish(sentenceIndex)}
			{@const sentenceTransliteration = getSentenceTransliteration(sentenceIndex)}

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

				<!-- English translation with drag-to-select -->
				{#if sentenceEnglish}
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

				<!-- Arabic word display with drag-and-define -->
				{#if !sentence.wordAlignments?.length && sentenceTransliteration}
					<p class="text-base sm:text-lg text-text-200 italic text-center mb-3 leading-relaxed">
						{sentence.transliteration?.text || ''}
					</p>
				{/if}

				<ArabicWordDisplay
					{sentence}
					{setActiveWord}
					dialect="egyptian-arabic"
					showEnglish={sentenceEnglish}
					showTransliteration={sentenceTransliteration}
				/>

				<!-- Footer with sentence number, per-sentence toggles, and audio -->
				<div class="mt-4 pt-3 border-t border-tile-600 flex items-center justify-between">
					<span class="text-xs text-text-200">Sentence {sentenceIndex + 1} of {sentences.length}</span>
					<div class="flex items-center gap-3">
						<button
							onclick={() => toggleSentenceEnglish(sentenceIndex)}
							title={sentenceEnglish ? 'Hide English' : 'Show English'}
							class={sentenceEnglish ? "text-xs opacity-40 hover:opacity-70 transition-opacity" : "text-xs opacity-20 hover:opacity-50 line-through transition-opacity"}
						>EN</button>
						<button
							onclick={() => toggleSentenceTransliteration(sentenceIndex)}
							title={sentenceTransliteration ? 'Hide transliteration' : 'Show transliteration'}
							class={sentenceTransliteration ? "text-xs opacity-40 hover:opacity-70 transition-opacity" : "text-xs opacity-20 hover:opacity-50 line-through transition-opacity"}
						>Trans</button>
						{#if sentence.arabic?.audio}
							<Audio src={sentence.arabic.audio}></Audio>
						{:else}
							<AudioButton text={sentence.arabic.text} dialect="egyptian-arabic" />
						{/if}
					</div>
				</div>
			</section>
		{/each}
	</div>
{/if}
