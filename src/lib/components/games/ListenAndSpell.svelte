<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import GameWordList from './GameWordList.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { missedNote, saveMissedWords } from '$lib/games/save-missed';
	import { MIN_RECORDED, buildRound, recordedWords } from '$lib/games/listen-and-spell';
	import type { GameWord } from '$lib/games/word-pool';
	import type { RoundGate } from '$lib/games/free-rounds.svelte';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		pool: GameWord[];
		dialect: GameDialect;
		gate: RoundGate;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
		onStart?: () => void;
	}

	let { pool, dialect, gate, signedIn, isSubscribed, accent, deep, onStart }: Props = $props();

	const enough = $derived(recordedWords(pool).length >= MIN_RECORDED);

	let questions = $state(untrack(() => buildRound(pool)));
	let index = $state(0);
	let picked = $state<number | null>(null);
	let outcomes = $state<Record<string, boolean>>({});
	let started = $state(false);
	let xpEarned = $state(0);
	let announcement = $state('');
	let savedMissed = $state(0);
	let audio: HTMLAudioElement | null = null;

	const question = $derived(questions[index]);
	const done = $derived(index >= questions.length);
	const score = $derived(Object.values(outcomes).filter(Boolean).length);
	const words = $derived(questions.map((q) => q.word));

	onDestroy(() => audio?.pause());

	function beginRound() {
		if (started) return true;
		if (!gate.tryStartRound()) return false;
		started = true;
		onStart?.();
		return true;
	}

	function play() {
		if (!question?.word.audioUrl || !beginRound()) return;
		audio?.pause();
		audio = new Audio(question.word.audioUrl);
		audio.play().catch(() => {});
	}

	function pick(i: number) {
		if (picked !== null || !beginRound()) return;
		picked = i;
		const right = i === question.answer;
		outcomes[question.word.id] = right;
		announcement = right
			? `Correct: ${question.word.arabic}, ${question.word.english}`
			: `The word was ${question.word.arabic}, ${question.word.english}`;
		if (right && signedIn) {
			awardGameXp();
			xpEarned++;
		}
	}

	function next() {
		index++;
		picked = null;
		announcement = '';
		if (index >= questions.length && signedIn) {
			const missed = words.filter((w) => outcomes[w.id] === false);
			if (missed.length) saveMissedWords(missed, dialect).then((n) => (savedMissed = n));
		}
		// Started rounds play each new word straight away.
		if (index < questions.length) queueMicrotask(play);
	}

	function playAgain() {
		if (!gate.canStart()) {
			gate.block();
			return;
		}
		questions = buildRound(pool, { avoid: new Set(words.map((w) => w.id)) });
		index = 0;
		picked = null;
		outcomes = {};
		started = false;
		xpEarned = 0;
		savedMissed = 0;
		announcement = '';
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if !enough}
	<p class="empty">This theme doesn't have enough recorded words yet. Pick another theme.</p>
{:else if done}
	<GameResults
		heading="{score} of {questions.length} heard right"
		stats={[{ label: 'Right', value: `${score}/${questions.length}` }]}
		{xpEarned}
		note={missedNote(savedMissed)}
		{accent}
		{deep}
		onPlayAgain={playAgain}
		playAgainLabel="Next set"
	>
		<GameWordList {words} {dialect} {isSubscribed} {signedIn} {outcomes} />
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">Word {index + 1} of {questions.length}</p>

		<button type="button" class="listen" onclick={play}>
			<span class="icon" aria-hidden="true">🔊</span>
			{started ? 'Play again' : 'Play the word'}
		</button>
		<p class="ask">Which spelling did you hear?</p>

		<div class="options" dir="rtl">
			{#each question.options as option, i (option)}
				<button
					type="button"
					class="option"
					lang="ar"
					class:right={picked !== null && i === question.answer}
					class:wrong={picked === i && i !== question.answer}
					disabled={picked !== null}
					onclick={() => pick(i)}>{option}</button
				>
			{/each}
		</div>

		{#if picked !== null}
			<div class="reveal" class:ok={picked === question.answer}>
				<p class="verdict">
					{picked === question.answer ? '✓ Correct!' : '✗ Not this time.'}
				</p>
				<p class="word">
					<span class="ar" lang="ar" dir="rtl">{question.word.arabic}</span>
					{#if question.word.transliteration}
						<span class="tr">{question.word.transliteration}</span>
					{/if}
					<span class="en">{question.word.english}</span>
				</p>
				<PressButton onclick={next} {accent} {deep}>
					{index + 1 < questions.length ? 'Next word' : 'See results'}
				</PressButton>
			</div>
		{/if}
	</div>
{/if}

<style>
	.empty {
		margin-top: 1.5rem;
		font-size: 0.95rem;
		color: var(--text2);
	}

	.game {
		display: grid;
		gap: 0.9rem;
	}

	.progress {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.listen {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		min-height: 4rem;
		border-radius: 1.25rem;
		font-size: 1.05rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 4px 0 var(--deep);
		cursor: pointer;
	}

	.listen:active {
		transform: translateY(4px);
		box-shadow: none;
	}

	.listen:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 3px;
	}

	.icon {
		font-size: 1.5rem;
	}

	.ask {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.65rem;
	}

	.option {
		min-height: 5rem;
		border-radius: 1.1rem;
		font-size: clamp(1.6rem, 6vw, 2rem);
		font-weight: 600;
		color: var(--text1);
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: var(--tile3);
		box-shadow: 0 4px 0 color-mix(in srgb, var(--deep) 55%, transparent);
		cursor: pointer;
		transition: transform 0.12s ease;
	}

	.option:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.option:disabled {
		cursor: default;
		box-shadow: none;
	}

	.option:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.option.right {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 18%, var(--tile3));
	}

	.option.wrong {
		border-color: #f43f5e;
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	.reveal {
		display: grid;
		justify-items: start;
		gap: 0.6rem;
		border-radius: 1.1rem;
		border: 2px solid #f43f5e;
		background: color-mix(in srgb, #f43f5e 8%, var(--tile3));
		padding: 1rem 1.1rem;
	}

	.reveal.ok {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 10%, var(--tile3));
	}

	.verdict {
		font-weight: 600;
		color: var(--text1);
	}

	.word {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem 0.8rem;
	}

	.word .ar {
		font-size: 1.6rem;
		font-weight: 600;
		color: var(--text1);
	}

	.tr {
		font-style: italic;
		color: var(--text2);
	}

	.en {
		font-weight: 600;
		color: var(--text1);
	}

	@media (prefers-reduced-motion: reduce) {
		.option {
			transition: none;
		}
		.listen:active,
		.option:hover:not(:disabled) {
			transform: none;
		}
	}
</style>
