<script lang="ts">
	import GameShell from '$lib/components/games/GameShell.svelte';
	import DailyRoot from '$lib/components/games/DailyRoot.svelte';
	import { getGame } from '$lib/constants/games';

	let { data } = $props();

	const game = getGame('daily-root')!;
</script>

<!-- One shared puzzle a day, free for everyone: no dialect, no free-round count. -->
<GameShell
	{game}
	dialect="fusha"
	onDialectChange={() => {}}
	showDialect={false}
	modal={null}
	onCloseModal={() => {}}
>
	<DailyRoot signedIn={!!data.user} accent={game.accent} deep={game.deep} />
</GameShell>
