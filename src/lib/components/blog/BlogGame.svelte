<script lang="ts" module>
	export interface BlogGameContext {
		signedIn: boolean;
		/** Start a fresh round in place. */
		onPlayAgain: () => void;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import PressButton from '$lib/components/games/PressButton.svelte';

	/**
	 * A game played inside a blog post: a framed card with a Start button, so the
	 * page doesn't jump while someone is reading, and a link to the full game.
	 * Rounds here never spend a game's free rounds (see open-gate.ts).
	 */
	interface Props {
		title: string;
		blurb: string;
		accent: string;
		deep: string;
		/** e.g. "10 questions" — shown on the Start button. */
		roundLabel?: string;
		/** Games that draw their own start screen (the word games) skip ours. */
		showStart?: boolean;
		/** The full game, linked under the card. */
		fullGame?: { href: Pathname; label: string };
		children: Snippet<[BlogGameContext]>;
	}

	let {
		title,
		blurb,
		accent,
		deep,
		roundLabel,
		showStart = true,
		fullGame,
		children
	}: Props = $props();

	let playing = $state(false);
	let roundId = $state(0);
	const signedIn = $derived(!!page.data.user);

	function start() {
		roundId++;
		playing = true;
	}
</script>

<aside class="blog-game not-prose" style="--accent:{accent}; --deep:{deep};" aria-label={title}>
	<p class="kicker">Try it</p>
	<h3 class="title">{title}</h3>
	<p class="blurb">{blurb}</p>

	<div class="body">
		{#if playing || !showStart}
			{#key roundId}
				{@render children({ signedIn, onPlayAgain: start })}
			{/key}
		{:else}
			<div class="start">
				<PressButton onclick={start} {accent} {deep}>
					Start{#if roundLabel}&nbsp;· {roundLabel}{/if}
				</PressButton>
			</div>
		{/if}
	</div>

	{#if fullGame}
		<a href={resolve(fullGame.href)} class="full">{fullGame.label} <span aria-hidden="true">→</span></a>
	{/if}
</aside>

<style>
	.blog-game {
		margin: 2rem 0;
		border-radius: 1.25rem;
		border: 2px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 6%, var(--tile3));
		padding: 1.2rem 1.1rem 1.1rem;
	}

	@media (min-width: 640px) {
		.blog-game {
			padding: 1.4rem 1.4rem 1.2rem;
		}
	}

	.kicker {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text2);
	}

	/* Beats the article's [&_h3] styles. */
	.blog-game .title {
		margin: 0.15rem 0 0;
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.blurb {
		margin-top: 0.3rem;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--text2);
	}

	.body {
		margin-top: 1rem;
	}

	.start {
		display: grid;
		justify-items: center;
		padding: 0.5rem 0;
	}

	.full {
		display: inline-block;
		margin-top: 1rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.full:hover {
		color: var(--accent);
	}
</style>
