<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import GameShell, { type Picker } from '$lib/components/games/GameShell.svelte';
	import ScenarioGame from '$lib/components/games/ScenarioGame.svelte';
	import { getGame } from '$lib/constants/games';
	import { createRoundGate, freeRoundsStatus } from '$lib/games/free-rounds.svelte';
	import { initialDialect, type GameDialect } from '$lib/games/themes';
	import type { Level } from '$lib/games/room-hunt/round';
	import { SCENARIOS, getScenario } from '$lib/games/room-hunt/scenarios/index';

	let { data } = $props();

	const game = getGame('scenarios')!;

	// Chosen once on arrival; after that the chips own them.
	let dialect = $state<GameDialect>(
		untrack(() => initialDialect(page.url.searchParams.get('dialect'), data.targetDialect))
	);
	let scenarioId = $state(getScenario(page.url.searchParams.get('scene') ?? 'taxi').scenario.id);
	let level = $state<Level>('normal');

	const entry = $derived(getScenario(scenarioId));

	const gate = createRoundGate('scenarios', () => ({
		isSubscribed: !!data.isSubscribed,
		userId: data.user?.id ?? null
	}));

	// Room Hunt and the scenarios share the level setting.
	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem('pa-room-hunt-settings') ?? '{}');
			if (['easy', 'normal', 'hard'].includes(saved.level)) level = saved.level;
		} catch {
			// Normal stands.
		}
	});

	function setLevel(value: Level) {
		level = value;
		try {
			const saved = JSON.parse(localStorage.getItem('pa-room-hunt-settings') ?? '{}');
			localStorage.setItem('pa-room-hunt-settings', JSON.stringify({ ...saved, level: value }));
		} catch {
			// Only the preference is lost.
		}
	}

	const status = $derived(freeRoundsStatus(gate, 'conversations'));

	const pickers = $derived<Picker[]>([
		{
			id: 'scene',
			label: 'Scene',
			value: scenarioId,
			options: SCENARIOS.map(({ scenario }) => ({
				value: scenario.id,
				label: scenario.title,
				emoji: scenario.emoji
			})),
			onChange: (value) => (scenarioId = value)
		},
		{
			id: 'level',
			label: 'Level',
			value: level,
			options: [
				{ value: 'easy', label: 'Easy' },
				{ value: 'normal', label: 'Normal' },
				{ value: 'hard', label: 'Hard (listening)' }
			],
			onChange: (value) => setLevel(value as Level)
		}
	]);
</script>

<GameShell
	{game}
	{dialect}
	onDialectChange={(value) => (dialect = value)}
	{status}
	modal={gate.modal}
	onCloseModal={gate.closeModal}
	{pickers}
>
	{#key `${scenarioId}:${dialect}`}
		<ScenarioGame
			{entry}
			{dialect}
			{level}
			{gate}
			signedIn={!!data.user}
			isSubscribed={!!data.isSubscribed}
			accent={game.accent}
			deep={game.deep}
		/>
	{/key}
</GameShell>
