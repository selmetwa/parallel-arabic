<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import GameResults from './GameResults.svelte';
	import GameWordList from './GameWordList.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { dealBoard, PAIRS, readBest, saveBest, type BoardSize } from '$lib/games/word-match';
	import type { GameWord } from '$lib/games/word-pool';
	import type { RoundGate } from '$lib/games/free-rounds.svelte';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		pool: GameWord[];
		size: BoardSize;
		dialect: GameDialect;
		gate: RoundGate;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
	}

	let { pool, size, dialect, gate, signedIn, isSubscribed, accent, deep }: Props = $props();

	/** How long a wrong pair stays visible before turning back over. */
	const MISMATCH_MS = 900;

	function storage(): Storage | null {
		try {
			return browser ? localStorage : null;
		} catch {
			return null;
		}
	}

	// The pool only arrives after mount, so dealing here never runs on the server.
	// The parent re-mounts this component (via {#key}) when the theme or board
	// size changes, so capturing the first value is intended.
	let board = $state(untrack(() => dealBoard(pool, PAIRS[size])));
	let flipped = $state<string[]>([]);
	const matched = new SvelteSet<string>();
	let moves = $state(0);
	let locked = $state(false);
	let started = $state(false);
	let xpEarned = $state(0);
	let best = $state(readBest(storage()));
	let newBest = $state(false);
	let announcement = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	const done = $derived(board.words.length > 0 && matched.size === board.words.length);

	onDestroy(() => clearTimeout(timer));

	function isFaceUp(key: string, wordId: string) {
		return flipped.includes(key) || matched.has(wordId);
	}

	function flip(key: string) {
		const card = board.cards.find((c) => c.key === key);
		if (!card || locked || done || isFaceUp(card.key, card.wordId)) return;

		// The first flip is what spends a free round, not loading the page.
		if (!started) {
			if (!gate.tryStartRound()) return;
			started = true;
		}

		flipped = [...flipped, card.key];
		if (flipped.length < 2) return;

		moves++;
		const [a, b] = flipped.map((k) => board.cards.find((c) => c.key === k)!);

		if (a.wordId === b.wordId) {
			matched.add(a.wordId);
			flipped = [];
			const word = board.words.find((w) => w.id === a.wordId)!;
			announcement = `Match: ${word.arabic}, ${word.english}`;
			if (signedIn) {
				awardGameXp();
				xpEarned++;
			}
			if (matched.size === board.words.length) {
				newBest = saveBest(storage(), size, moves);
				best = readBest(storage());
			}
		} else {
			announcement = 'No match';
			locked = true;
			timer = setTimeout(() => {
				flipped = [];
				locked = false;
			}, MISMATCH_MS);
		}
	}

	function newBoard() {
		if (!gate.canStart()) {
			gate.block();
			return;
		}
		clearTimeout(timer);
		board = dealBoard(pool, PAIRS[size], { avoid: new Set(board.words.map((w) => w.id)) });
		flipped = [];
		matched.clear();
		moves = 0;
		locked = false;
		started = false;
		xpEarned = 0;
		newBest = false;
		announcement = '';
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done}
	<GameResults
		heading="Board cleared in {moves} moves"
		stats={[
			{ label: 'Moves', value: moves },
			{ label: 'Best', value: best[size] ?? moves }
		]}
		note={newBest ? 'New best for this board size!' : undefined}
		{xpEarned}
		{accent}
		{deep}
		onPlayAgain={newBoard}
		playAgainLabel="New board"
	>
		<GameWordList words={board.words} {dialect} {isSubscribed} {signedIn} />
	</GameResults>
{:else}
	<div class="bar">
		<span>Moves <strong>{moves}</strong></span>
		<span>Pairs <strong>{matched.size}/{board.words.length}</strong></span>
		<span>Best <strong>{best[size] ?? '—'}</strong></span>
		<span class="spacer"></span>
		<PressButton quiet onclick={newBoard}>New board</PressButton>
	</div>

	<div class="board" class:hard={size === 'hard'} style="--accent:{accent}; --deep:{deep};">
		{#each board.cards as card, i (card.key)}
			{@const up = isFaceUp(card.key, card.wordId)}
			<button
				type="button"
				class="card"
				class:up
				class:matched={matched.has(card.wordId)}
				aria-label={up ? card.text : `Card ${i + 1}, face down`}
				aria-disabled={matched.has(card.wordId)}
				onclick={() => flip(card.key)}
			>
				<span class="inner">
					<span class="face back" aria-hidden="true">؟</span>
					<span class="face front" aria-hidden="true">
						{#if card.side === 'ar'}
							<span class="ar" lang="ar" dir="rtl">{card.text}</span>
						{:else}
							<span class="en">{card.text}</span>
						{/if}
					</span>
				</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.1rem;
		margin-bottom: 0.9rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.bar strong {
		color: var(--text1);
		font-weight: 600;
	}

	.spacer {
		flex: 1;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.55rem;
	}

	@media (min-width: 640px) {
		.board {
			grid-template-columns: repeat(4, 1fr);
			gap: 0.7rem;
		}
	}

	.board.hard {
		grid-template-columns: repeat(4, 1fr);
	}

	.card {
		aspect-ratio: 4 / 3;
		min-height: 4.5rem;
		perspective: 800px;
		background: none;
		cursor: pointer;
		padding: 0;
	}

	.inner {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1);
	}

	.card.up .inner {
		transform: rotateY(180deg);
	}

	.face {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0.35rem;
		border-radius: 0.95rem;
		border: 2px solid var(--tile5);
		backface-visibility: hidden;
		text-align: center;
		overflow: hidden;
	}

	.back {
		background: color-mix(in srgb, var(--accent) 22%, var(--tile3));
		border-color: color-mix(in srgb, var(--accent) 45%, var(--tile5));
		box-shadow: 0 4px 0 color-mix(in srgb, var(--deep) 70%, transparent);
		font-size: 1.6rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--deep) 80%, var(--text1));
	}

	.card:hover:not(.up) .back {
		filter: brightness(1.06);
	}

	.front {
		transform: rotateY(180deg);
		background: var(--tile3);
		border-color: var(--accent);
	}

	.card.matched .front {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 16%, var(--tile3));
	}

	.card.matched {
		cursor: default;
	}

	.ar {
		font-size: clamp(1.05rem, 4.5vw, 1.45rem);
		font-weight: 600;
		line-height: 1.35;
		color: var(--text1);
	}

	.en {
		font-size: clamp(0.78rem, 3.2vw, 0.92rem);
		font-weight: 600;
		line-height: 1.3;
		color: var(--text1);
	}

	.card:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 3px;
		border-radius: 1rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.inner {
			transition: none;
		}
	}
</style>
