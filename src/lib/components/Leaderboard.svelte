<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	interface LeaderboardEntry {
		rank: number;
		displayName: string;
		xpThisWeek: number;
		isCurrentUser: boolean;
	}

	interface Props {
		top10: LeaderboardEntry[];
		currentUser: { rank: number; xpThisWeek: number } | null;
		compact?: boolean;
	}

	let { top10, currentUser, compact = false }: Props = $props();

	// Use SvelteDate so the derived is reactive to date reads
	const now = new SvelteDate();

	function getNextMonday(): Date {
		const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
		const daysUntilMonday = (8 - d.getUTCDay()) % 7 || 7;
		d.setUTCDate(d.getUTCDate() + daysUntilMonday);
		return d;
	}

	const countdown = $derived.by(() => {
		const nextMonday = getNextMonday();
		const diffMs = nextMonday.getTime() - now.getTime();
		if (diffMs <= 0) return '0 days 0 hours';
		const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
		const days = Math.floor(totalHours / 24);
		const hours = totalHours % 24;
		return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
	});

	const visibleEntries = $derived(compact ? top10.slice(0, 3) : top10);

	function getRankDisplay(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}
</script>

{#if compact}
	<div class="bg-tile-300 border border-tile-500 rounded-2xl p-4 flex flex-col justify-between h-full">
		<div>
			<h2 class="text-lg font-bold text-text-300">🏆 Weekly Leaderboard</h2>
			{#if currentUser !== null}
				<p class="text-sm text-text-200 mt-1">
					You're ranked <span class="text-text-300 font-semibold">#{currentUser.rank}</span> this week
					with <span class="text-amber-400 font-bold">{currentUser.xpThisWeek} XP</span>
				</p>
			{:else}
				<p class="text-sm text-text-200 mt-1">Earn XP this week to get ranked.</p>
			{/if}
		</div>
		<a href="/leaderboard" class="mt-4 text-sm text-text-200 hover:text-text-300 transition-colors">
			View leaderboard →
		</a>
	</div>
{:else}
	<div class="bg-tile-300 border border-tile-500 rounded-2xl p-4 sm:p-6">
		<!-- Header -->
		<div class="flex items-start justify-between mb-3">
			<div>
				<h2 class="text-lg font-bold text-text-300">🏆 Weekly Leaderboard</h2>
				{#if currentUser !== null}
					<p class="text-sm text-text-200 mt-0.5">
						You're ranked <span class="text-text-300 font-semibold">#{currentUser.rank}</span> this week
						with <span class="text-amber-400 font-bold">{currentUser.xpThisWeek} XP</span>
					</p>
				{/if}
			</div>
		</div>

		<!-- Empty state -->
		{#if top10.length === 0}
			<div class="py-8 text-center text-text-200">
				Be the first on the leaderboard this week!
			</div>
		{:else}
			<!-- Leaderboard rows -->
			<div class="flex flex-col gap-1">
				{#each visibleEntries as entry (entry.rank)}
					<div
						class={[
							'flex items-center gap-3 px-3 py-2 rounded-lg',
							entry.isCurrentUser ? 'bg-tile-500 border border-tile-600' : ''
						]}
					>
						<span class="w-8 shrink-0 font-mono tabular-nums text-sm text-text-200 text-left">
							{getRankDisplay(entry.rank)}
						</span>
						<span class="flex-1 text-text-300 text-sm font-medium truncate">
							{entry.displayName}
						</span>
						<span class="shrink-0 text-amber-400 font-bold text-sm tabular-nums">
							{entry.xpThisWeek} XP
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
