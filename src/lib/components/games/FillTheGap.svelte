<script lang="ts">
	import AudioButton from '$lib/components/AudioButton.svelte';
	import GameResults from './GameResults.svelte';
	import PressButton from './PressButton.svelte';
	import { awardGameXp } from '$lib/games/game-xp';
	import type { GapItem } from '$lib/games/fill-the-gap';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		items: GapItem[];
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
	let showTransliteration = $state(true);
	let xpEarned = $state(0);
	let announcement = $state('');

	const item = $derived(items[index]);
	const done = $derived(index >= items.length);
	const score = $derived(outcomes.filter(Boolean).length);
	const missed = $derived(items.filter((_, i) => outcomes[i] === false));
	const sentence = (it: GapItem) => it.words.join(' ');

	function pick(i: number) {
		if (picked !== null) return;
		picked = i;
		const right = i === item.answer;
		outcomes[index] = right;
		announcement = right
			? `Correct: ${sentence(item)}`
			: `Not quite. The missing word was ${item.options[item.answer]}. ${item.explanation}`;
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
		heading="{score} of {items.length} gaps filled"
		stats={[{ label: 'Right', value: `${score}/${items.length}` }]}
		{xpEarned}
		{accent}
		{deep}
		{onPlayAgain}
		playAgainLabel="New round"
	>
		{#if missed.length}
			<h3 class="list-title">The ones that got away</h3>
			<ul class="list">
				{#each missed as it, i (i)}
					<li class="row">
						<span class="ar" lang="ar" dir="rtl">{sentence(it)}</span>
						<span class="en">{it.english}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</GameResults>
{:else}
	<div class="game" style="--accent:{accent}; --deep:{deep};">
		<div class="top">
			<p class="progress">Sentence {index + 1} of {items.length}</p>
			<label class="toggle">
				<input type="checkbox" bind:checked={showTransliteration} />
				Transliteration
			</label>
		</div>

		<div class="sentence" lang="ar" dir="rtl">
			{#each item.words as word, i (i)}
				{#if i === item.gapIndex}
					<span
						class="gap"
						class:filled={picked !== null}
						class:ok={picked === item.answer}
					>
						{picked === null ? '' : item.options[item.answer]}
					</span>
				{:else}
					<span>{word}</span>
				{/if}
			{/each}
		</div>
		<p class="english">{item.english}</p>

		<div class="options" dir="rtl">
			{#each item.options as option, i (i)}
				<button
					type="button"
					class="option"
					lang="ar"
					class:right={picked !== null && i === item.answer}
					class:wrong={picked === i && i !== item.answer}
					disabled={picked !== null}
					onclick={() => pick(i)}>{option}</button
				>
			{/each}
		</div>

		{#if picked !== null}
			<div class="reveal" class:ok={picked === item.answer}>
				<p class="verdict">{picked === item.answer ? '✓ Correct!' : '✗ Not this time.'}</p>
				{#if showTransliteration && item.transliteration}
					<p class="tr">{item.transliteration}</p>
				{/if}
				<p class="explanation">{item.explanation}</p>
				<div class="reveal-actions">
					{#if isSubscribed}
						<AudioButton text={sentence(item)} {dialect} />
					{/if}
					<PressButton onclick={next} {accent} {deep}>
						{index + 1 < items.length ? 'Next sentence' : 'See results'}
					</PressButton>
				</div>
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

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		color: var(--text2);
		cursor: pointer;
	}

	.sentence {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
		border-radius: 1.25rem;
		border: 2px solid color-mix(in srgb, var(--accent) 40%, var(--tile5));
		background: color-mix(in srgb, var(--accent) 6%, var(--tile2));
		padding: 1.1rem;
		font-size: clamp(1.5rem, 5.5vw, 1.9rem);
		font-weight: 600;
		line-height: 1.6;
		color: var(--text1);
	}

	.gap {
		display: inline-block;
		min-width: 4.5rem;
		min-height: 2.2rem;
		border-bottom: 3px dashed var(--accent);
		text-align: center;
	}

	.gap.filled {
		border-bottom-style: solid;
		border-color: #f43f5e;
	}

	.gap.filled.ok {
		border-color: #10b981;
	}

	.english {
		font-size: 0.95rem;
		color: var(--text2);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.6rem;
	}

	.option {
		min-height: 4rem;
		border-radius: 1.1rem;
		font-size: 1.5rem;
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
		gap: 0.5rem;
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

	.tr {
		font-size: 0.88rem;
		font-style: italic;
		color: var(--text2);
	}

	.explanation {
		font-size: 0.92rem;
		line-height: 1.55;
		color: var(--text1);
	}

	.reveal-actions {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-top: 0.2rem;
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

	.row .en {
		font-size: 0.84rem;
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
