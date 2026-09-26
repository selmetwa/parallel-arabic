<script lang="ts">
	import AudioButton from '$lib/components/AudioButton.svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { PATTERN_LABELS, type OddPuzzle } from '$lib/games/odd-one-out';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		puzzles: OddPuzzle[];
		dialect: GameDialect;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
		/** The on-page sample: one puzzle, no XP, no results card. */
		demo?: boolean;
	}

	let {
		puzzles,
		dialect,
		signedIn,
		isSubscribed,
		accent,
		deep,
		onPlayAgain,
		demo = false
	}: Props = $props();

	let index = $state(0);
	let picked = $state<number | null>(null);
	let showTransliteration = $state(true);
	let outcomes = $state<boolean[]>([]);
	let xpEarned = $state(0);
	let announcement = $state('');

	const puzzle = $derived(puzzles[index]);
	const done = $derived(index >= puzzles.length);
	const score = $derived(outcomes.filter(Boolean).length);
	const missed = $derived(puzzles.filter((_, i) => outcomes[i] === false));

	function pick(i: number) {
		if (picked !== null) return;
		picked = i;
		const right = i === puzzle.oddIndex;
		outcomes[index] = right;
		const odd = puzzle.words[puzzle.oddIndex];
		announcement = right
			? `Correct: ${odd.arabic}. ${puzzle.explanation}`
			: `Not quite. The odd one out was ${odd.arabic}. ${puzzle.explanation}`;
		if (right && signedIn && !demo) {
			awardGameXp();
			xpEarned++;
		}
	}

	function next() {
		index++;
		picked = null;
		announcement = '';
	}
</script>

<p class="sr-only" aria-live="polite">{announcement}</p>

{#if done && !demo}
	<GameResults
		heading="{score} of {puzzles.length} puzzles solved"
		stats={[{ label: 'Solved', value: `${score}/${puzzles.length}` }]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	>
		{#if missed.length}
			<h3 class="list-title">The ones that got away</h3>
			<ul class="list">
				{#each missed as p, i (i)}
					<li class="row">
						<span class="ar" lang="ar" dir="rtl">{p.words.map((w) => w.arabic).join('، ')}</span>
						<span class="why">{p.explanation}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</GameResults>
{:else if done}
	<p class="demo-done">
		That's one puzzle. Premium gives you ten fresh ones at your level every round, from easy to
		hard.
	</p>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<div class="top">
			<p class="progress">
				{demo ? 'Sample puzzle' : `Puzzle ${index + 1} of ${puzzles.length}`}
				<span class="level">· {puzzle.difficulty}</span>
			</p>
			<label class="toggle">
				<input type="checkbox" bind:checked={showTransliteration} />
				Transliteration
			</label>
		</div>
		<p class="ask">Which word doesn't belong?</p>

		<div class="grid" dir="rtl">
			{#each puzzle.words as word, i (i)}
				{@const isOdd = i === puzzle.oddIndex}
				<button
					type="button"
					class="word"
					class:right={picked !== null && isOdd}
					class:wrong={picked === i && !isOdd}
					disabled={picked !== null}
					onclick={() => pick(i)}
				>
					<span class="ar" lang="ar">{word.arabic}</span>
					{#if showTransliteration && word.transliteration}
						<span class="tr" dir="ltr">{word.transliteration}</span>
					{/if}
					{#if picked !== null}
						<span class="en" dir="ltr">{word.english}</span>
						<span class="sr-only">{isOdd ? '(the odd one out)' : ''}</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if picked !== null}
			<div class="reveal" class:ok={picked === puzzle.oddIndex}>
				<p class="verdict">
					{picked === puzzle.oddIndex ? '✓ Correct!' : '✗ Not this time.'}
					<span class="badge">{PATTERN_LABELS[puzzle.pattern]}</span>
				</p>
				<p class="explanation">{puzzle.explanation}</p>
				{#if isSubscribed}
					<div class="audio">
						{#each puzzle.words as word, i (i)}
							<AudioButton text={word.arabic} {dialect} />
						{/each}
					</div>
				{/if}
				<PressButton onclick={next} {accent} {deep}>
					{demo ? 'Done' : index + 1 < puzzles.length ? 'Next puzzle' : 'See results'}
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

	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.progress {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.level {
		text-transform: capitalize;
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		color: var(--text2);
		cursor: pointer;
	}

	.ask {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.65rem;
	}

	.word {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 0.2rem;
		min-height: 6.5rem;
		padding: 0.8rem;
		border-radius: 1.1rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: var(--tile3);
		box-shadow: 0 4px 0 color-mix(in srgb, var(--deep) 55%, transparent);
		cursor: pointer;
		transition: transform 0.12s ease;
	}

	.word:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.word:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: none;
	}

	.word:disabled {
		cursor: default;
		box-shadow: none;
	}

	.word:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.word.right {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 18%, var(--tile3));
	}

	.word.wrong {
		border-color: #f43f5e;
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	.word .ar {
		font-size: 1.8rem;
		font-weight: 600;
		color: var(--text1);
	}

	.tr {
		font-size: 0.8rem;
		font-style: italic;
		color: var(--text2);
	}

	.en {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
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
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		font-weight: 600;
		color: var(--text1);
	}

	.badge {
		font-size: 0.72rem;
		font-weight: 600;
		border-radius: 100px;
		padding: 0.18rem 0.6rem;
		background: color-mix(in srgb, var(--accent) 20%, var(--tile3));
		color: var(--text1);
	}

	.explanation {
		font-size: 0.92rem;
		line-height: 1.55;
		color: var(--text1);
	}

	.audio {
		display: flex;
		gap: 0.4rem;
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
		display: grid;
		gap: 0.2rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.6rem 0.8rem;
	}

	.row .ar {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.why {
		font-size: 0.84rem;
		color: var(--text2);
	}

	@media (prefers-reduced-motion: reduce) {
		.word {
			transition: none;
		}
		.word:hover:not(:disabled),
		.word:active:not(:disabled) {
			transform: none;
		}
	}
</style>
