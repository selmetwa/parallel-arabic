<script lang="ts">
	import { onMount } from 'svelte';

	import Sentence from './components/Sentence.svelte';
	import type { PageData } from './$types';
	import { Mode } from './types';
	import Header from './components/Header.svelte';
	import Drawer from '../../../components/Drawer.svelte';
	import Button from '../../../components/Button.svelte';

	export let data: PageData;
	const sentences = data.formattedStory?.text || [];
	const sentencesLength = sentences.length || 0;
	const keyWords = data.formattedStory?.keyWords || [];


	let sentence = 0;
	let mode = Mode.SentanceView;

	let isOpen = false;

	let root: HTMLElement | null;
  let doc: Element | null;

	onMount(() => {
		root = document.documentElement;
		doc = document.firstElementChild || null;
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

	const onHue = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;

		localStorage.setItem('--brand-hue', value);
		root?.style.setProperty('--brand-hue', value);
	};

	const onTheme = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;

		localStorage.setItem('color-scheme',value);
		doc?.setAttribute('color-scheme',value);
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

	<Header {handleOpenDrawer} />

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
