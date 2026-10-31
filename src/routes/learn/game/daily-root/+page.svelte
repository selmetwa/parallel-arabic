<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import GameShell from '$lib/components/games/GameShell.svelte';
	import DailyRoot from '$lib/components/games/DailyRoot.svelte';
	import { getGame } from '$lib/constants/games';
	import { initialDialect, type GameDialect } from '$lib/games/themes';

	let { data } = $props();

	const game = getGame('daily-root')!;

	let dialect = $state<GameDialect>(
		untrack(() => initialDialect(page.url.searchParams.get('dialect'), data.targetDialect))
	);
</script>

<!-- One shared root a day, in each dialect's words. Free for everyone: no free-round count. -->
<GameShell
	{game}
	{dialect}
	onDialectChange={(next) => (dialect = next)}
	modal={null}
	onCloseModal={() => {}}
>
	{#key dialect}
		<DailyRoot {dialect} signedIn={!!data.user} accent={game.accent} deep={game.deep} />
	{/key}
</GameShell>
