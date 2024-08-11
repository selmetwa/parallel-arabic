<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { type sentenceObjectGroup, type sentenceObjectItem } from '$lib/types/index';
	import RadioButton from '$lib/components/RadioButton.svelte';
  import SaveButton from '$lib/components/SaveButton.svelte';

	export let index = 0;

	export let sentences: sentenceObjectItem[];

	$: isCorrect = false;
	$: isIncorrect = false;
	$: showHint = false;
	$: showAnswer = false;
	$: selectedObj = {} as sentenceObjectItem;
	$: selected = null;

	function shuffleArray(array: any) {
		const _arr = [...array];
		for (let i = _arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[_arr[i], _arr[j]] = [_arr[j], _arr[i]];
		}
		return _arr;
	}

	$: sentenceObj = {} as sentenceObjectGroup;
	let targetSentence = sentences.slice(1)[0];
	let shuffledWords = shuffleArray(
		sentences.slice(1).filter((w: any) => targetSentence.english !== w.english)
	);
	let shuffledAnswers = shuffleArray([
		targetSentence,
		shuffledWords[0],
		shuffledWords[1],
		shuffledWords[2]
	]);
	$: {
		if (sentences.length > index) {
			targetSentence = sentences.slice(1)[index];
			shuffledWords = shuffleArray(sentences.slice(1));
			shuffledAnswers = shuffleArray([
				targetSentence,
				shuffledWords[0],
				shuffledWords[1],
				shuffledWords[2]
			]);

			if (shuffledAnswers) {
				sentenceObj.answer = targetSentence;
				sentenceObj.first = shuffledAnswers[0];
				sentenceObj.second = shuffledAnswers[1];
				sentenceObj.third = shuffledAnswers[2];
				sentenceObj.fourth = shuffledAnswers[3];
			}
		}
	}

	function getObjectByEnglishValue(data: sentenceObjectGroup, englishValue: string) {
		for (let key in data) {
			if (data[key].english === englishValue) {
				return data[key];
			}
		}
		return {} as sentenceObjectItem;
	}

	function handleClick(e: any) {
		const value = e.target.value;
		selected = value;

		selectedObj = getObjectByEnglishValue(sentenceObj, value);

		if (selected === sentenceObj.answer.english) {
			isCorrect = true;
			isIncorrect = false;
		} else {
			isIncorrect = true;
			isCorrect = false;
		}
	}

	$: if (sentenceObj) {
      selectedObj = {} as sentenceObjectItem;
			showHint = false;
			selected = null;
			isCorrect = false;
			isIncorrect = false;	}
</script>

<section class="px-4 sm:px-16">
{#if sentenceObj}
	{#if isCorrect}
		<div
			class="flex w-full flex-row items-center mt-5 justify-center gap-2 bg-green-100 py-2 transition-all duration-300"
		>
			<span class="text-lg font-semibold text-text-300">
				{sentenceObj.answer.arabic} is correct
			</span>
		</div>
	{/if}
	{#if isIncorrect}
		<div
			class="flex w-full flex-row items-center justify-center gap-2 bg-red-100 py-2 transition-all duration-300"
		>
			<span class="text-lg font-semibold text-text-300">
				{selectedObj.arabic} is incorrect
			</span>
		</div>
	{/if}
	<div class="mt-10 flex w-full flex-col sm:flex-row gap-2 sm:w-fit">
		<Button onClick={() => (showHint = !showHint)} type="button">Show Hint</Button>
		<Button onClick={() => (showAnswer = !showAnswer)} type="button">Show Answer</Button>
    <SaveButton type="sentence" objectToSave={{
					arabic: sentenceObj.answer.arabic,
					english: sentenceObj.answer.english,
					transliterated: sentenceObj.answer.transliteration
				}}></SaveButton>
	</div>

  <section class="">
	<div class="mt-6">
		<div class="flex flex-col items-center justify-center gap-2">
			<h1 class="w-fit text-[40px] font-bold text-text-300">{sentenceObj.answer.english}</h1>
			{#if showHint}
				<p class="w-fit text-[25px] text-text-300">({sentenceObj.answer.transliteration})</p>
			{/if}
			{#if showAnswer}
				<p class="w-fit text-[25px] text-text-300">({sentenceObj.answer.arabic})</p>
			{/if}
		</div>
	</div>
	<fieldset class="grid grid-cols-1 grid-rows-1 gap-3 sm:grid-cols-2 sm:grid-rows-2 mt-4">
		<RadioButton
			text={sentenceObj.first.arabic}
			value={sentenceObj.first.english}
			isSelected={selected === sentenceObj.first.english}
			onClick={handleClick}
			selectableFor={sentenceObj.first.english}
		/>
		<RadioButton
			text={sentenceObj.second.arabic}
			value={sentenceObj.second.english}
			isSelected={selected === sentenceObj.second.english}
			onClick={handleClick}
			selectableFor={sentenceObj.second.english}
		/>
		<RadioButton
			text={sentenceObj.third.arabic}
			onClick={handleClick}
			value={sentenceObj.third.english}
			isSelected={selected === sentenceObj.third.english}
			selectableFor={sentenceObj.third.english}
		/>
		<RadioButton
			text={sentenceObj.fourth.arabic}
			value={sentenceObj.fourth.english}
			isSelected={selected === sentenceObj.fourth.english}
			selectableFor={sentenceObj.fourth.english}
			onClick={handleClick}
		/>
	</fieldset>
</section>
{/if}
</section>