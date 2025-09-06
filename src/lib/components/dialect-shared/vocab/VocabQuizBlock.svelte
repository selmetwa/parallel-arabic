<script lang="ts">
	import RadioButton from '$lib/components/RadioButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { wordObjectItem, wordObjectGroup, Dialect } from '$lib/types';
	import SaveButton from '$lib/components/SaveButton.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';

	interface Props {
		next: () => void;
		wordObj: wordObjectGroup;
		dialect: Dialect;
	}

	let { wordObj, dialect }: Props = $props();

	let isCorrect = $state(false);
	let isIncorrect = $state(false);
	let selectedObj = $state({} as wordObjectItem);
	let selected = $state(null);
	let showHint = $state(false);
	let showQuestionInEnglish = $state(true);

	$effect(() => {
		selectedObj = {} as wordObjectItem;
	});

	$effect(() => {
		if (wordObj) {
			selectedObj = {} as wordObjectItem;
			showHint = false;
			selected = null;
			isCorrect = false;
			isIncorrect = false;
		}
	});

	function getObjectByEnglishValue(data: wordObjectGroup, englishValue: string) {
		for (let key in data) {
			if (data[key].english === englishValue) {
				return data[key];
			}
		}
		return {} as wordObjectItem;
	}

	function toggleHint() {
		showHint = !showHint;
	}

	function handleClick(e: any) {
		const value = e.target.value;
		selected = value;

		selectedObj = getObjectByEnglishValue(wordObj, value);

		if (selected === wordObj.answer.english) {
			isCorrect = true;
			isIncorrect = false;

			setTimeout(() => {
				// next();
			}, 1000);
		} else {
			isIncorrect = true;
			isCorrect = false;
		}
	}

	function toggleFormat() {
		showQuestionInEnglish = !showQuestionInEnglish;
	}
</script>

<section class="flex flex-col gap-4 py-8">
	<div class="flex flex-wrap items-center gap-2">
		<h2 class="text-3xl font-bold text-text-100">
			{showQuestionInEnglish ? wordObj.answer.english : wordObj.answer.arabic}
		</h2>
		{#if showHint}
			<p class="text-lg text-text-300">{wordObj.answer.transliteration}</p>
		{/if}
	</div>
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
		<Button type="button" onClick={toggleHint}>{showHint ? 'Hide' : 'Show'} hint</Button>
		<AudioButton text={wordObj.answer.arabic} {dialect} audioUrl={wordObj.answer.audioUrl}>Listen to Pronunciation</AudioButton>
		<SaveButton
			objectToSave={{
				arabic: wordObj.answer.arabic,
				english: wordObj.answer.english,
				transliterated: wordObj.answer.transliteration
			}}
			type="Word"
		></SaveButton>
		<Button type="button" onClick={toggleFormat}>Toggle Format</Button>
	</div>
	{#if isCorrect}
		<div
			class="flex w-full flex-row items-center justify-center gap-2 bg-green-100 py-2 transition-all duration-300"
		>
			<span class="text-lg font-semibold text-text-300">
				{#if showQuestionInEnglish}
					{wordObj.answer.arabic}
				{:else}
					{wordObj.answer.english}
				{/if} is correct
			</span>
		</div>
	{/if}
	{#if isIncorrect}
		<div
			class="flex w-full flex-row items-center justify-center gap-2 bg-red-100 py-2 transition-all duration-300"
		>
			<span class="text-lg font-semibold text-text-300">
				{#if showQuestionInEnglish}
					{selectedObj.arabic}
				{:else}
					{selectedObj.english}
				{/if} is incorrect
			</span>
		</div>
	{/if}
	<fieldset class="grid grid-cols-1 grid-rows-1 gap-3 sm:grid-cols-2 sm:grid-rows-2">
		<RadioButton
			text={showQuestionInEnglish ? wordObj.first.arabic : wordObj.first.english}
			value={wordObj.first.english}
			isSelected={selected === wordObj.first.english}
			onClick={handleClick}
			selectableFor={wordObj.first.english}
		/>
		<RadioButton
			text={showQuestionInEnglish ? wordObj.second.arabic : wordObj.second.english}
			value={wordObj.second.english}
			isSelected={selected === wordObj.second.english}
			onClick={handleClick}
			selectableFor={wordObj.second.english}
		/>
		<RadioButton
			text={showQuestionInEnglish ? wordObj.third.arabic : wordObj.third.english}
			onClick={handleClick}
			value={wordObj.third.english}
			isSelected={selected === wordObj.third.english}
			selectableFor={wordObj.third.english}
		/>
		<RadioButton
			text={showQuestionInEnglish ? wordObj.fourth.arabic : wordObj.fourth.english}
			value={wordObj.fourth.english}
			isSelected={selected === wordObj.fourth.english}
			selectableFor={wordObj.fourth.english}
			onClick={handleClick}
		/>
	</fieldset>
</section>
