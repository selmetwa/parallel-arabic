<script lang="ts">
	import GeneratedGamePage from '$lib/components/games/GeneratedGamePage.svelte';
	import SpotTheMistake from '$lib/components/games/SpotTheMistake.svelte';
	import { getGame } from '$lib/constants/games';
	import type { MistakeItem } from '$lib/games/spot-the-mistake';

	let { data } = $props();

	const game = getGame('spot-the-mistake')!;
</script>

<GeneratedGamePage
	{game}
	{data}
	endpoint="/api/games/spot-the-mistake"
	roundLabel="10 fresh sentences"
>
	{#snippet children({ items, dialect, onPlayAgain })}
		<SpotTheMistake
			items={items as MistakeItem[]}
			{dialect}
			signedIn={!!data.user}
			isSubscribed={!!data.isSubscribed}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</GeneratedGamePage>
