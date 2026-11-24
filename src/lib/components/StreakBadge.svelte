<script lang="ts">
	import type { LiveStreak } from '$lib/helpers/streak';
	import { todayQuests } from '$lib/stores/today-quests.svelte';

	interface Props {
		/** From the layout data; replaced by fresher values as the learner practises. */
		streak: LiveStreak | null;
	}

	let { streak }: Props = $props();

	const current = $derived(todayQuests.streak ?? streak ?? { days: 0, activeToday: false });
	const title = $derived(
		current.activeToday
			? `${current.days}-day streak. Done for today.`
			: current.days > 0
				? `${current.days}-day streak. Practise today to keep it.`
				: 'Practise today to start a streak.'
	);
</script>

<span class="streak" class:is-lit={current.activeToday} {title} aria-label={title}>
	<span class="flame" aria-hidden="true">🔥</span>
	<span class="days">{current.days}</span>
</span>

<style>
	.streak {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		border-radius: 100px;
		border: 1px solid var(--tile5);
		background: color-mix(in srgb, var(--tile4) 60%, transparent);
		padding: 0.25rem 0.65rem;
		font-size: 0.9rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--text2);
		white-space: nowrap;
	}

	/* Grey until today's practice, then lit: a nudge without a notification. */
	.flame {
		filter: grayscale(1);
		opacity: 0.6;
		transition:
			filter 0.3s ease,
			opacity 0.3s ease;
	}

	.is-lit {
		color: var(--text1);
		border-color: #f59e0b;
	}

	.is-lit .flame {
		filter: none;
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.flame {
			transition: none;
		}
	}
</style>
