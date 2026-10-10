<script lang="ts">
	import { onMount } from 'svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import {
		MAX_TRIES,
		isSolved,
		makeTiles,
		markGuess,
		shareText,
		type RootPuzzle,
		type Tile
	} from '$lib/games/daily-root';

	interface Props {
		signedIn: boolean;
		accent: string;
		deep: string;
	}

	let { signedIn, accent, deep }: Props = $props();

	interface ClueState {
		guesses: string[];
		solved: boolean;
	}

	let puzzle = $state<RootPuzzle | null>(null);
	let loadError = $state('');
	let clues = $state<ClueState[]>([]);
	let active = $state(0);
	let tiles = $state<Tile[]>([]);
	let placed = $state<number[]>([]);
	let copied = $state(false);
	let announcement = $state('');

	const word = $derived(puzzle?.words[active]);
	const clue = $derived(clues[active]);
	const clueDone = (c: ClueState | undefined) => !!c && (c.solved || c.guesses.length >= MAX_TRIES);
	const allDone = $derived(clues.length > 0 && clues.every(clueDone));
	const built = $derived(placed.map((id) => tiles.find((t) => t.id === id)!.char).join(''));
	const tries = $derived(clues.map((c) => (c.solved ? c.guesses.length : null)));

	const storageKey = (n: number) => `pa-daily-root:${n}`;

	function save() {
		if (!puzzle) return;
		try {
			localStorage.setItem(storageKey(puzzle.number), JSON.stringify(clues));
		} catch {
			// Private mode: today's progress just isn't kept.
		}
	}

	function restore(p: RootPuzzle): ClueState[] {
		try {
			const saved = JSON.parse(localStorage.getItem(storageKey(p.number)) ?? 'null');
			if (Array.isArray(saved) && saved.length === p.words.length) return saved;
		} catch {
			// Fall through to a fresh start.
		}
		return p.words.map(() => ({ guesses: [], solved: false }));
	}

	function openClue(i: number) {
		if (!puzzle) return;
		active = i;
		tiles = makeTiles(puzzle.words[i].plain);
		placed = [];
		announcement = '';
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/games/daily-root');
			if (!res.ok) throw new Error();
			const p: RootPuzzle = (await res.json()).puzzle;
			clues = restore(p);
			puzzle = p;
			const next = clues.findIndex((c) => !clueDone(c));
			openClue(next === -1 ? 0 : next);
		} catch {
			loadError = "Today's puzzle didn't load. Check your connection and try again.";
		}
	});

	function place(tile: Tile) {
		if (!word || clueDone(clue) || placed.includes(tile.id)) return;
		if (placed.length >= [...word.plain].length) return;
		placed = [...placed, tile.id];
	}

	function undo() {
		placed = placed.slice(0, -1);
	}

	function check() {
		if (!word || !clue || placed.length !== [...word.plain].length) return;
		const guess = built;
		clue.guesses = [...clue.guesses, guess];
		if (isSolved(guess, word.plain)) {
			clue.solved = true;
			announcement = `Correct: ${word.arabic}, ${word.english}`;
			if (signedIn) awardGameXp();
		} else if (clue.guesses.length >= MAX_TRIES) {
			announcement = `The word was ${word.arabic}`;
		} else {
			announcement = 'Not yet. Green letters are in the right place, yellow are in the word.';
		}
		placed = [];
		save();
	}

	function nextClue() {
		const next = clues.findIndex((c, i) => i > active && !clueDone(c));
		const any = clues.findIndex((c) => !clueDone(c));
		openClue(next !== -1 ? next : any !== -1 ? any : active);
	}

	async function share() {
		if (!puzzle) return;
		const text = shareText(puzzle, tries, `${location.origin}/learn/game/daily-root`);
		try {
			if (navigator.share) await navigator.share({ text });
			else {
				await navigator.clipboard.writeText(text);
				copied = true;
			}
		} catch {
			// The share sheet was closed.
		}
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if loadError}
	<p class="error" role="alert">{loadError}</p>
{:else if !puzzle || !word || !clue}
	<div class="waiting" role="status">Loading today's root…</div>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<div class="head">
			<p class="number">Daily Root #{puzzle.number}</p>
			<p class="root" lang="ar" dir="rtl">{puzzle.root.split(' ').join(' · ')}</p>
			<p class="meaning">to do with {puzzle.meaning}</p>
		</div>

		<ol class="clues">
			{#each puzzle.words as w, i (i)}
				{@const c = clues[i]}
				<li>
					<button
						type="button"
						class="clue"
						class:on={i === active}
						class:solved={c.solved}
						class:failed={!c.solved && c.guesses.length >= MAX_TRIES}
						onclick={() => openClue(i)}
					>
						<span class="clue-en">{w.english}</span>
						{#if clueDone(c)}
							<span class="clue-ar" lang="ar" dir="rtl">{w.arabic}</span>
						{:else}
							<span class="clue-len">{[...w.plain].length} letters</span>
						{/if}
					</button>
				</li>
			{/each}
		</ol>

		{#if allDone}
			<div class="done">
				<p class="done-title">
					{tries.filter((t) => t !== null).length} of {tries.length} words today
				</p>
				<p class="squares" aria-hidden="true">
					{tries.map((t) => (t === null ? '⬛' : t === 1 ? '🟩' : t === 2 ? '🟨' : '🟧')).join('')}
				</p>
				<PressButton onclick={share} {accent} {deep}>{copied ? 'Copied!' : 'Share result'}</PressButton>
				<p class="come-back">A new root every day at midnight UTC.</p>
			</div>
		{:else}
			<div class="board">
				<p class="ask">
					“{word.english}” · {[...word.plain].length} letters · try {Math.min(
						clue.guesses.length + 1,
						MAX_TRIES
					)} of {MAX_TRIES}
				</p>

				{#each clue.guesses as guess, g (g)}
					{@const marks = markGuess(guess, word.plain)}
					<div class="row" dir="rtl" lang="ar">
						{#each [...guess] as ch, i (i)}
							<span class="cell {marks[i]}">{ch}</span>
						{/each}
					</div>
				{/each}

				{#if clueDone(clue)}
					<div class="reveal" class:ok={clue.solved}>
						<p>
							{clue.solved ? '✓ Correct!' : 'The word was:'}
							<span class="ar" lang="ar" dir="rtl">{word.arabic}</span>
							<span class="tr">{word.transliteration}</span>
						</p>
						<PressButton onclick={nextClue} {accent} {deep}>Next word</PressButton>
					</div>
				{:else}
					<div class="row" dir="rtl" lang="ar">
						{#each [...word.plain] as _, i (i)}
							<span class="cell slot">{built[i] ?? ''}</span>
						{/each}
					</div>
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
					<div class="actions">
						<PressButton quiet onclick={undo} disabled={placed.length === 0}>Undo</PressButton>
						<PressButton
							onclick={check}
							disabled={placed.length !== [...word.plain].length}
							{accent}
							{deep}>Check</PressButton
						>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.waiting {
		margin-top: 1.5rem;
		text-align: center;
		color: var(--text2);
	}

	.error {
		border-radius: 0.9rem;
		padding: 0.8rem 1rem;
		font-size: 0.9rem;
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	.game {
		display: grid;
		gap: 1rem;
	}

	.head {
		display: grid;
		justify-items: center;
		gap: 0.2rem;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
		padding: 1rem;
		text-align: center;
	}

	.number {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	.root {
		font-size: clamp(2.2rem, 9vw, 3rem);
		font-weight: 700;
		color: var(--text1);
	}

	.meaning {
		font-size: 0.9rem;
		color: var(--text2);
	}

	.clues {
		display: grid;
		gap: 0.4rem;
	}

	.clue {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.55rem 0.85rem;
		cursor: pointer;
		text-align: left;
	}

	.clue.on {
		border-color: var(--accent);
	}

	.clue.solved {
		background: color-mix(in srgb, #10b981 12%, var(--tile3));
	}

	.clue.failed {
		background: color-mix(in srgb, #f43f5e 10%, var(--tile3));
	}

	.clue-en {
		font-weight: 600;
		color: var(--text1);
	}

	.clue-len {
		font-size: 0.8rem;
		color: var(--text2);
	}

	.clue-ar {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text1);
	}

	.board {
		display: grid;
		justify-items: center;
		gap: 0.6rem;
	}

	.ask {
		font-weight: 600;
		color: var(--text1);
		text-align: center;
	}

	.row {
		display: flex;
		gap: 0.35rem;
	}

	.cell {
		display: grid;
		place-items: center;
		width: 2.7rem;
		height: 2.9rem;
		border-radius: 0.6rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text1);
		border: 2px solid var(--tile5);
		background: var(--tile3);
	}

	.cell.slot {
		border-style: dashed;
		background: var(--tile2);
	}

	.cell.hit {
		color: #fff;
		border-color: #059669;
		background: #10b981;
	}

	.cell.near {
		color: #1f2937;
		border-color: #d97706;
		background: #fbbf24;
	}

	.cell.miss {
		color: var(--text2);
		background: var(--tile4);
	}

	.tiles {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		margin-top: 0.4rem;
	}

	.tile {
		width: 2.9rem;
		height: 2.9rem;
		border-radius: 0.7rem;
		font-size: 1.5rem;
		color: var(--text1);
		background: var(--tile3);
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		box-shadow: 0 3px 0 color-mix(in srgb, var(--deep) 55%, transparent);
		cursor: pointer;
	}

	.tile:disabled {
		opacity: 0.3;
		cursor: default;
		box-shadow: none;
	}

	.tile:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.actions {
		display: flex;
		gap: 0.6rem;
	}

	.reveal {
		display: grid;
		justify-items: center;
		gap: 0.6rem;
		width: 100%;
		border-radius: 1.1rem;
		border: 2px solid #f43f5e;
		background: color-mix(in srgb, #f43f5e 8%, var(--tile3));
		padding: 0.9rem;
		text-align: center;
		color: var(--text1);
	}

	.reveal.ok {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 10%, var(--tile3));
	}

	.reveal .ar {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.tr {
		font-style: italic;
		color: var(--text2);
	}

	.done {
		display: grid;
		justify-items: center;
		gap: 0.6rem;
		border-radius: 1.25rem;
		border: 2px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, var(--tile3));
		padding: 1.2rem;
		text-align: center;
	}

	.done-title {
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--text1);
	}

	.squares {
		font-size: 1.8rem;
		letter-spacing: 0.15em;
	}

	.come-back {
		font-size: 0.85rem;
		color: var(--text2);
	}
</style>
