<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		/** What's being done, in order: each ticks off before the next appears. */
		lines: string[];
		/** How long each line stays on before ticking off. */
		stepMs?: number;
		/**
		 * Called once every line has ticked off. Without it the last line keeps
		 * spinning, for work whose real end the caller doesn't know in advance.
		 */
		onDone?: () => void;
	}

	let { lines, stepMs = 850, onDone }: Props = $props();

	let shown = $state(0);

	// Narrated progress instead of a bare spinner: the wait reads as work being
	// done for them (Perceived Effort Delay, Loading Feedback).
	onMount(() => {
		shown = 1;
		let finish: ReturnType<typeof setTimeout> | undefined;
		const timer = setInterval(() => {
			if (!onDone && shown >= lines.length) {
				clearInterval(timer);
				return;
			}
			shown += 1;
			if (shown > lines.length) {
				clearInterval(timer);
				finish = setTimeout(() => onDone?.(), 350);
			}
		}, stepMs);
		return () => {
			clearInterval(timer);
			clearTimeout(finish);
		};
	});
</script>

<ol class="lines" aria-live="polite">
	{#each lines.slice(0, shown) as line, i (i)}
		{@const done = i < shown - 1}
		<li class="line" class:is-done={done} in:fly={{ y: 8, duration: 300 }}>
			<span class="mark" aria-hidden="true">
				{#if !done}<span class="spinner"></span>{/if}
			</span>
			<span>{line}{done ? '' : '…'}</span>
		</li>
	{/each}
</ol>

<style>
	.lines {
		display: inline-flex;
		flex-direction: column;
		gap: 0.7rem;
		text-align: left;
	}

	.line {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.line.is-done {
		color: var(--text2);
	}

	.mark {
		position: relative;
		display: grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		flex-shrink: 0;
		border-radius: 50%;
		border: 2px solid var(--tile6);
	}

	.is-done .mark {
		border-color: #15803d;
		background: #22c55e;
	}

	/* Drawn tick, matching the trial offer's recap. */
	.is-done .mark::after {
		content: '';
		position: absolute;
		left: 0.34rem;
		top: 0.14rem;
		width: 0.28rem;
		height: 0.55rem;
		border: solid #fff;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.spinner {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 50%;
		border: 2px solid var(--tile5);
		border-top-color: var(--brand);
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
