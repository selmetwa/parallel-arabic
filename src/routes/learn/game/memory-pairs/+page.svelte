<script lang="ts">
	import WordGamePage from '$lib/components/games/WordGamePage.svelte';
	import MemoryPairs from '$lib/components/games/MemoryPairs.svelte';
	import { getGame } from '$lib/constants/games';

	let { data } = $props();

	const game = getGame('memory-pairs')!;
</script>

<WordGamePage {game} {data} roundName="boards">
	{#snippet skeleton()}
		<div class="skeleton">
			{#each Array(12) as _, i (i)}
				<span class="ghost"></span>
			{/each}
		</div>
	{/snippet}

	{#snippet children({ pool, dialect, gate, signedIn, isSubscribed, onStart })}
		<MemoryPairs
			{pool}
			{dialect}
			{gate}
			{signedIn}
			{isSubscribed}
			accent={game.accent}
			deep={game.deep}
			{onStart}
		/>
	{/snippet}
</WordGamePage>

<style>
	.skeleton {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
		margin-top: 3rem;
	}

	@media (min-width: 640px) {
		.skeleton {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.ghost {
		aspect-ratio: 4 / 3;
		border-radius: 1rem;
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
