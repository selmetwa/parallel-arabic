<script lang="ts" module>
	import type { GameDialect } from '$lib/games/themes';

	export interface LocalGameContext {
		dialect: GameDialect;
		/** Start a new round, if a free round is left. */
		onPlayAgain: () => void;
	}
</script>

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import GameShell, { type Picker } from './GameShell.svelte';
	import PressButton from './PressButton.svelte';
	import type { GameInfo } from '$lib/constants/games';
	import { createRoundGate, freeRoundsStatus } from '$lib/games/free-rounds.svelte';
	import { initialDialect } from '$lib/games/themes';

	/**
	 * The page for games whose rounds are built in the browser from data the
	 * app ships (letters, verb tables): a Start button, free rounds, fullscreen.
	 */
	interface Props {
		game: GameInfo;
		data: { isSubscribed?: boolean; user?: { id: string } | null; targetDialect?: string | null };
		/** What a round contains, e.g. "10 letters". */
		roundLabel: string;
		/** Games that cover every dialect at once hide the dialect row. */
		showDialect?: boolean;
		pickers?: Picker[];
		children: Snippet<[LocalGameContext]>;
	}

	let { game, data, roundLabel, showDialect = true, pickers = [], children }: Props = $props();

	let dialect = $state<GameDialect>(
		untrack(() => initialDialect(page.url.searchParams.get('dialect'), data.targetDialect))
	);
	const gate = createRoundGate(
		untrack(() => game.slug),
		() => ({ isSubscribed: !!data.isSubscribed, userId: data.user?.id ?? null })
	);
	let playing = $state(false);
	let fullscreen = $state(false);
	let roundId = $state(0);

	function start() {
		if (!gate.tryStartRound()) return;
		roundId++;
		playing = true;
		fullscreen = true;
	}

	function changeDialect(next: GameDialect) {
		dialect = next;
		playing = false;
	}
</script>

<GameShell
	{game}
	{dialect}
	onDialectChange={changeDialect}
	{showDialect}
	{pickers}
	status={freeRoundsStatus(gate, 'rounds')}
	modal={gate.modal}
	onCloseModal={gate.closeModal}
	fullscreen={fullscreen && playing}
	onExitFullscreen={() => (fullscreen = false)}
>
	{#if playing}
		{#key roundId}
			{@render children({ dialect, onPlayAgain: start })}
		{/key}
	{:else}
		<div class="start">
			<PressButton onclick={start} accent={game.accent} deep={game.deep}>
				Start · {roundLabel}
			</PressButton>
		</div>
	{/if}
</GameShell>

<style>
	.start {
		display: grid;
		justify-items: center;
		margin-top: 1.5rem;
	}
</style>
