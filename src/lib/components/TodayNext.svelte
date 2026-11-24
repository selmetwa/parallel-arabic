<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { GoalKind } from '$lib/constants/daily-goal';
	import type { TodayPath, TodayStep } from '$lib/helpers/today-path';
	import { endTodayFlow, inTodayFlow } from '$lib/helpers/today-flow';
	import { trackEvent } from '$lib/analytics';

	interface Props {
		/** A step finished here that the server may not have counted yet (a lesson before "Finish"). */
		justFinished?: GoalKind;
		/** Runs before leaving, e.g. saving the lesson as complete. */
		beforeGo?: () => Promise<void>;
	}

	let { justFinished, beforeGo }: Props = $props();

	let mode = $state<'hidden' | 'next' | 'done'>('hidden');
	let next = $state<TodayStep | null>(null);
	let leaving = $state(false);

	onMount(async () => {
		if (!inTodayFlow()) return;
		try {
			const res = await fetch('/api/today');
			if (!res.ok) return;
			const path: TodayPath = await res.json();
			next = path.steps.find((s) => !s.complete && s.kind !== justFinished) ?? null;
			mode = next ? 'next' : 'done';
		} catch {
			// Offline or signed out: the screen's own buttons still work.
		}
	});

	async function go(href: string) {
		if (leaving) return;
		leaving = true;
		trackEvent('today_next_clicked', { kind: next?.kind ?? 'home' });
		try {
			await beforeGo?.();
		} finally {
			if (!next) endTodayFlow();
			await goto(resolve(href as Pathname));
		}
	}
</script>

{#if mode === 'next' && next}
	<div class="today-next" role="status">
		<p class="kicker">Next on today’s path</p>
		<button type="button" class="next" disabled={leaving} onclick={() => next && go(next.href)}>
			{next.label} <span aria-hidden="true">→</span>
		</button>
	</div>
{:else if mode === 'done'}
	<div class="today-next is-done" role="status">
		<p class="kicker">Today’s path is done 🎉</p>
		<button type="button" class="next" disabled={leaving} onclick={() => go('/')}>
			Back home <span aria-hidden="true">→</span>
		</button>
	</div>
{/if}

<style>
	.today-next {
		margin-top: 1.25rem;
		border-radius: 1.1rem;
		border: 2px solid #22c55e;
		background: color-mix(in srgb, #22c55e 10%, var(--tile3));
		padding: 0.9rem 1rem;
		text-align: left;
	}

	.kicker {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text2);
	}

	.next {
		margin-top: 0.45rem;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 100px;
		padding: 0.6rem 1.3rem;
		font-weight: 700;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
		cursor: pointer;
	}

	.next:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}

	.next:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
