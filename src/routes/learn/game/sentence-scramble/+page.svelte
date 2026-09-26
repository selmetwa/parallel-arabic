<script lang="ts">
	import GeneratedGamePage from '$lib/components/games/GeneratedGamePage.svelte';
	import SentenceScramble from '$lib/components/games/SentenceScramble.svelte';
	import { getGame } from '$lib/constants/games';
	import type { ScrambleSentence } from '$lib/games/sentence-scramble';

	let { data } = $props();

	const game = getGame('sentence-scramble')!;
</script>

<GeneratedGamePage
	{game}
	{data}
	endpoint="/api/games/sentence-scramble"
	roundLabel="8 fresh sentences"
>
	{#snippet children({ items, dialect, onPlayAgain })}
		<SentenceScramble
			sentences={items as ScrambleSentence[]}
			{dialect}
			signedIn={!!data.user}
			isSubscribed={!!data.isSubscribed}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</GeneratedGamePage>
