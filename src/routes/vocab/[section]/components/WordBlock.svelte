<script lang="ts">
	import RadioButton from '$lib/components/RadioButton.svelte';
	import Button from '$lib/components/Button.svelte';
  import type { wordObjectItem, wordObjectGroup } from '$lib/types';
  import SaveButton from '$lib/components/SaveButton.svelte';

	export let next: () => void;

	export let wordObj: wordObjectGroup;

	$: isCorrect = false;
	$: isIncorrect = false;
	$: selectedObj = {} as wordObjectItem;
	$: selected = null;
	$: showHint = false;
	$: showQuestionInEnglish = true;

	$: {
		if (wordObj) {
      selectedObj = {} as wordObjectItem;
			showHint = false;
			selected = null;
			isCorrect = false;
			isIncorrect = false;
		}
	}

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
			{showQuestionInEnglish ? wordObj.answer.english : wordObj.answer.egyptianArabic}
		</h2>
		{#if showHint}
			<p class="text-lg text-text-300">{wordObj.answer.egyptianArabicTransliteration}</p>
		{/if}
	</div>
	<div class="flex flex-col min-[420px]:flex-row gap-2">
		<Button type="button" onClick={toggleHint}>{showHint ? 'Hide' : 'Show'} hint</Button>
     <SaveButton objectToSave={{
      arabic: wordObj.answer.egyptianArabic,
      english: wordObj.answer.english,
      transliterated: wordObj.answer.egyptianArabicTransliteration
    }} type="Word"></SaveButton>
		<Button type="button" onClick={toggleFormat}>Toggle Format</Button>
	</div> 
	{#if isCorrect}
		<div
			class="flex w-full flex-row items-center justify-center gap-2 bg-green-100 py-2 transition-all duration-300"
		>
			<span class="text-lg font-semibold text-text-300">
        {#if showQuestionInEnglish}
          {wordObj.answer.egyptianArabic}
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
			<span class="text-lg font-semibold text-text-300"
				>
        {#if showQuestionInEnglish}
          {selectedObj.egyptianArabic}
        {:else}
          {selectedObj.english}
        {/if} is incorrect
      </span
			>
		</div>
	{/if}
	<fieldset class="grid grid-rows-1 grid-cols-1 sm:grid-rows-2 sm:grid-cols-2 gap-3">
		<RadioButton
			text={showQuestionInEnglish ? wordObj.first.egyptianArabic : wordObj.first.english}
			value={wordObj.first.english}
			isSelected={selected === wordObj.first.english}
			onClick={handleClick}
			selectableFor={wordObj.first.english}
		/>
		<RadioButton
			text={showQuestionInEnglish ? wordObj.second.egyptianArabic : wordObj.second.english}
			value={wordObj.second.english}
			isSelected={selected === wordObj.second.english}
			onClick={handleClick}
			selectableFor={wordObj.second.english}
		/>
		<RadioButton
			text={showQuestionInEnglish ? wordObj.third.egyptianArabic : wordObj.third.english}
			onClick={handleClick}
			value={wordObj.third.english}
			isSelected={selected === wordObj.third.english}
			selectableFor={wordObj.third.english}
		/>
		<RadioButton
			text={showQuestionInEnglish ? wordObj.fourth.egyptianArabic : wordObj.fourth.english}
			value={wordObj.fourth.english}
			isSelected={selected === wordObj.fourth.english}
			selectableFor={wordObj.fourth.english}
			onClick={handleClick}
		/>
	</fieldset>
</section>
