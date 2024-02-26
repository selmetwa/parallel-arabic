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
	const keyWords = data.formattedStory?.keyWords || [];

	let mode = Mode.SingleText;

	let isOpen = false;

	let root, doc;

	onMount(() => {
		root = document.documentElement;
		doc = document.firstElementChild;
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
		doc.setAttribute('color-scheme', e.target.value);
	};
</script>

<main class="h-full">
	<Drawer {isOpen} {handleCloseDrawer}>
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
					aria-label="radio-button-dark-theme"
					tabindex="0"
				/>
			</div>
		</form>
		<fieldset>
			<legend>Select Mode</legend>
			<ul class="flex flex-col gap-2">
				{#each modeOptions as option}
					<li>
						<label
							for={option.value}
							class="flex w-full flex-row items-center gap-4 p-2 text-base sm:cursor-pointer"
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
	</Drawer>

  <Header
		key={data.story[0].key}
    {handleOpenDrawer}
		{previousSentence}
		{nextSentence}
		{sentence}
	/>

	<section class="divide-tile-600 mt-8 flex flex-col divide-y">
		{#if mode === Mode.SentanceView}
			<Sentence sentence={sentences[sentence]} {mode} {keyWords} />
		{:else}
			{#each sentences as sentence}
				<Sentence {sentence} {mode} {keyWords} />
			{/each}
		{/if}
	</section>
</main>


