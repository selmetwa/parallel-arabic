<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import PressButton from './PressButton.svelte';
	import { rememberRound } from '$lib/games/pending-round';
	import { hapticSuccess } from '$lib/helpers/haptics';
	import type { GameWord } from '$lib/games/word-pool';

	interface Props {
		heading: string;
		stats: { label: string; value: string | number }[];
		/** XP from this round. Signed in: shown as a stat. Signed out: what they would have earned. */
		xpEarned?: number;
		note?: string;
		accent: string;
		deep: string;
		onPlayAgain: () => void;
		playAgainLabel?: string;
		/** False shows what the round would have saved, with a sign-up link. */
		signedIn?: boolean;
		/** Words missed this round, kept for review once the player signs up. */
		missedWords?: GameWord[];
		dialect?: string;
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
		signedIn = true,
		missedWords = [],
		dialect = '',
		children
	}: Props = $props();

	// Kept on this device, then saved to the account after sign-up (GameShell).
	onMount(() => {
		hapticSuccess();
		if (signedIn) return;
		try {
			rememberRound(localStorage, { xp: xpEarned, words: missedWords, dialect });
		} catch {
			// No storage — the nudge still shows.
		}
	});

	const signupHref = $derived(
		`${resolve('/signup')}?next=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);
	const missedCount = $derived(missedWords.length);
	const keepLine = $derived.by(() => {
		const parts = [];
		if (xpEarned > 0) parts.push(`earned +${xpEarned} XP`);
		if (missedCount > 0)
			parts.push(
				`saved ${missedCount === 1 ? 'the word' : `the ${missedCount} words`} you missed to review`
			);
		return parts.length ? `With an account you'd have ${parts.join(' and ')}.` : null;
	});

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
		{#if signedIn && xpEarned > 0}
			<div class="stat">
				<dt>XP</dt>
				<dd>+{xpEarned}</dd>
			</div>
		{/if}
	</dl>

	{#if note}
		<p class="note">{note}</p>
	{/if}

	{#if !signedIn}
		<div class="keep">
			<p>{keepLine ?? 'Make a free account to earn XP and keep a daily streak.'}</p>
			<a href={signupHref} class="keep-link">
				{keepLine ? 'Create a free account to keep them' : 'Create a free account'}
				<span aria-hidden="true">→</span>
			</a>
		</div>
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

	.keep {
		margin-top: 1rem;
		border-radius: 0.9rem;
		border: 2px dashed var(--accent);
		background: var(--tile3);
		padding: 0.8rem 1rem;
		font-size: 0.9rem;
		color: var(--text1);
	}

	.keep-link {
		display: inline-block;
		margin-top: 0.4rem;
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.keep-link:hover {
		color: var(--accent);
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
