<script lang="ts">
	import AudioButton from '$lib/components/AudioButton.svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import { MISTAKE_LABELS, type MistakeItem } from '$lib/games/spot-the-mistake';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		items: MistakeItem[];
		dialect: GameDialect;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
	}

	let { items, dialect, signedIn, isSubscribed, accent, deep, onPlayAgain }: Props = $props();

	let index = $state(0);
	let picked = $state<number | null>(null);
	let outcomes = $state<boolean[]>([]);
	let xpEarned = $state(0);
	let announcement = $state('');

	const item = $derived(items[index]);
	const done = $derived(index >= items.length);
	const score = $derived(outcomes.filter(Boolean).length);
	/** The corrected sentence as words, so the fixed one can be highlighted. */
	const fixedWords = $derived(
		item ? item.words.map((w, i) => (i === item.wrongIndex ? item.correction : w)) : []
	);

	function pick(i: number) {
		if (picked !== null) return;
		picked = i;
		const right = i === item.wrongIndex;
		outcomes[index] = right;
		announcement = right
			? `Correct: ${item.words[item.wrongIndex]} should be ${item.correction}. ${item.explanation}`
			: `Not quite. The mistake was ${item.words[item.wrongIndex]}, which should be ${
					item.correction
				}. ${item.explanation}`;
		if (right && signedIn) {
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

{#if done}
	<GameResults
		heading="{score} of {items.length} mistakes spotted"
		stats={[{ label: 'Spotted', value: `${score}/${items.length}` }]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	>
		<h3 class="list-title">The corrected sentences</h3>
		<ul class="list">
			{#each items as it, i (i)}
				<li class="row">
					<span class="mark" class:ok={outcomes[i]}>{outcomes[i] ? '✓' : '✗'}</span>
					<span class="text">
						<span class="ar" lang="ar" dir="rtl">{it.correct}</span>
						<span class="en">{it.english}</span>
					</span>
					{#if isSubscribed}<AudioButton text={it.correct} {dialect} />{/if}
				</li>
			{/each}
		</ul>
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<p class="progress">
			Sentence {index + 1} of {items.length}
		</p>
		<p class="ask">Tap the word that's wrong.</p>

		<div class="sentence" dir="rtl" lang="ar" role="group" aria-label="The sentence">
			{#each item.words as word, i (i)}
				<button
					type="button"
					class="chip"
					class:chosen-wrong={picked === i && i !== item.wrongIndex}
					class:culprit={picked !== null && i === item.wrongIndex}
					disabled={picked !== null}
					onclick={() => pick(i)}
				>
					{#if picked !== null && i === item.wrongIndex}
						<span class="fix" aria-hidden="true">{item.correction}</span>
					{/if}
					<span class="w">{word}</span>
				</button>
			{/each}
		</div>
		<p class="meaning">{item.english}</p>

		{#if picked !== null}
			<div class="reveal" class:ok={picked === item.wrongIndex}>
				<p class="verdict">
					{picked === item.wrongIndex ? '✓ Well spotted!' : '✗ Not that one.'}
					<span class="badge">{MISTAKE_LABELS[item.errorType]}</span>
				</p>
				<p class="corrected" dir="rtl" lang="ar">
					{#each fixedWords as word, i (i)}
						{#if i === item.wrongIndex}<mark>{word}</mark>{:else}<span>{word}</span>{/if}
					{/each}
				</p>
				{#if item.transliteration}<p class="translit">{item.transliteration}</p>{/if}
				<p class="explanation">{item.explanation}</p>
				{#if isSubscribed}<AudioButton text={item.correct} {dialect} />{/if}
				<PressButton onclick={next} {accent} {deep}>
					{index + 1 < items.length ? 'Next sentence' : 'See results'}
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
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.sentence {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.1rem 0.8rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
	}

	.chip {
		display: grid;
		justify-items: center;
		min-height: 3rem;
		padding: 0.35rem 0.85rem;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 3px 0 var(--tile5);
		cursor: pointer;
		transition: transform 0.12s ease;
	}

	.chip:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.chip:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: none;
	}

	.chip:disabled {
		cursor: default;
		box-shadow: none;
	}

	.chip:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.w {
		font-size: 1.55rem;
		font-weight: 600;
		color: var(--text1);
	}

	.chip.culprit {
		border-color: #f59e0b;
		background: color-mix(in srgb, #f59e0b 16%, var(--tile3));
	}

	.chip.culprit .w {
		text-decoration: line-through;
		text-decoration-color: #e11d48;
	}

	.chip.chosen-wrong {
		border-color: #f43f5e;
		background: color-mix(in srgb, #f43f5e 14%, var(--tile3));
	}

	.fix {
		font-size: 1.05rem;
		font-weight: 700;
		color: #059669;
	}

	.meaning {
		text-align: center;
		font-size: 0.92rem;
		color: var(--text2);
	}

	.reveal {
		display: grid;
		justify-items: start;
		gap: 0.55rem;
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

	.corrected {
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.4em;
		justify-self: stretch;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text1);
	}

	.corrected mark {
		background: color-mix(in srgb, #10b981 28%, transparent);
		color: inherit;
		border-radius: 0.3rem;
		padding: 0 0.2rem;
	}

	.translit {
		font-style: italic;
		color: var(--text2);
	}

	.explanation {
		font-size: 0.92rem;
		line-height: 1.55;
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

	.text .ar {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text1);
	}

	.text .en {
		font-size: 0.83rem;
		color: var(--text2);
	}

	@media (prefers-reduced-motion: reduce) {
		.chip {
			transition: none;
		}
	}
</style>
