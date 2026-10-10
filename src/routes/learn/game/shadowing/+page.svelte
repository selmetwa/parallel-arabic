<script lang="ts">
	import LocalGamePage from '$lib/components/games/LocalGamePage.svelte';
	import Shadowing from '$lib/components/games/Shadowing.svelte';
	import { getGame } from '$lib/constants/games';

	let { data } = $props();

	const game = getGame('shadowing')!;
</script>

<LocalGamePage {game} {data} roundLabel="6 lines">
	{#snippet children({ dialect, onPlayAgain })}
		<Shadowing
			{dialect}
			signedIn={!!data.user}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</LocalGamePage>
