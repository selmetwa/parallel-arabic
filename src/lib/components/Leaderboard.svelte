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

	const visibleEntries = $derived(compact ? top10.slice(0, 5) : top10);

	function getRankDisplay(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}
</script>

<div class="bg-tile-300 border border-tile-500 rounded-2xl p-4 sm:p-6">
	<!-- Header -->
	<div class="flex items-start justify-between mb-4">
		<div>
			<h2 class="text-lg font-bold text-text-300">🏆 Weekly Leaderboard</h2>
			{#if compact}
				<p class="text-sm text-text-200 mt-0.5">Resets in: {countdown}</p>
			{:else}
				<p class="text-sm text-text-200 mt-0.5">This week resets in: {countdown}</p>
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
			{#each visibleEntries as entry, i (entry.rank)}
				<div
					class={[
						'flex items-center gap-3 px-3 py-2 rounded-lg',
						entry.isCurrentUser
							? 'bg-tile-500 border border-tile-600'
							: i % 2 === 0
								? 'bg-tile-400/50'
								: ''
					]}
				>
					<!-- Rank -->
					<span class="w-8 shrink-0 font-mono tabular-nums text-sm text-text-200 text-center">
						{getRankDisplay(entry.rank)}
					</span>

					<!-- Display name -->
					<span class="flex-1 text-text-300 text-sm font-medium truncate">
						{entry.displayName}
					</span>

					<!-- XP -->
					<span class="shrink-0 text-amber-400 font-bold text-sm tabular-nums">
						{entry.xpThisWeek} XP
					</span>
				</div>
			{/each}
		</div>

		<!-- Compact: link to full leaderboard -->
		{#if compact}
			<div class="mt-3 flex justify-end">
				<a
					href="/leaderboard"
					class="text-sm text-text-200 hover:text-text-300 transition-colors"
				>
					See full leaderboard →
				</a>
			</div>
		{/if}

		<!-- Footer: current user outside top 10 -->
		{#if currentUser !== null}
			<div class="mt-4 pt-3 border-t border-tile-500 text-sm text-text-200 text-center">
				You're ranked <span class="text-text-300 font-semibold">#{currentUser.rank}</span> this week
				with <span class="text-amber-400 font-bold">{currentUser.xpThisWeek} XP</span>
			</div>
		{/if}
	{/if}
</div>
