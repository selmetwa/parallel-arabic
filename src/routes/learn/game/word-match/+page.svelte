<script lang="ts">
	import WordGamePage from '$lib/components/games/WordGamePage.svelte';
	import WordMatch from '$lib/components/games/WordMatch.svelte';
	import { getGame } from '$lib/constants/games';
	import { PAIRS, type BoardSize } from '$lib/games/word-match';

	let { data } = $props();

	const game = getGame('word-match')!;
	let size = $state<BoardSize>('easy');
</script>

<WordGamePage
	{game}
	{data}
	kind="match"
	roundName="boards"
	extraPickers={[
		{
			id: 'size',
			label: 'Board',
			value: size,
			options: [
				{ value: 'easy', label: `Easy · ${PAIRS.easy} pairs` },
				{ value: 'hard', label: `Hard · ${PAIRS.hard} pairs` }
			],
			onChange: (value) => (size = value as BoardSize)
		}
	]}
>
	{#snippet skeleton()}
		<div class="skeleton">
			{#each Array.from({ length: PAIRS[size] * 2 }, (_, i) => i) as i (i)}
				<span class="ghost"></span>
			{/each}
		</div>
	{/snippet}

	{#snippet children({ pool, dialect, gate, signedIn, isSubscribed })}
		{#key size}
			<WordMatch
				{pool}
				{size}
				{dialect}
				{gate}
				{signedIn}
				{isSubscribed}
				accent={game.accent}
				deep={game.deep}
			/>
		{/key}
	{/snippet}
</WordGamePage>

<style>
	.skeleton {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.55rem;
		margin-top: 3.2rem;
	}

	@media (min-width: 640px) {
		.skeleton {
			grid-template-columns: repeat(4, 1fr);
			gap: 0.7rem;
		}
	}

	.ghost {
		aspect-ratio: 4 / 3;
		min-height: 4.5rem;
		border-radius: 0.95rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		animation: pulse 1.4s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.55;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ghost {
			animation: none;
		}
	}
</style>
