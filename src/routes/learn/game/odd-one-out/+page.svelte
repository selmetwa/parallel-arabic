<script lang="ts">
	import GeneratedGamePage from '$lib/components/games/GeneratedGamePage.svelte';
	import OddOneOut from '$lib/components/games/OddOneOut.svelte';
	import { getGame } from '$lib/constants/games';
	import type { OddPuzzle } from '$lib/games/odd-one-out';

	let { data } = $props();

	const game = getGame('odd-one-out')!;
</script>

<GeneratedGamePage {game} {data} endpoint="/api/games/odd-one-out" roundLabel="10 fresh puzzles">
	{#snippet children({ items, dialect, onPlayAgain })}
		<OddOneOut
			puzzles={items as OddPuzzle[]}
			{dialect}
			signedIn={!!data.user}
			isSubscribed={!!data.isSubscribed}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</GeneratedGamePage>
