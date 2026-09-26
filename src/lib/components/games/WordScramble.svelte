<script lang="ts">
	import { untrack } from 'svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import GameResults from './GameResults.svelte';
	import GameWordList from './GameWordList.svelte';
	import PressButton from './PressButton.svelte';
	import { keysForTyped } from '$lib/games/arabic-letters';
	import { awardGameXp } from '$lib/games/game-xp';
	import {
		correctPrefix,
		isSolved,
		makeTiles,
		pickSet,
		tileForTyped,
		type Tile
	} from '$lib/games/word-scramble';
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
	}

	let { pool, dialect, gate, signedIn, isSubscribed, accent, deep }: Props = $props();

	// Re-mounted (via {#key}) when the theme changes, so the first pool is the one to use.
	let words = $state(untrack(() => pickSet(pool)));
	let index = $state(0);
	let tiles = $state<Tile[]>(untrack(() => makeTiles(words[0].plain)));
	let placed = $state<number[]>([]);
	let status = $state<'playing' | 'wrong' | 'solved' | 'skipped'>('playing');
	let hinted = $state(false);
	let outcomes = $state<Record<string, boolean>>({});
	let started = $state(false);
	let xpEarned = $state(0);
	let announcement = $state('');

	const word = $derived(words[index]);
	const done = $derived(index >= words.length);
	const built = $derived(placed.map((id) => tiles.find((t) => t.id === id)!.char).join(''));
	const finished = $derived(status === 'solved' || status === 'skipped');
	const solvedCount = $derived(Object.values(outcomes).filter(Boolean).length);

	/** The first move of a set spends a free round; returns false if blocked. */
	function beginRound() {
		if (started) return true;
		if (!gate.tryStartRound()) return false;
		started = true;
		return true;
	}

	function place(tile: Tile) {
		if (finished || placed.includes(tile.id) || !beginRound()) return;
		placed = [...placed, tile.id];
		status = 'playing';
		if (placed.length === tiles.length) check();
	}

	function check() {
		if (isSolved(built, word)) {
			status = 'solved';
			outcomes[word.id] = !hinted;
			announcement = `Correct: ${word.arabic}, ${word.english}`;
			if (!hinted && signedIn) {
				awardGameXp();
				xpEarned++;
			}
		} else {
			status = 'wrong';
			announcement = 'Not quite. Change the letters and try again.';
		}
	}

	function undo() {
		if (finished || placed.length === 0) return;
		placed = placed.slice(0, -1);
		status = 'playing';
	}

	function clear() {
		if (finished) return;
		placed = [];
		status = 'playing';
	}

	/** Keep the right start of the answer and place the next correct letter. */
	function hint() {
		if (finished || !beginRound()) return;
		hinted = true;
		placed = placed.slice(0, correctPrefix(built, word));
		const next = [...word.plain][placed.length];
		const tile = tileForTyped(tiles, placed, next);
		if (tile) place(tile);
	}

	function skip() {
		if (finished || !beginRound()) return;
		status = 'skipped';
		outcomes[word.id] = false;
		announcement = `The word was ${word.arabic}, ${word.english}`;
	}

	function next() {
		index++;
		if (index < words.length) {
			tiles = makeTiles(words[index].plain);
			placed = [];
			status = 'playing';
			hinted = false;
			announcement = '';
		}
	}

	function playAgain() {
		if (!gate.canStart()) {
			gate.block();
			return;
		}
		words = pickSet(pool, { avoid: new Set(words.map((w) => w.id)) });
		index = 0;
		tiles = makeTiles(words[0].plain);
		placed = [];
		status = 'playing';
		hinted = false;
		outcomes = {};
		started = false;
		xpEarned = 0;
		announcement = '';
	}

	function onkeydown(event: KeyboardEvent) {
		if (done || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, [contenteditable], dialog')) return;

		if (finished && event.key === 'Enter') {
			event.preventDefault();
			next();
		} else if (event.key === 'Backspace') {
			event.preventDefault();
			undo();
		} else {
			for (const key of keysForTyped(event.key)) {
				const tile = tileForTyped(tiles, placed, key);
				if (tile) place(tile);
			}
		}
	}
</script>

<svelte:window {onkeydown} />

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done}
	<GameResults
		heading="{solvedCount} of {words.length} words unscrambled"
		stats={[
			{ label: 'Solved', value: `${solvedCount}/${words.length}` },
			{ label: 'Hints or skips', value: words.length - solvedCount }
		]}
		{xpEarned}
		{accent}
		{deep}
		onPlayAgain={playAgain}
		playAgainLabel="Next set"
	>
		<GameWordList {words} {dialect} {isSubscribed} {signedIn} {outcomes} />
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">
			Word {index + 1} of {words.length} · {[...word.plain].length} letters
		</p>

		<div class="clue">
			<span class="clue-label">Meaning</span>
			<span class="clue-text">{word.english}</span>
			{#if word.audioUrl || isSubscribed}
				<AudioButton text={word.arabic} {dialect} audioUrl={word.audioUrl ?? undefined} />
			{/if}
		</div>

		<!-- One text node, so the letters join up as they are placed: the lesson of the game. -->
		<div
			class="answer"
			class:wrong={status === 'wrong'}
			class:solved={status === 'solved'}
			class:skipped={status === 'skipped'}
		>
			<span class="built" lang="ar" dir="rtl">
				{#if finished}{status === 'solved' ? word.arabic : word.plain}{:else}{built}{/if}
			</span>
			<span class="slots" aria-hidden="true">
				{#each tiles as tile, i (tile.id)}
					<span class="slot" class:filled={i < placed.length || finished}></span>
				{/each}
			</span>
		</div>

		{#if finished}
			<div class="reveal">
				<p class="reveal-line">
					{#if status === 'solved'}
						<strong>{hinted ? 'Solved with a hint.' : 'Correct!'}</strong>
					{:else}
						<strong>Skipped.</strong> The word was {word.plain}.
					{/if}
					{#if word.transliteration}<span class="translit">{word.transliteration}</span>{/if}
				</p>
				<PressButton onclick={next} {accent} {deep}>
					{index + 1 < words.length ? 'Next word' : 'See results'}
				</PressButton>
			</div>
		{:else}
			<div class="tiles" dir="rtl" role="group" aria-label="Letters">
				{#each tiles as tile (tile.id)}
					<button
						type="button"
						class="tile"
						lang="ar"
						disabled={placed.includes(tile.id)}
						onclick={() => place(tile)}>{tile.char}</button
					>
				{/each}
			</div>

			{#if status === 'wrong'}
				<p class="nudge" role="status">Not quite. Undo a few letters and try another order.</p>
			{/if}

			<div class="actions">
				<PressButton quiet onclick={undo} disabled={placed.length === 0}>Undo</PressButton>
				<PressButton quiet onclick={clear} disabled={placed.length === 0}>Clear</PressButton>
				<PressButton quiet onclick={hint}>Hint</PressButton>
				<PressButton quiet onclick={skip}>Skip</PressButton>
			</div>
			<p class="keys-note">You can also type on an Arabic keyboard. Backspace undoes.</p>
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

	.clue {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.8rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.8rem 1rem;
	}

	.clue-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text2);
	}

	.clue-text {
		flex: 1;
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.answer {
		display: grid;
		justify-items: center;
		gap: 0.6rem;
		min-height: 7rem;
		padding: 1.1rem 1rem 0.9rem;
		border-radius: 1.25rem;
		border: 2px dashed var(--tile6);
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
	}

	.answer.wrong {
		border-style: solid;
		border-color: #f43f5e;
		animation: shake 0.35s ease;
	}

	.answer.solved {
		border-style: solid;
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 14%, var(--tile2));
	}

	.answer.skipped {
		border-style: solid;
		border-color: var(--tile6);
	}

	.built {
		min-height: 3.4rem;
		font-size: clamp(2.2rem, 10vw, 3rem);
		font-weight: 600;
		line-height: 1.2;
		color: var(--text1);
	}

	.slots {
		display: flex;
		gap: 0.35rem;
	}

	.slot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--tile5);
	}

	.slot.filled {
		background: var(--accent);
	}

	.tiles {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.55rem;
	}

	.tile {
		display: grid;
		place-items: center;
		width: 3.4rem;
		height: 3.4rem;
		border-radius: 0.9rem;
		border: 2px solid color-mix(in srgb, var(--accent) 45%, var(--tile5));
		background: var(--tile3);
		box-shadow: 0 4px 0 color-mix(in srgb, var(--deep) 60%, transparent);
		font-size: 1.7rem;
		font-weight: 600;
		color: var(--text1);
		cursor: pointer;
		transition:
			transform 0.12s ease,
			box-shadow 0.12s ease,
			opacity 0.15s ease;
	}

	.tile:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.tile:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 0 0 transparent;
	}

	.tile:disabled {
		opacity: 0.25;
		box-shadow: none;
		cursor: default;
	}

	.tile:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.nudge {
		text-align: center;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.55rem;
	}

	.keys-note {
		text-align: center;
		font-size: 0.78rem;
		color: var(--text2);
	}

	.reveal {
		display: grid;
		justify-items: center;
		gap: 0.9rem;
	}

	.reveal-line {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.3rem 0.6rem;
		font-size: 0.95rem;
		color: var(--text1);
	}

	.translit {
		font-style: italic;
		color: var(--text2);
	}

	@keyframes shake {
		25% {
			transform: translateX(-6px);
		}
		75% {
			transform: translateX(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.answer.wrong {
			animation: none;
		}
		.tile {
			transition: none;
		}
		.tile:hover:not(:disabled),
		.tile:active:not(:disabled) {
			transform: none;
		}
	}
</style>
