<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import GameShell from '$lib/components/games/GameShell.svelte';
	import WordMatch from '$lib/components/games/WordMatch.svelte';
	import { getGame } from '$lib/constants/games';
	import { fetchWordPool } from '$lib/games/fetch-word-pool';
	import { createRoundGate } from '$lib/games/free-rounds.svelte';
	import { initialDialect, resolveTheme, themesFor, type GameDialect } from '$lib/games/themes';
	import { PAIRS, type BoardSize } from '$lib/games/word-match';
	import type { GameWord } from '$lib/games/word-pool';

	let { data } = $props();

	const game = getGame('word-match')!;

	// Chosen once on arrival; after that the dialect chips own it.
	const startDialect = untrack(() =>
		initialDialect(page.url.searchParams.get('dialect'), data.targetDialect)
	);
	let dialect = $state<GameDialect>(startDialect);
	let theme = $state(resolveTheme(startDialect, null).id);
	let size = $state<BoardSize>('easy');
	let pool = $state<GameWord[] | null>(null);
	let loadFailed = $state(false);

	const gate = createRoundGate(game.slug, () => ({
		isSubscribed: !!data.isSubscribed,
		userId: data.user?.id ?? null
	}));

	// Load the theme's words after mount; the list is never part of the page HTML.
	$effect(() => {
		const d = dialect;
		const t = theme;
		pool = null;
		loadFailed = false;
		fetchWordPool('match', d, t)
			.then((res) => {
				if (d === dialect && t === theme) pool = res.words;
			})
			.catch(() => {
				if (d === dialect && t === theme) loadFailed = true;
			});
	});

	function changeDialect(next: GameDialect) {
		dialect = next;
		theme = resolveTheme(next, theme).id;
	}

	const status = $derived(
		!gate.ready
			? undefined
			: gate.unlimited
				? 'Premium · unlimited boards'
				: `${gate.remaining} of 3 free boards left today`
	);
</script>

<GameShell
	{game}
	{dialect}
	onDialectChange={changeDialect}
	{status}
	modal={gate.modal}
	onCloseModal={gate.closeModal}
	pickers={[
		{
			id: 'theme',
			label: 'Theme',
			value: theme,
			options: themesFor(dialect).map((t) => ({ value: t.id, label: t.label, emoji: t.emoji })),
			onChange: (value) => (theme = value)
		},
		{
			id: 'size',
			label: 'Board',
			value: size,
			options: [
				{ value: 'easy', label: `Easy · ${PAIRS.easy} pairs` },
				{ value: 'hard', label: `Hard · ${PAIRS.hard} pairs` }
			],
			onChange: (value) => (size = value as BoardSize)
		}
	]}
>
	{#if pool}
		{#key `${dialect}:${theme}:${size}`}
			<WordMatch
				{pool}
				{size}
				{dialect}
				{gate}
				signedIn={!!data.user}
				isSubscribed={!!data.isSubscribed}
				accent={game.accent}
				deep={game.deep}
			/>
		{/key}
	{:else if loadFailed}
		<p class="load-error" role="alert">
			The words didn't load. Check your connection and pick the theme again.
		</p>
	{:else}
		<div class="skeleton" aria-busy="true" aria-label="Loading the board">
			{#each Array.from({ length: PAIRS[size] * 2 }, (_, i) => i) as i (i)}
				<span class="ghost"></span>
			{/each}
		</div>
	{/if}
</GameShell>

<style>
	.skeleton {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.55rem;
		margin-top: 3.2rem;
	}

	@media (min-width: 640px) {
		.skeleton {
			grid-template-columns: repeat(4, 1fr);
			gap: 0.7rem;
		}
	}

	.ghost {
		aspect-ratio: 4 / 3;
		min-height: 4.5rem;
		border-radius: 0.95rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		animation: pulse 1.4s ease-in-out infinite;
	}

	.load-error {
		border-radius: 0.9rem;
		padding: 0.8rem 1rem;
		font-size: 0.9rem;
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}

	@keyframes pulse {
		50% {
			opacity: 0.55;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ghost {
			animation: none;
		}
	}
</style>
