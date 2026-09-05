<script lang="ts">
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import type { MultipleChoice } from '$lib/utils/quiz-questions';
	import type { PracticeWord } from '$lib/types/words';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		word: PracticeWord;
		choice: MultipleChoice;
		dialect: Dialect;
		onResult: (correct: boolean) => void;
	}

	let { word, choice, dialect, onResult }: Props = $props();

	let selected = $state<string | null>(null);

	const askingForEnglish = $derived(choice.type === 'arabic-to-english');
	const prompt = $derived(askingForEnglish ? word.arabic : word.english);
	const answered = $derived(selected !== null);
	const isCorrect = $derived(selected === choice.correctAnswer);

	function pick(option: string) {
		if (answered) return;
		selected = option;
	}
</script>

<div class="flex flex-col gap-5">
	<div class="text-center">
		<p class="mb-2 text-xs text-text-200">
			{askingForEnglish ? 'What does this mean?' : 'How do you say this?'}
		</p>
		<div class="flex items-center justify-center gap-3">
			<p class="text-4xl font-bold text-text-300" dir={askingForEnglish ? 'rtl' : 'ltr'}>
				{prompt}
			</p>
			{#if askingForEnglish}
				<InlineAudioButton text={word.arabic} {dialect} audioUrl={word.audioUrl ?? undefined} />
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		{#each choice.options as option (option)}
			{@const isAnswer = option === choice.correctAnswer}
			<button
				type="button"
				data-testid="quiz-option"
				disabled={answered}
				onclick={() => pick(option)}
				dir={askingForEnglish ? 'ltr' : 'rtl'}
				class="rounded-lg border-2 p-4 text-lg transition-colors
					{answered && isAnswer ? 'border-green-600 bg-green-100 text-green-900' : ''}
					{answered && !isAnswer && option === selected ? 'border-red-500 bg-red-100 text-red-900' : ''}
					{answered && !isAnswer && option !== selected
					? 'border-tile-500 bg-tile-300 text-text-200 opacity-60'
					: ''}
					{!answered
					? 'border-tile-500 bg-tile-300 text-text-300 hover:border-tile-600 hover:bg-tile-400'
					: ''}"
			>
				{option}
			</button>
		{/each}
	</div>

	{#if answered}
		<div class="flex flex-col items-center gap-3">
			<p class="text-lg font-semibold {isCorrect ? 'text-green-700' : 'text-text-300'}">
				{#if isCorrect}
					Correct
				{:else}
					{word.arabic} — {word.english}
				{/if}
			</p>
			{#if !isCorrect}
				<p class="text-sm italic text-text-200">{word.transliteration}</p>
			{/if}
			<button
				type="button"
				onclick={() => onResult(isCorrect)}
				class="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Continue
			</button>
		</div>
	{/if}
</div>
