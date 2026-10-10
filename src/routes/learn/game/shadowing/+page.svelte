<script lang="ts">
	import LocalGamePage from '$lib/components/games/LocalGamePage.svelte';
	import Shadowing from '$lib/components/games/Shadowing.svelte';
	import { getGame } from '$lib/constants/games';
	import { SHADOW_LEVELS, type ShadowLevel } from '$lib/games/shadowing';

	let { data } = $props();

	const game = getGame('shadowing')!;

	let level = $state<ShadowLevel>('easy');
	const pickers = $derived([
		{
			id: 'level',
			label: 'Level',
			value: level,
			options: SHADOW_LEVELS,
			onChange: (value: string) => (level = value as ShadowLevel)
		}
	]);
</script>

<LocalGamePage {game} {data} roundLabel="6 lines" {pickers}>
	{#snippet children({ dialect, onPlayAgain })}
		<Shadowing
			{dialect}
			{level}
			signedIn={!!data.user}
			accent={game.accent}
			deep={game.deep}
			{onPlayAgain}
		/>
	{/snippet}
</LocalGamePage>
