<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import PressButton from './PressButton.svelte';

	interface Props {
		heading: string;
		stats: { label: string; value: string | number }[];
		/** XP earned this round; shown only when signed in and above zero. */
		xpEarned?: number;
		note?: string;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
		playAgainLabel?: string;
		children?: Snippet;
	}

	let {
		heading,
		stats,
		xpEarned = 0,
		note,
		accent,
		deep,
		onPlayAgain,
		playAgainLabel = 'Play again',
		children
	}: Props = $props();

	// Move focus here when the round ends, so keyboard and screen-reader users
	// land on the result instead of on a card that no longer matters.
	function focusOnMount(node: HTMLElement) {
		node.focus();
	}
</script>

<div class="results" style="--accent:{accent}; --deep:{deep};">
	<h2 use:focusOnMount tabindex="-1">{heading}</h2>

	<dl class="stats">
		{#each stats as stat (stat.label)}
			<div class="stat">
				<dt>{stat.label}</dt>
				<dd>{stat.value}</dd>
			</div>
		{/each}
		{#if xpEarned > 0}
			<div class="stat">
				<dt>XP</dt>
				<dd>+{xpEarned}</dd>
			</div>
		{/if}
	</dl>

	{#if note}
		<p class="note">{note}</p>
	{/if}

	<div class="actions">
		<PressButton onclick={onPlayAgain} {accent} {deep}>{playAgainLabel}</PressButton>
		<a href={resolve('/learn/game')} class="all">All games</a>
	</div>

	{#if children}
		<div class="extra">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.results {
		border-radius: 1.25rem;
		border: 2px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, var(--tile3));
		padding: 1.4rem 1.2rem;
		animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	h2 {
		font-size: 1.45rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
		outline: none;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1rem;
	}

	.stat {
		min-width: 5.5rem;
		border-radius: 0.9rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		padding: 0.55rem 0.8rem;
	}

	dt {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text2);
	}

	dd {
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--text1);
	}

	.note {
		margin-top: 0.9rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin-top: 1.2rem;
	}

	.all {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.all:hover {
		color: var(--brand);
	}

	.extra {
		margin-top: 1.4rem;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.results {
			animation: none;
		}
	}
</style>
