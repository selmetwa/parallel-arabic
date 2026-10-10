<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { buildRound } from '$lib/games/harakat-pick';
	import { playClip, stopClip } from '$lib/games/room-hunt/audio';
	import type { GameWord } from '$lib/games/word-pool';

	interface Props {
		/** Recorded, fully voweled words (Room Hunt's Fusha set). */
		words: GameWord[];
		dialect: string;
		signedIn: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
	}

	let { words, dialect, signedIn, accent, deep, onPlayAgain }: Props = $props();

	let questions = $state(untrack(() => buildRound(words)));
	let index = $state(0);
	let picked = $state<number | null>(null);
	let missed = $state<GameWord[]>([]);
	let score = $state(0);
	let xpEarned = $state(0);
	let announcement = $state('');

	const question = $derived(questions[index]);
	const done = $derived(index >= questions.length);

	function listen() {
		if (question) playClip(question.word.audioUrl!);
	}

	onMount(listen);
	onDestroy(stopClip);

	function pick(i: number) {
		if (picked !== null) return;
		picked = i;
		const right = i === question.answer;
		if (right) {
			score++;
			if (signedIn) awardGameXp();
			xpEarned++;
		} else {
			missed = [...missed, question.word];
		}
		announcement = right
			? `Correct: ${question.word.transliteration}`
			: `Not quite. It's ${question.word.transliteration}.`;
	}

	function next() {
		index++;
		picked = null;
		announcement = '';
		listen();
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done}
	<GameResults
		heading="{score} of {questions.length} words"
		stats={[{ label: 'Right', value: `${score}/${questions.length}` }]}
		{xpEarned}
		{signedIn}
		missedWords={missed}
		{dialect}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	>
		{#if missed.length}
			<h3 class="list-title">Words to hear again</h3>
			<ul class="missed">
				{#each missed as word (word.id)}
					<li>
						<button type="button" class="missed-word" onclick={() => playClip(word.audioUrl!)}>
							<span class="ar" lang="ar" dir="rtl">{word.arabic}</span>
							<span class="name">{word.transliteration} · {word.english} 🔊</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">Word {index + 1} of {questions.length}</p>

		<p class="ask">Listen, then pick the spelling with the right vowels.</p>
		<button type="button" class="prompt" onclick={listen}>
			<span aria-hidden="true">🔊</span>
			<span class="meaning">{question.word.english}</span>
			<span class="sr-only">Play the word again</span>
		</button>

		<div class="options">
			{#each question.options as option, i (i)}
				<button
					type="button"
					class="option"
					lang="ar"
					dir="rtl"
					class:right={picked !== null && i === question.answer}
					class:wrong={picked === i && i !== question.answer}
					disabled={picked !== null}
					onclick={() => pick(i)}
				>
					{option}
				</button>
			{/each}
		</div>

		{#if picked !== null}
			<div class="reveal" class:ok={picked === question.answer}>
				<p class="verdict">
					{picked === question.answer ? '✓ Correct!' : '✗ Not this time.'}
					It's <strong>{question.word.transliteration}</strong>:
					<span class="answer" lang="ar" dir="rtl">{question.word.arabic}</span>
				</p>
				<PressButton onclick={next} {accent} {deep}>
					{index + 1 < questions.length ? 'Next word' : 'See results'}
				</PressButton>
			</div>
		{/if}
	</div>
{/if}

<style>
	.game {
		display: grid;
		gap: 0.9rem;
	}

	.progress {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.ask {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text1);
	}

	.prompt {
		display: grid;
		place-items: center;
		gap: 0.3rem;
		min-height: 6.5rem;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
		font-size: 2.4rem;
		color: var(--text1);
		cursor: pointer;
	}

	.prompt:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.meaning {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text2);
	}

	.options {
		display: grid;
		gap: 0.6rem;
	}

	@media (min-width: 560px) {
		.options {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Large, so the vowel marks are easy to tell apart. */
	.option {
		min-height: 5rem;
		border-radius: 1.1rem;
		font-size: 2.3rem;
		line-height: 1.6;
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
		color: var(--text1);
	}

	.answer {
		font-size: 1.5rem;
	}

	.list-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
		margin-bottom: 0.6rem;
	}

	.missed {
		display: grid;
		gap: 0.45rem;
	}

	.missed-word {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.55rem 0.8rem;
		cursor: pointer;
	}

	.ar {
		font-size: 1.6rem;
		color: var(--text1);
	}

	.name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	@media (prefers-reduced-motion: reduce) {
		.option {
			transition: none;
		}
		.option:hover:not(:disabled) {
			transform: none;
		}
	}
</style>
