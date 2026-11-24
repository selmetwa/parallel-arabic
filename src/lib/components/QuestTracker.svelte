<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import { startTodayFlow } from '$lib/helpers/today-flow';
	import {
		refreshTodayQuests,
		scheduleRefresh,
		todayQuests,
		watchQuestProgress
	} from '$lib/stores/today-quests.svelte';

	interface Props {
		/** The desktop sidebar is collapsed, so the tracker can sit closer to the edge. */
		sidebarCollapsed: boolean;
	}

	let { sidebarCollapsed }: Props = $props();

	const COLLAPSED_KEY = 'questTrackerCollapsed';
	/** The home page shows the full card; these pages have no use for it. */
	const HIDDEN = ['/paywall', '/pricing', '/login', '/signup', '/auth', '/password-reset'];

	let collapsed = $state(true);

	const data = $derived(todayQuests.data);
	const hidden = $derived(
		page.url.pathname === '/' || HIDDEN.some((p) => page.url.pathname.startsWith(p))
	);
	const sideLeft = $derived(data ? data.quests.items.filter((q) => !q.complete).length : 0);
	const allDone = $derived(!!data && data.path.allDone && data.quests.allDone);

	onMount(() => {
		try {
			collapsed = localStorage.getItem(COLLAPSED_KEY) !== 'open';
		} catch {
			// Starts collapsed.
		}
		watchQuestProgress();
		if (!todayQuests.data) refreshTodayQuests();

		const onVisible = () => {
			if (document.visibilityState === 'visible') scheduleRefresh();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	});

	// Progress made on the page they just left.
	afterNavigate(({ from }) => {
		if (from) scheduleRefresh();
	});

	function toggle() {
		collapsed = !collapsed;
		try {
			localStorage.setItem(COLLAPSED_KEY, collapsed ? 'closed' : 'open');
		} catch {
			// Not remembered.
		}
	}
</script>

{#if data && !hidden && data.path.steps.length}
	<aside
		class="tracker"
		class:is-wide={!sidebarCollapsed}
		class:is-open={!collapsed}
		aria-label="Today’s quests"
	>
		<button type="button" class="bar" aria-expanded={!collapsed} onclick={toggle}>
			<span class="emblem" aria-hidden="true">⚔</span>
			{#if allDone}
				<span class="bar-text">All quests done ✓</span>
			{:else}
				<span class="bar-text">
					Quests · main {data.path.completed}/{data.path.steps.length}
					{#if data.quests.items.length}· side {data.quests.completed}/{data.quests.items.length}{/if}
				</span>
			{/if}
			<span class="chev" aria-hidden="true">{collapsed ? '▴' : '▾'}</span>
		</button>

		{#if !collapsed}
			<div class="body">
				<p class="kicker">Main quest</p>
				{#if data.path.next}
					<a
						href={resolve(data.path.next.href as Pathname)}
						class="line is-next"
						onclick={startTodayFlow}
					>
						<span class="mark" aria-hidden="true">▶</span>
						<span class="text">{data.path.next.label}</span>
						{#if data.path.next.target > 1}
							<span class="num">{data.path.next.done}/{data.path.next.target}</span>
						{/if}
					</a>
				{:else}
					<p class="line is-complete">
						<span class="mark" aria-hidden="true">✓</span><span class="text">Done for today</span>
					</p>
				{/if}

				{#if data.quests.items.length}
					<p class="kicker">Side quests {sideLeft === 0 ? '✓' : ''}</p>
					<ul>
						{#each data.quests.items as q (q.id)}
							<li class="line" class:is-complete={q.complete}>
								<span class="mark" aria-hidden="true">{q.complete ? '✓' : '•'}</span>
								{#if q.href && !q.complete}
									<a href={resolve(q.href as Pathname)} class="text">{q.label}</a>
								{:else}
									<span class="text">{q.label}</span>
								{/if}
								{#if q.target > 1}
									<span class="num">{q.done}/{q.target}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</aside>
{/if}

<style>
	/* Bottom-left: toasts and the chat widget live bottom-right. Below the
	   lesson player and full-screen games (z-index 60), which cover it. */
	.tracker {
		position: fixed;
		left: 0.75rem;
		bottom: max(0.75rem, env(safe-area-inset-bottom));
		z-index: 40;
		width: min(18rem, calc(100vw - 1.5rem));
		border-radius: 1rem;
		border: 2px solid var(--tile6);
		background: color-mix(in srgb, var(--tile3) 94%, transparent);
		backdrop-filter: blur(6px);
		box-shadow: 0 6px 18px rgb(0 0 0 / 0.18);
		color: var(--text1);
	}

	.tracker:not(.is-open) {
		width: auto;
		max-width: calc(100vw - 1.5rem);
	}

	@media (min-width: 1024px) {
		.tracker {
			left: 1rem;
			bottom: 1rem;
		}
		.tracker.is-wide {
			left: calc(16rem + 1rem);
		}
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.8rem;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text1);
		cursor: pointer;
	}

	.emblem {
		color: #d97706;
	}

	.bar-text {
		flex: 1;
		text-align: left;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chev {
		font-size: 0.75rem;
		color: var(--text2);
	}

	.body {
		border-top: 1px solid var(--tile5);
		padding: 0.4rem 0.8rem 0.7rem;
	}

	.kicker {
		margin-top: 0.4rem;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #d97706;
	}

	.line {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		padding: 0.2rem 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
		text-decoration: none;
	}

	.line .text {
		flex: 1;
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	a.line:hover .text,
	a.text:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.line.is-next .mark {
		color: #22c55e;
	}

	.line.is-complete {
		color: var(--text2);
	}

	.line.is-complete .text {
		text-decoration: line-through;
	}

	.mark {
		width: 0.9rem;
		flex-shrink: 0;
		text-align: center;
		font-size: 0.75rem;
		color: var(--text2);
	}

	.num {
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		color: var(--text2);
	}
</style>
