<script lang="ts">
	import LocalGamePage from '$lib/components/games/LocalGamePage.svelte';
	import DialectMatch from '$lib/components/games/DialectMatch.svelte';
	import { getGame } from '$lib/constants/games';

	let { data } = $props();

	const game = getGame('dialect-match')!;
</script>

<!-- Every question covers all four dialects, so there is no dialect to pick. -->
<LocalGamePage {game} {data} roundLabel="10 questions" showDialect={false}>
	{#snippet children({ onPlayAgain })}
		<DialectMatch
			items={data.items}
			signedIn={!!data.user}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</LocalGamePage>
