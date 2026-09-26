<script lang="ts" module>
	import type { RoundGate } from '$lib/games/free-rounds.svelte';
	import type { GameDialect } from '$lib/games/themes';
	import type { GameWord } from '$lib/games/word-pool';

	export interface WordGameContext {
		pool: GameWord[];
		dialect: GameDialect;
		theme: string;
		gate: RoundGate;
		signedIn: boolean;
		isSubscribed: boolean;
	}
</script>

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import GameShell, { type Picker } from './GameShell.svelte';
	import type { GameInfo } from '$lib/constants/games';
	import { fetchWordPool } from '$lib/games/fetch-word-pool';
	import { createRoundGate, freeRoundsStatus } from '$lib/games/free-rounds.svelte';
	import { initialDialect, resolveTheme, themesFor } from '$lib/games/themes';

	interface Props {
		game: GameInfo;
		data: { isSubscribed?: boolean; user?: { id: string } | null; targetDialect?: string | null };
		/** What one round is called on this game, e.g. "sets". */
		roundName: string;
		/** Placeholder shown while the words load. */
		skeleton: Snippet;
		children: Snippet<[WordGameContext]>;
	}

	let { game, data, roundName, skeleton, children }: Props = $props();

	// Chosen once on arrival; after that the dialect chips own it.
	const startDialect = untrack(() =>
		initialDialect(page.url.searchParams.get('dialect'), data.targetDialect)
	);
	let dialect = $state<GameDialect>(startDialect);
	let theme = $state(resolveTheme(startDialect, null).id);
	let pool = $state<GameWord[] | null>(null);
	let loadFailed = $state(false);

	const gate = createRoundGate(
		untrack(() => game.slug),
		() => ({
			isSubscribed: !!data.isSubscribed,
			userId: data.user?.id ?? null
		})
	);

	// The word list is fetched after mount and never rendered into the page
	// HTML: it is licensed content that must not become indexable.
	$effect(() => {
		const d = dialect;
		const t = theme;
		pool = null;
		loadFailed = false;
		fetchWordPool(d, t)
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

	const status = $derived(freeRoundsStatus(gate, roundName));

	const pickers = $derived<Picker[]>([
		{
			id: 'theme',
			label: 'Theme',
			value: theme,
			options: themesFor(dialect).map((t) => ({ value: t.id, label: t.label, emoji: t.emoji })),
			onChange: (value) => (theme = value)
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
	{#if pool}
		{#key `${dialect}:${theme}`}
			{@render children({
				pool,
				dialect,
				theme,
				gate,
				signedIn: !!data.user,
				isSubscribed: !!data.isSubscribed
			})}
		{/key}
	{:else if loadFailed}
		<p class="load-error" role="alert">
			The words didn't load. Check your connection and pick the theme again.
		</p>
	{:else}
		<div aria-busy="true" aria-label="Loading the words">
			{@render skeleton()}
		</div>
	{/if}
</GameShell>

<style>
	.load-error {
		border-radius: 0.9rem;
		padding: 0.8rem 1rem;
		font-size: 0.9rem;
		color: var(--text1);
		background: color-mix(in srgb, #f43f5e 16%, var(--tile3));
	}
</style>
