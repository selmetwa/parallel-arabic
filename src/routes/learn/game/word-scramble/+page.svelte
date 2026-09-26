<script lang="ts">
	import WordGamePage from '$lib/components/games/WordGamePage.svelte';
	import WordScramble from '$lib/components/games/WordScramble.svelte';
	import { getGame } from '$lib/constants/games';

	let { data } = $props();

	const game = getGame('word-scramble')!;
</script>

<WordGamePage {game} {data} kind="letters" roundName="sets">
	{#snippet skeleton()}
		<div class="skeleton">
			<span class="ghost wide"></span>
			<span class="ghost tall"></span>
		</div>
	{/snippet}

	{#snippet children({ pool, dialect, gate, signedIn, isSubscribed })}
		<WordScramble
			{pool}
			{dialect}
			{gate}
			{signedIn}
			{isSubscribed}
			accent={game.accent}
			deep={game.deep}
		/>
	{/snippet}
</WordGamePage>

<style>
	.skeleton {
		display: grid;
		gap: 1rem;
		margin-top: 2rem;
	}

	.ghost {
		border-radius: 1.1rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		animation: pulse 1.4s ease-in-out infinite;
	}

	.wide {
		height: 3.4rem;
	}

	.tall {
		height: 7rem;
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
