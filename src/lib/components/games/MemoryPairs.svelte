<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import GameResults from './GameResults.svelte';
	import GameWordList from './GameWordList.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import {
		PAIRS_PER_BOARD,
		buildBoard,
		canPlayMode,
		isPair,
		type MemoryCard,
		type MemoryMode
	} from '$lib/games/memory-pairs';
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

	/** How long a wrong pair stays face up. */
	const MISMATCH_MS = 900;

	const listenOk = $derived(canPlayMode(pool, 'listen'));

	let mode = $state<MemoryMode>('read');
	let cards = $state<MemoryCard[]>(untrack(() => buildBoard(pool, 'read')));
	let open = $state<number[]>([]);
	let matched = $state<number[]>([]);
	let moves = $state(0);
	let started = $state(false);
	let busy = $state(false);
	let xpEarned = $state(0);
	let announcement = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let audio: HTMLAudioElement | null = null;

	const done = $derived(matched.length === cards.length);
	const words = $derived([...new Map(cards.map((c) => [c.word.id, c.word])).values()]);

	onDestroy(() => {
		clearTimeout(timer);
		audio?.pause();
	});

	function play(word: GameWord) {
		if (!word.audioUrl) return;
		audio?.pause();
		audio = new Audio(word.audioUrl);
		audio.play().catch(() => {});
	}

	function beginRound() {
		if (started) return true;
		if (!gate.tryStartRound()) return false;
		started = true;
		onStart?.();
		return true;
	}

	function flip(card: MemoryCard) {
		if (busy || open.includes(card.id) || matched.includes(card.id) || !beginRound()) return;
		if (card.face === 'audio') play(card.word);
		open = [...open, card.id];
		if (open.length < 2) return;

		moves++;
		const [a, b] = open.map((id) => cards.find((c) => c.id === id)!);
		if (isPair(a, b)) {
			matched = [...matched, a.id, b.id];
			open = [];
			announcement = `Pair: ${a.word.arabic}, ${a.word.english}`;
			if (signedIn) {
				awardGameXp();
				xpEarned++;
			}
		} else {
			busy = true;
			announcement = 'Not a pair.';
			timer = setTimeout(() => {
				open = [];
				busy = false;
			}, MISMATCH_MS);
		}
	}

	function newBoard(nextMode: MemoryMode = mode) {
		clearTimeout(timer);
		cards = buildBoard(pool, nextMode, { avoid: new Set(words.map((w) => w.id)) });
		mode = nextMode;
		open = [];
		matched = [];
		moves = 0;
		busy = false;
		started = false;
		xpEarned = 0;
		announcement = '';
	}

	function playAgain() {
		if (!gate.canStart()) {
			gate.block();
			return;
		}
		newBoard();
	}

	function switchMode(next: MemoryMode) {
		if (next === mode || started) return;
		newBoard(next);
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done}
	<GameResults
		heading="All {PAIRS_PER_BOARD} pairs in {moves} moves"
		stats={[
			{ label: 'Pairs', value: PAIRS_PER_BOARD },
			{ label: 'Moves', value: moves }
		]}
		note={moves === PAIRS_PER_BOARD ? 'Not a single miss.' : undefined}
		{xpEarned}
		{accent}
		{deep}
		onPlayAgain={playAgain}
		playAgainLabel="New board"
	>
		<GameWordList {words} {dialect} {isSubscribed} {signedIn} />
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<div class="top">
			<div class="modes" role="group" aria-label="Match">
				<button
					type="button"
					class="mode"
					class:is-on={mode === 'read'}
					aria-pressed={mode === 'read'}
					disabled={started}
					onclick={() => switchMode('read')}>Arabic ↔ English</button
				>
				{#if listenOk}
					<button
						type="button"
						class="mode"
						class:is-on={mode === 'listen'}
						aria-pressed={mode === 'listen'}
						disabled={started}
						onclick={() => switchMode('listen')}>Sound ↔ Arabic</button
					>
				{/if}
			</div>
			<p class="progress">
				{matched.length / 2} of {PAIRS_PER_BOARD} pairs · {moves} moves
			</p>
		</div>

		<div class="board">
			{#each cards as card (card.id)}
				{@const isOpen = open.includes(card.id) || matched.includes(card.id)}
				<button
					type="button"
					class="card"
					class:open={isOpen}
					class:matched={matched.includes(card.id)}
					aria-label={isOpen
						? card.face === 'english'
							? card.word.english
							: card.face === 'audio'
								? `Recording of ${card.word.arabic}`
								: card.word.arabic
						: 'Hidden card'}
					onclick={() => (isOpen && card.face === 'audio' ? play(card.word) : flip(card))}
				>
					<span class="inner">
						<span class="back" aria-hidden="true">?</span>
						<span class="front" aria-hidden="true">
							{#if card.face === 'arabic'}
								<span class="ar" lang="ar" dir="rtl">{card.word.arabic}</span>
							{:else if card.face === 'english'}
								<span class="en">{card.word.english}</span>
							{:else}
								<span class="sound">🔊</span>
							{/if}
						</span>
					</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.game {
		display: grid;
		gap: 0.9rem;
	}

	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
	}

	.modes {
		display: flex;
		gap: 0.4rem;
	}

	.mode {
		min-height: 2.25rem;
		padding: 0.35rem 0.8rem;
		border-radius: 100px;
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text2);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
	}

	.mode.is-on {
		color: var(--text1);
		font-weight: 600;
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, var(--tile3));
	}

	.mode:disabled:not(.is-on) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.progress {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
	}

	@media (min-width: 640px) {
		.board {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.card {
		aspect-ratio: 4 / 3;
		perspective: 800px;
		border-radius: 1rem;
		cursor: pointer;
	}

	.card:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.inner {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.35s ease;
	}

	.card.open .inner {
		transform: rotateY(180deg);
	}

	.back,
	.front {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0.4rem;
		border-radius: 1rem;
		backface-visibility: hidden;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
	}

	.back {
		font-size: 1.6rem;
		font-weight: 700;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 4px 0 var(--deep);
	}

	.front {
		transform: rotateY(180deg);
		background: var(--tile3);
		text-align: center;
	}

	.card.matched .front {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 16%, var(--tile3));
	}

	.ar {
		font-size: clamp(1.15rem, 4.5vw, 1.6rem);
		font-weight: 600;
		color: var(--text1);
	}

	.en {
		font-size: clamp(0.8rem, 3vw, 0.95rem);
		font-weight: 600;
		color: var(--text1);
	}

	.sound {
		font-size: 1.6rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.inner {
			transition: none;
		}
	}
</style>
