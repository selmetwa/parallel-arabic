<script lang="ts">
	import LocalGamePage from '$lib/components/games/LocalGamePage.svelte';
	import VerbBlitz from '$lib/components/games/VerbBlitz.svelte';
	import { getGame } from '$lib/constants/games';
	import type { TenseChoice } from '$lib/games/verb-blitz';

	let { data } = $props();

	const game = getGame('verb-blitz')!;

	let tense = $state<TenseChoice>('mixed');
	const pickers = $derived([
		{
			id: 'tense',
			label: 'Tense',
			value: tense,
			options: [
				{ value: 'mixed', label: 'Mixed' },
				{ value: 'past', label: 'Past' },
				{ value: 'present', label: 'Present' },
				{ value: 'future', label: 'Future' }
			],
			onChange: (value: string) => (tense = value as TenseChoice)
		}
	]);
</script>

<LocalGamePage {game} {data} roundLabel="10 verbs" {pickers}>
	{#snippet children({ dialect, onPlayAgain })}
		<VerbBlitz
			{dialect}
			{tense}
			signedIn={!!data.user}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</LocalGamePage>
