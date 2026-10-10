<script lang="ts">
	import GeneratedGamePage from '$lib/components/games/GeneratedGamePage.svelte';
	import FillTheGap from '$lib/components/games/FillTheGap.svelte';
	import { getGame } from '$lib/constants/games';
	import type { GapItem } from '$lib/games/fill-the-gap';

	let { data } = $props();

	const game = getGame('fill-the-gap')!;

	// Signed-in players can have the sentences built around their saved words.
	let words = $state<'any' | 'saved'>('any');
	const extraPickers = $derived(
		data.user
			? [
					{
						id: 'words',
						label: 'Words',
						value: words,
						options: [
							{ value: 'any', label: 'Any words' },
							{ value: 'saved', label: 'My saved words', emoji: '⭐' }
						],
						onChange: (value: string) => (words = value as 'any' | 'saved')
					}
				]
			: []
	);
</script>

<GeneratedGamePage
	{game}
	{data}
	endpoint="/api/games/fill-the-gap"
	roundLabel="10 fresh sentences"
	{extraPickers}
	extraBody={{ useSaved: words === 'saved' }}
>
	{#snippet children({ items, dialect, onPlayAgain })}
		<FillTheGap
			items={items as GapItem[]}
			{dialect}
			signedIn={!!data.user}
			isSubscribed={!!data.isSubscribed}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</GeneratedGamePage>
