<script lang="ts">
	import LocalGamePage from '$lib/components/games/LocalGamePage.svelte';
	import LetterHunt from '$lib/components/games/LetterHunt.svelte';
	import { getGame } from '$lib/constants/games';

	let { data } = $props();

	const game = getGame('letter-hunt')!;
</script>

<!-- The letters are the same in every dialect. -->
<LocalGamePage {game} {data} roundLabel="10 letters" showDialect={false}>
	{#snippet children({ onPlayAgain })}
		<LetterHunt signedIn={!!data.user} accent={game.accent} deep={game.deep} {onPlayAgain} />
	{/snippet}
</LocalGamePage>
