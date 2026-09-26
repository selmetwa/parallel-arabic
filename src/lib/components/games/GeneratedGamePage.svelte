<script lang="ts" generics="T">
	import { untrack, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import GameShell from './GameShell.svelte';
	import PressButton from './PressButton.svelte';
	import type { GameInfo } from '$lib/constants/games';
	import { createGeneratedRound } from '$lib/games/generated-round.svelte';
	import { LEVEL_OPTIONS, levelFromProficiency, type GameLevel } from '$lib/games/levels';
	import { initialDialect, type GameDialect } from '$lib/games/themes';

	interface Props {
		game: GameInfo;
		data: {
			isSubscribed?: boolean;
			user?: { id: string } | null;
			targetDialect?: string | null;
			proficiencyLevel?: string | null;
		};
		endpoint: string;
		/** What a round contains, e.g. "8 fresh sentences". */
		roundLabel: string;
		/** A hand-written sample non-subscribers can play on the page. */
		demo: Snippet<[{ dialect: GameDialect }]>;
		children: Snippet<[{ items: T[]; dialect: GameDialect; onPlayAgain: () => void }]>;
	}

	let { game, data, endpoint, roundLabel, demo, children }: Props = $props();

	// Chosen once on arrival; after that the chips own them.
	let dialect = $state<GameDialect>(
		untrack(() => initialDialect(page.url.searchParams.get('dialect'), data.targetDialect))
	);
	let level = $state<GameLevel>(untrack(() => levelFromProficiency(data.proficiencyLevel)));

	const round = createGeneratedRound<T>(
		untrack(() => endpoint),
		() => ({ isSubscribed: !!data.isSubscribed, signedIn: !!data.user })
	);

	const start = () => round.start(dialect, level);
</script>

<GameShell
	{game}
	{dialect}
	onDialectChange={(next) => (dialect = next)}
	status={data.isSubscribed ? 'Premium' : 'Sample puzzle · Premium gets a fresh round every time'}
	modal={round.modal}
	onCloseModal={round.closeModal}
	pickers={[
		{
			id: 'level',
			label: 'Level',
			value: level,
			options: LEVEL_OPTIONS,
			onChange: (value) => (level = value as GameLevel)
		}
	]}
>
	{#if round.status === 'playing'}
		{#key round.roundId}
			{@render children({ items: round.items, dialect, onPlayAgain: start })}
		{/key}
	{:else if round.status === 'loading'}
		<div class="waiting" role="status">
			<span class="spinner" aria-hidden="true"></span>
			Preparing {roundLabel}…
		</div>
	{:else}
		{#if !data.isSubscribed}
			{#key dialect}
				{@render demo({ dialect })}
			{/key}
		{/if}
		<div class="start">
			{#if round.status === 'error'}
				<p class="error" role="alert">{round.error}</p>
			{/if}
			<PressButton onclick={start} accent={game.accent} deep={game.deep}>
				{data.isSubscribed ? `Start · ${roundLabel}` : `Play ${roundLabel} with Premium`}
			</PressButton>
		</div>
	{/if}
</GameShell>

<style>
	.waiting {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
		min-height: 10rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text2);
	}

	.spinner {
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		border: 3px solid var(--tile5);
		border-top-color: var(--brand);
		animation: spin 0.8s linear infinite;
	}

	.start {
		display: grid;
		justify-items: center;
		gap: 0.8rem;
		margin-top: 1.5rem;
	}

	.error {
		border-radius: 0.9rem;
		padding: 0.7rem 1rem;
		font-size: 0.9rem;
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 2s;
		}
	}
</style>
