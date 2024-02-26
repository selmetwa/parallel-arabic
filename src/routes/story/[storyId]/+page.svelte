<script lang="ts">
	import { onMount } from 'svelte';

	import Sentence from './components/Sentence.svelte';
	import type { PageData } from './$types';
	import { Mode } from './types';
	import Header from './components/Header.svelte';
	import Drawer from '../../../components/Drawer.svelte';
	export let data: PageData;
	const sentences = data.formattedStory?.text || [];
	const sentencesLength = sentences.length || 0;
	let sentence = 0;

	let showEnglish = true;
	let showArabic = true;
	let showTransliterated = true;
	let showWordDetails = true;

	let mode = Mode.SingleText;

	let isOpen = true;

	let root, doc;

	onMount(() => {
		// Access document here
		root = document.documentElement;
		doc = document.firstElementChild;

		// Your code using root and doc here
	});

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

	function handleOpenDrawer() {
		isOpen = true;
	}

	function handleCloseDrawer() {
		isOpen = false;
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

	// function updateBlocksToShow(event: Event) {
	// 	const value = (event.target as HTMLInputElement).value;

	// 	switch (value) {
	// 		case 'english':
	// 			showEnglish = !showEnglish;
	// 			break;
	// 		case 'arabic':
	// 			showArabic = !showArabic;
	// 			break;
	// 		case 'transliterated':
	// 			showTransliterated = !showTransliterated;
	// 			break;
	// 		case 'word-details':
	// 			showWordDetails = !showWordDetails;
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// }

	const modeOptions = [
		{ value: 'single-text', text: 'Single Text' },
		{ value: 'bi-text', text: 'Bi Text' },
		{ value: 'sentence-view', text: 'Sentence View' }
	];

	const onHue = (e) => {
		localStorage.setItem('--brand-hue', e.target.value);
		root.style.setProperty('--brand-hue', e.target.value);
	};

	const onTheme = (e) => {
		const val = e.target.value;
		console.log({ val });
		localStorage.setItem('color-scheme', e.target.value);
    doc.setAttribute('color-scheme', e.target.value)
	};
</script>

<main class="h-full p-3">
	<div class="content input-wrapper">
		<input
			on:input={onHue}
			type="range"
			value="200"
			min="0"
			max="260"
			class="brand-hue-input"
			aria-label="hue-slider"
			tabindex="0"
			role="slider"
		/>
	</div>
	<form on:input={onTheme}>
		<div>
			<input
				checked
				type="radio"
				id="light"
				name="theme"
				value="light"
				class="radio-input"
				aria-label="radio-button-light-theme"
				tabindex="0"
			/>
		</div>
		<div>
			<input
				type="radio"
				id="dim"
				name="theme"
				value="dim"
				class="radio-input"
				aria-label="radio-button-dim-theme"
				tabindex="0"
			/>
		</div>
		<div>
			<input
				type="radio"
				id="dark"
				name="theme"
				value="dark"
				class="radio-input"
				aria-label="radio-button-dark-theme"
				tabindex="0"
			/>
		</div>
	</form>

	<div class="one"></div>
	<div class="two"></div>
	<div class="three"></div>
	<div class="four"></div>
	<div class="five"></div>
	<div class="six"></div>
	<fieldset>
		<legend>Select Mode</legend>
		<ul class="flex flex-col gap-2">
			{#each modeOptions as option}
				<li>
					<label
						for={option.value}
						class="flex w-full flex-row items-center gap-4 border border-raison p-2 text-base sm:cursor-pointer"
					>
						<input
							type="radio"
							name="mode"
							id={option.value}
							value={option.value}
							on:change={updateMode}
						/>
						<span
							class="select-none overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal"
							>{option.text}</span
						>
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>
	<button on:click={handleOpenDrawer}>open</button>

	<section class="mt-8 flex flex-col divide-y divide-raison">
		{#each sentences as sentence}
			<Sentence {sentence} {mode} />
		{/each}
	</section>
</main>

<!-- <Header
		key={data.story[0].key}
    {handleOpenDrawer}
		{previousSentence}
		{nextSentence}
		{sentence}
		{showArabic}
		{showEnglish}
		{showTransliterated}
		{showWordDetails}
		{updateBlocksToShow}
	/> -->

<style>
	.one {
		background-color: var(--tile1);
		height: 100px;
		width: 100px;
	}
	.two {
		background-color: var(--tile2);
		height: 100px;
		width: 100px;
	}
	.three {
		background-color: var(--tile3);
		height: 100px;
		width: 100px;
	}
	.four {
		background-color: var(--tile4);
		height: 100px;
		width: 100px;
	}
	.five {
		background-color: var(--tile5);
		height: 100px;
		width: 100px;
	}
	.six {
		background-color: var(--tile6);
		height: 100px;
		width: 100px;
	}
</style>
