<script lang="ts">
	import { untrack } from 'svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import {
		isCorrectOrder,
		scrambleWords,
		wrongPositions,
		type ScrambleSentence
	} from '$lib/games/sentence-scramble';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		sentences: ScrambleSentence[];
		dialect: GameDialect;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
		/** The on-page sample: one sentence, no XP, no results card. */
		demo?: boolean;
	}

	let {
		sentences,
		dialect,
		signedIn,
		isSubscribed,
		accent,
		deep,
		onPlayAgain,
		demo = false
	}: Props = $props();

	// Re-mounted (via {#key}) for each new round, so the first list is the one to use.
	let index = $state(0);
	let tokens = $state(untrack(() => scrambleWords(sentences[0].words)));
	let answer = $state<number[]>([]);
	let status = $state<'playing' | 'wrong' | 'solved' | 'revealed'>('playing');
	let missedOnce = $state(false);
	let outcomes = $state<boolean[]>([]);
	let xpEarned = $state(0);
	let announcement = $state('');

	const sentence = $derived(sentences[index]);
	const done = $derived(index >= sentences.length);
	const answerWords = $derived(answer.map((id) => tokens.find((t) => t.id === id)!.word));
	const wrong = $derived(status === 'wrong' ? wrongPositions(answerWords, sentence.words) : []);
	const finished = $derived(status === 'solved' || status === 'revealed');
	const score = $derived(outcomes.filter(Boolean).length);

	function add(id: number) {
		if (finished || answer.includes(id)) return;
		answer = [...answer, id];
		status = 'playing';
		if (answer.length === tokens.length) check();
	}

	function remove(id: number) {
		if (finished) return;
		answer = answer.filter((a) => a !== id);
		status = 'playing';
	}

	function check() {
		if (isCorrectOrder(answerWords, sentence.words)) {
			status = 'solved';
			outcomes[index] = !missedOnce;
			announcement = `Correct: ${sentence.english}`;
			if (!missedOnce && signedIn && !demo) {
				awardGameXp();
				xpEarned++;
			}
		} else {
			status = 'wrong';
			missedOnce = true;
			announcement = 'Not quite. The highlighted words are out of place.';
		}
	}

	function reset() {
		answer = [];
		status = 'playing';
	}

	function reveal() {
		status = 'revealed';
		outcomes[index] = false;
		announcement = `The sentence was ${sentence.arabic}`;
	}

	function next() {
		index++;
		if (index < sentences.length) {
			tokens = scrambleWords(sentences[index].words);
			answer = [];
			status = 'playing';
			missedOnce = false;
			announcement = '';
		}
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done && !demo}
	<GameResults
		heading="{score} of {sentences.length} sentences on the first try"
		stats={[{ label: 'First try', value: `${score}/${sentences.length}` }]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	>
		<h3 class="list-title">The sentences</h3>
		<ul class="list">
			{#each sentences as s, i (i)}
				<li class="row">
					<span class="mark" class:ok={outcomes[i]}>{outcomes[i] ? '✓' : '✗'}</span>
					<span class="text">
						<span class="ar" lang="ar" dir="rtl">{s.arabic}</span>
						<span class="en">{s.english}</span>
					</span>
					{#if isSubscribed}<AudioButton text={s.arabic} {dialect} />{/if}
				</li>
			{/each}
		</ul>
	</GameResults>
{:else if done}
	<p class="demo-done">
		That's the idea. Premium gives you a fresh round of sentences at your level every time.
	</p>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		{#if !demo}
			<p class="progress">Sentence {index + 1} of {sentences.length}</p>
		{:else}
			<p class="progress">Sample sentence</p>
		{/if}

		<div class="prompt">
			<span class="prompt-label">Say this in Arabic</span>
			<span class="prompt-text">{sentence.english}</span>
		</div>

		<div
			class="answer"
			class:solved={status === 'solved'}
			class:wrong={status === 'wrong'}
			dir="rtl"
			lang="ar"
			aria-label="Your sentence"
		>
			{#if finished}
				<span class="full">{sentence.arabic}</span>
			{:else if answer.length === 0}
				<span class="placeholder">Tap the words in order</span>
			{:else}
				{#each answer as id, i (id)}
					<button
						type="button"
						class="chip placed"
						class:off={wrong.includes(i)}
						onclick={() => remove(id)}
						aria-label="Remove {tokens.find((t) => t.id === id)?.word}"
						>{tokens.find((t) => t.id === id)?.word}</button
					>
				{/each}
			{/if}
		</div>

		{#if finished}
			<div class="reveal">
				<p class="verdict">
					{status === 'solved'
						? missedOnce
							? 'Got it on a second try.'
							: 'Correct!'
						: 'Here it is.'}
				</p>
				{#if sentence.transliteration}<p class="translit">{sentence.transliteration}</p>{/if}
				{#if isSubscribed}<AudioButton text={sentence.arabic} {dialect} />{/if}
				<PressButton onclick={next} {accent} {deep}>
					{demo ? 'Done' : index + 1 < sentences.length ? 'Next sentence' : 'See results'}
				</PressButton>
			</div>
		{:else}
			<div class="pool" dir="rtl" lang="ar" role="group" aria-label="Words">
				{#each tokens as token (token.id)}
					<button
						type="button"
						class="chip"
						disabled={answer.includes(token.id)}
						onclick={() => add(token.id)}>{token.word}</button
					>
				{/each}
			</div>
			{#if status === 'wrong'}
				<p class="nudge" role="status">Not quite. The highlighted words are out of place.</p>
			{/if}
			<div class="actions">
				<PressButton quiet onclick={reset} disabled={answer.length === 0}>Reset</PressButton>
				<PressButton quiet onclick={reveal}>Show answer</PressButton>
			</div>
		{/if}
	</div>
{/if}

<style>
	.game {
		display: grid;
		gap: 1rem;
	}

	.progress {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.prompt {
		display: grid;
		gap: 0.2rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.85rem 1rem;
	}

	.prompt-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text2);
	}

	.prompt-text {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.answer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-height: 5.5rem;
		padding: 0.9rem;
		border-radius: 1.25rem;
		border: 2px dashed var(--tile6);
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
	}

	.answer.solved {
		border-style: solid;
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 14%, var(--tile2));
	}

	.answer.wrong {
		border-style: solid;
		border-color: #f43f5e;
	}

	.placeholder {
		font-size: 0.9rem;
		color: var(--text2);
	}

	.full {
		font-size: 1.8rem;
		font-weight: 600;
		color: var(--text1);
	}

	.pool {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	.chip {
		min-height: 2.9rem;
		padding: 0.35rem 0.95rem;
		border-radius: 0.9rem;
		border: 2px solid color-mix(in srgb, var(--accent) 45%, var(--tile5));
		background: var(--tile3);
		box-shadow: 0 3px 0 color-mix(in srgb, var(--deep) 55%, transparent);
		font-size: 1.45rem;
		font-weight: 600;
		color: var(--text1);
		cursor: pointer;
		transition: transform 0.12s ease;
	}

	.chip:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: none;
	}

	.chip:disabled {
		opacity: 0.25;
		box-shadow: none;
		cursor: default;
	}

	.chip:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.chip.placed {
		background: color-mix(in srgb, var(--accent) 14%, var(--tile3));
	}

	.chip.off {
		border-color: #f43f5e;
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	.nudge {
		text-align: center;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
	}

	.actions {
		display: flex;
		justify-content: center;
		gap: 0.55rem;
	}

	.reveal {
		display: grid;
		justify-items: center;
		gap: 0.6rem;
	}

	.verdict {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text1);
	}

	.translit {
		font-style: italic;
		color: var(--text2);
	}

	.demo-done {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem;
		font-size: 0.92rem;
		color: var(--text1);
	}

	.list-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
		margin-bottom: 0.6rem;
	}

	.list {
		display: grid;
		gap: 0.45rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.55rem 0.8rem;
	}

	.mark {
		width: 1.4rem;
		font-weight: 700;
		color: #e11d48;
	}

	.mark.ok {
		color: #059669;
	}

	.text {
		display: grid;
		flex: 1;
		gap: 0.1rem;
	}

	.ar {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text1);
	}

	.en {
		font-size: 0.83rem;
		color: var(--text2);
	}

	@media (prefers-reduced-motion: reduce) {
		.chip {
			transition: none;
		}
	}
</style>
