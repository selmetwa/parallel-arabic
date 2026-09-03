<script lang="ts">
	import { resolve } from '$app/paths';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import QuizWordBlock from './QuizWordBlock.svelte';
	import SpeakWordBlock from './SpeakWordBlock.svelte';
	import { buildMultipleChoice, type MultipleChoice } from '$lib/utils/quiz-questions';
	import { checkMediaRecorderSupport } from '$lib/utils/pronunciation';
	import type { PracticeWord } from '$lib/types/words';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		words: PracticeWord[];
		dialect: Dialect;
		/** "Numbers", "Food and drink" — used in the heading and the CTA. */
		topicLabel: string;
		isSubscribed?: boolean;
		/**
		 * Where subscribers go to keep practicing the whole set. A plain URL
		 * rather than a resolve() route id, because callers append query params
		 * (`/learn/game/play?dialect=…&category=…`).
		 */
		practiceHref?: string;
	}

	let {
		words,
		dialect,
		topicLabel,
		isSubscribed = false,
		practiceHref = resolve('/learn/game')
	}: Props = $props();

	/** A multiple-choice question needs an answer plus three distractors. */
	const MIN_WORDS = 4;
	const ROUND_LENGTH = 8;

	type Question =
		| { kind: 'quiz'; word: PracticeWord; choice: MultipleChoice }
		| { kind: 'speak'; word: PracticeWord };

	let started = $state(false);
	let index = $state(0);
	let score = $state(0);
	let showPaywall = $state(false);
	/**
	 * Set when the browser can't record, the mic is denied, or the free
	 * speaking allowance runs out. Remaining speaking slots become quiz
	 * questions so the round always finishes.
	 */
	let speakingOff = $state(false);
	let questions = $state<Question[]>([]);

	const enoughWords = $derived(words.length >= MIN_WORDS);
	const current = $derived(questions[index]);
	const finished = $derived(started && index >= questions.length);

	function quizAt(word: PracticeWord): Question {
		return {
			kind: 'quiz',
			word,
			choice: buildMultipleChoice(
				{ arabic_word: word.arabic, english_word: word.english },
				words.map((w) => ({ arabic_word: w.arabic, english_word: w.english }))
			)
		};
	}

	function start() {
		if (!checkMediaRecorderSupport()) speakingOff = true;

		const picked = [...words].sort(() => Math.random() - 0.5).slice(0, ROUND_LENGTH);

		// Multiple choice first, so the round opens without asking for a
		// microphone; speaking alternates in from the second question.
		questions = picked.map((word, i) =>
			i % 2 === 1 && !speakingOff ? { kind: 'speak' as const, word } : quizAt(word)
		);

		index = 0;
		score = 0;
		started = true;
	}

	function advance(correct: boolean) {
		if (correct) score += 1;
		index += 1;
	}

	/**
	 * Swap every remaining speaking question for a multiple-choice one, the
	 * current one included. Called when the mic is denied, unsupported, or the
	 * free speaking allowance runs out — the learner shouldn't be left staring
	 * at a question they have no way to answer.
	 */
	function disableSpeaking() {
		speakingOff = true;
		questions = questions.map((q, i) => (i >= index && q.kind === 'speak' ? quizAt(q.word) : q));
	}

	function restart() {
		started = false;
		index = 0;
		score = 0;
	}
</script>

{#if enoughWords}
	<section class="rounded-xl border-2 border-tile-600 bg-tile-400 p-6 sm:p-8">
		{#if !started}
			<h2 class="mb-2 text-2xl font-bold text-text-300">Practice {topicLabel}</h2>
			<p class="mb-5 text-text-200">
				{ROUND_LENGTH} questions, half of them spoken out loud. Free, no account needed.
			</p>
			<button
				type="button"
				onclick={start}
				class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Start practicing
			</button>
		{:else if finished}
			<h2 class="mb-2 text-2xl font-bold text-text-300">
				{score} out of {questions.length}
			</h2>
			<p class="mb-5 text-text-200">
				That's one round of {topicLabel.toLowerCase()}. There are {words.length} words in this set, and
				saving them to a review deck is what makes them stick.
			</p>
			<div class="flex flex-wrap gap-3">
				{#if isSubscribed}
					<a
						href={practiceHref}
						class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
					>
						Practice all {words.length} words
					</a>
				{:else}
					<button
						type="button"
						onclick={() => (showPaywall = true)}
						class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
					>
						Practice all {words.length} words
					</button>
				{/if}
				<a
					href={resolve('/tutor')}
					class="rounded-lg border border-tile-600 bg-tile-500 px-6 py-3 font-semibold text-text-300 transition-colors hover:bg-tile-600"
				>
					Try a conversation
				</a>
				<button
					type="button"
					onclick={restart}
					class="px-2 py-3 text-sm text-text-200 underline hover:text-text-300"
				>
					Go again
				</button>
			</div>
		{:else if current}
			<div class="mb-5 flex items-center justify-between text-sm text-text-200">
				<span>Question {index + 1} of {questions.length}</span>
				<span>{score} correct</span>
			</div>
			{#key index}
				{#if current.kind === 'quiz'}
					<QuizWordBlock word={current.word} choice={current.choice} {dialect} onResult={advance} />
				{:else}
					<SpeakWordBlock
						word={current.word}
						{dialect}
						onResult={advance}
						onUnavailable={disableSpeaking}
					/>
				{/if}
			{/key}
		{/if}
	</section>

	<PaywallModal isOpen={showPaywall} handleCloseModal={() => (showPaywall = false)} />
{/if}
