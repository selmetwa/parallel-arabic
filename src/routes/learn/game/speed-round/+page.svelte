<script lang="ts">
	import WordGamePage from '$lib/components/games/WordGamePage.svelte';
	import SpeedRound from '$lib/components/games/SpeedRound.svelte';
	import { getGame } from '$lib/constants/games';

	let { data } = $props();

	const game = getGame('speed-round')!;
</script>

<WordGamePage {game} {data} roundName="rounds">
	{#snippet skeleton()}
		<div class="skeleton">
			<span class="ghost"></span>
		</div>
	{/snippet}

	{#snippet children({ pool, dialect, theme, gate, signedIn, isSubscribed, onStart })}
		<SpeedRound
			{pool}
			{dialect}
			{theme}
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
		margin-top: 1.5rem;
	}

	.ghost {
		display: block;
		height: 11rem;
		border-radius: 1.25rem;
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
