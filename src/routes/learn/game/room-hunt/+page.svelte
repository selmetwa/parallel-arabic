<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import GameShell, { type Picker } from '$lib/components/games/GameShell.svelte';
	import RoomHunt from '$lib/components/games/RoomHunt.svelte';
	import { getGame } from '$lib/constants/games';
	import { createRoundGate, freeRoundsStatus } from '$lib/games/free-rounds.svelte';
	import { initialDialect, type GameDialect } from '$lib/games/themes';
	import { ROOMS, getRoom, type RoomId } from '$lib/games/room-hunt/rooms';
	import { learnedCount, type Level, type Mode } from '$lib/games/room-hunt/round';
	import { addLearned, readAllLearned } from '$lib/games/room-hunt/progress';

	let { data } = $props();

	const game = getGame('room-hunt')!;

	// Chosen once on arrival; after that the chips own them.
	let dialect = $state<GameDialect>(
		untrack(() => initialDialect(page.url.searchParams.get('dialect'), data.targetDialect))
	);
	let roomId = $state<RoomId>(getRoom(page.url.searchParams.get('room') ?? '').id);
	let level = $state<Level>('normal');
	let mode = $state<Mode>('find');
	/** Learned words per room, for the current dialect. Read after mount. */
	let learned = $state<Record<string, Set<string>>>({});

	const room = $derived(getRoom(roomId));
	const nextRoom = $derived(ROOMS[ROOMS.indexOf(room) + 1]);

	const gate = createRoundGate('room-hunt', () => ({
		isSubscribed: !!data.isSubscribed,
		userId: data.user?.id ?? null
	}));

	function storage(): Storage | null {
		try {
			return localStorage;
		} catch {
			return null;
		}
	}

	onMount(() => {
		learned = readAllLearned(storage(), dialect);
		try {
			const saved = JSON.parse(localStorage.getItem('pa-room-hunt-settings') ?? '{}');
			if (['easy', 'normal', 'hard'].includes(saved.level)) level = saved.level;
			if (['find', 'name'].includes(saved.mode)) mode = saved.mode;
		} catch {
			// Defaults stand.
		}
	});

	function saveSettings() {
		try {
			localStorage.setItem('pa-room-hunt-settings', JSON.stringify({ level, mode }));
		} catch {
			// Only the preference is lost.
		}
	}

	function changeDialect(next: GameDialect) {
		dialect = next;
		learned = readAllLearned(storage(), next);
	}

	function markLearned(ids: string[]) {
		learned = { ...learned, [roomId]: addLearned(storage(), roomId, dialect, ids) };
	}

	const status = $derived(freeRoundsStatus(gate, 'lessons'));

	const pickers = $derived<Picker[]>([
		{
			id: 'room',
			label: 'Room',
			value: roomId,
			options: ROOMS.map((r) => {
				const done = learnedCount(r, learned[r.id] ?? new Set());
				const count = r.objects.length;
				return {
					value: r.id,
					label: done >= count ? `${r.label} ✓` : done ? `${r.label} ${done}/${count}` : r.label,
					emoji: r.emoji
				};
			}),
			onChange: (value) => (roomId = value as RoomId)
		},
		{
			id: 'mode',
			label: 'Mode',
			value: mode,
			options: [
				{ value: 'find', label: 'Find it', emoji: '👆' },
				{ value: 'name', label: 'Name it', emoji: '💬' }
			],
			onChange: (value) => {
				mode = value as Mode;
				saveSettings();
			}
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
			onChange: (value) => {
				level = value as Level;
				saveSettings();
			}
		}
	]);
</script>

<GameShell
	{game}
	{dialect}
	onDialectChange={changeDialect}
	{status}
	modal={gate.modal}
	onCloseModal={gate.closeModal}
	{pickers}
>
	{#key `${roomId}:${dialect}`}
		<RoomHunt
			{room}
			{dialect}
			{level}
			{mode}
			learned={learned[roomId] ?? new Set()}
			onLearned={markLearned}
			{gate}
			signedIn={!!data.user}
			isSubscribed={!!data.isSubscribed}
			accent={game.accent}
			deep={game.deep}
			onNextRoom={nextRoom ? () => (roomId = nextRoom.id) : undefined}
		/>
	{/key}
</GameShell>
