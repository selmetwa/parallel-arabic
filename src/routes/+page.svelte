<!-- Design · editorial dashboard · theme-aware (HSL hue-200) · ReadexPro -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { currentDialect } from '$lib/store/store';
	import type { PageData } from './$types';
	import ContinueCard from '$lib/components/ContinueCard.svelte';
	import WordOfTheDay from '$lib/components/WordOfTheDay.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import ArabicMap from '$lib/components/ArabicMap.svelte';
	import WeekStrip from '$lib/components/WeekStrip.svelte';

	let { data }: { data: PageData } = $props();

	let bannerDismissed = $state(false);

	// Masthead greeting — neutral defaults render identically on server & client to
	// avoid a hydration mismatch; the time-of-day variant is filled in onMount.
	let greetingEn = $state('Welcome');
	let greetingAr = $state('أهلاً');
	let todayLabel = $state('');

	const suggestions = $derived(data.suggestions || []);
	const reviewSuggestion = $derived(suggestions.find((s) => s.id === 'review'));
	const otherSuggestions = $derived(suggestions.filter((s) => s.id !== 'review').slice(0, 4));

	function dismissBanner() {
		bannerDismissed = true;
		if (browser) sessionStorage.setItem('homeBannerDismissed', 'true');
	}

	onMount(() => {
		currentDialect.set('');

		const now = new Date();
		todayLabel = now.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
		if (data.user) {
			const h = now.getHours();
			greetingEn = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
			greetingAr = h < 12 ? 'صباح الخير' : 'مساء الخير';
		}

		if (browser) bannerDismissed = sessionStorage.getItem('homeBannerDismissed') === 'true';
	});
</script>

<section class="mx-auto max-w-6xl space-y-7 px-3 pb-12 pt-6 sm:px-8">
	<!-- ── Snippets ──────────────────────────────────────────────────────────── -->

	{#snippet stat(label: string, value: string | number, unit: string, href: string, accent: string)}
		{#if href}
			<a href={resolve(href)} class="stat" style="--accent:{accent};">
				<span class="stat-label">{label}</span>
				<span class="stat-value"
					>{value}{#if unit}<span class="stat-unit">{unit}</span>{/if}</span
				>
			</a>
		{:else}
			<div class="stat stat--static" style="--accent:{accent};">
				<span class="stat-label">{label}</span>
				<span class="stat-value"
					>{value}{#if unit}<span class="stat-unit">{unit}</span>{/if}</span
				>
			</div>
		{/if}
	{/snippet}

	{#snippet sectionHead(emoji: string, label: string, sub: string)}
		<div class="sec-head">
			<span class="sec-emoji" aria-hidden="true">{emoji}</span>
			<h2>{label}</h2>
			<span class="sec-sub">{sub}</span>
		</div>
	{/snippet}

	<!-- Learn tile: icon prominent at top -->
	{#snippet tile(
		href: string,
		icon: string,
		title: string,
		desc: string,
		accent: string,
		deep: string
	)}
		<a href={resolve(href)} class="tile" style="--accent:{accent}; --deep:{deep};">
			<span class="tile-icon" aria-hidden="true">{icon}</span>
			<span class="min-w-0">
				<span class="tile-title">{title}</span>
				<span class="tile-desc">{desc}</span>
			</span>
		</a>
	{/snippet}

	<!-- Compact tile: horizontal, for the dense Practice grid -->
	{#snippet compactTile(
		href: string,
		icon: string,
		title: string,
		desc: string,
		accent: string,
		deep: string
	)}
		<a href={resolve(href)} class="tile tile--compact" style="--accent:{accent}; --deep:{deep};">
			<span class="tile-icon" aria-hidden="true">{icon}</span>
			<span class="min-w-0">
				<span class="tile-title truncate">{title}</span>
				<span class="tile-desc line-clamp-1 hidden xl:block">{desc}</span>
			</span>
		</a>
	{/snippet}

	<!-- Suggestion tile -->
	{#snippet suggTile(href: string, icon: string, title: string, desc: string)}
		<a href={resolve(href)} class="tile tile--sugg" style="--accent:#0ea5e9; --deep:#0369a1;">
			<span class="tile-icon" aria-hidden="true">{icon}</span>
			<span class="min-w-0">
				<span class="tile-title">{title}</span>
				<span class="tile-desc">{desc}</span>
			</span>
		</a>
	{/snippet}

	<!-- ── Week strip ──────────────────────────────────────────────────────── -->
	{#if data.user && data.weekActivityDates}
		<div class="reveal" style="animation-delay: 60ms;">
			<WeekStrip
				weekActivityDates={data.weekActivityDates}
				weekStartTimestamp={data.weekStartTimestamp}
			/>
		</div>
	{/if}

	<!-- ── Stats ribbon ────────────────────────────────────────────────────── -->
	{#if data.user}
		<div
			class="reveal grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
			style="animation-delay: 120ms;"
		>
			{@render stat(
				'Streak',
				data.currentStreak ?? 0,
				data.currentStreak === 1 ? 'day' : 'days',
				'',
				'#f59e0b'
			)}
			{@render stat(
				'Words saved',
				data.totalSavedWordsCount ?? 0,
				'',
				'/review/all-words',
				'#0ea5e9'
			)}
			{@render stat(
				'Due to review',
				data.cappedReviewCount ?? data.wordsDueForReviewCount ?? 0,
				'words',
				'/review',
				'#f43f5e'
			)}
			{#if data.leaderboardCurrentUser}
				{@render stat(
					'Weekly rank',
					'#' + data.leaderboardCurrentUser.rank,
					'',
					'/leaderboard',
					'#8b5cf6'
				)}
				{@render stat(
					'XP this week',
					data.leaderboardCurrentUser.xpThisWeek,
					'xp',
					'/leaderboard',
					'#10b981'
				)}
			{:else}
				{@render stat('Stories read', data.totalStoriesViewed ?? 0, '', '/stories', '#8b5cf6')}
				{@render stat('Sentences', data.totalSentencesViewed ?? 0, '', '/sentences', '#10b981')}
			{/if}
		</div>
	{/if}

	<!-- ── Activity suggestions ────────────────────────────────────────────── -->
	{#if data.user && !bannerDismissed && (reviewSuggestion || otherSuggestions.length > 0)}
		<div class="reveal jump-panel" style="animation-delay: 180ms;">
			<button onclick={dismissBanner} class="dismiss" aria-label="Dismiss suggestions">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<div class="sec-head pr-8">
				<span class="sec-emoji" aria-hidden="true">⚡</span>
				<h2>Jump back in</h2>
			</div>

			<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
				{#if reviewSuggestion}
					{@render suggTile(
						reviewSuggestion.href,
						reviewSuggestion.icon,
						reviewSuggestion.title,
						reviewSuggestion.subtitle
					)}
				{/if}
				{#each otherSuggestions as suggestion (suggestion.id)}
					{@render suggTile(
						suggestion.href,
						suggestion.icon,
						suggestion.title,
						suggestion.subtitle
					)}
				{/each}
			</div>
		</div>
	{:else if !data.user}
		<div class="reveal" style="animation-delay: 120ms;">
			<ContinueCard
				href="/login"
				icon="🚀"
				title="Start your Arabic journey"
				subtitle="Sign in to track your progress and unlock personalized learning"
				variant="purple"
			/>
		</div>
	{/if}

	<!-- ── Learn ───────────────────────────────────────────────────────────── -->
	<div class="reveal" style="animation-delay: 240ms;">
		{@render sectionHead('🌱', 'Learn', 'build the foundation')}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{@render tile(
				'/alphabet',
				'✍️',
				'Alphabet',
				'The 28 letters, their forms, and how they connect.',
				'#0ea5e9',
				'#0369a1'
			)}
			{@render tile(
				'/lessons',
				'📚',
				'Lessons',
				'A structured path with exercises and pronunciation.',
				'#8b5cf6',
				'#6d28d9'
			)}
			{@render tile(
				'/review',
				'🧠',
				'Review',
				'Spaced repetition that schedules words to stick.',
				'#10b981',
				'#047857'
			)}
		</div>
	</div>

	<!-- ── Practice ───────────────────────────────────────────────────────── -->
	<div class="reveal pb-4" style="animation-delay: 300ms;">
		{@render sectionHead('🎯', 'Practice', 'use what you know')}
		<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
			{@render compactTile(
				'/learn/game',
				'🎮',
				'Game',
				'Vocab drills: multiple-choice, listening, speaking.',
				'#f59e0b',
				'#b45309'
			)}
			{@render compactTile(
				'/stories',
				'📖',
				'Stories',
				'Graded reading with tap-to-define and native audio.',
				'#8b5cf6',
				'#6d28d9'
			)}
			{@render compactTile(
				'/sentences',
				'📝',
				'Sentences',
				'Build sentences; drill grammar in context.',
				'#0ea5e9',
				'#0369a1'
			)}
			{@render compactTile(
				'/conjugations',
				'🔄',
				'Conjugations',
				'Drill verb conjugations across dialects by typing or quiz.',
				'#f43f5e',
				'#9f1239'
			)}
			{@render compactTile(
				'/speak',
				'🎤',
				'Speak',
				'Say sentences aloud and get instant feedback.',
				'#10b981',
				'#047857'
			)}
			{@render compactTile(
				'/tutor',
				'💬',
				'Tutor',
				'Chat with an AI tutor in any dialect.',
				'#6366f1',
				'#4338ca'
			)}
		</div>
	</div>
</section>

<style>
	/* Stats */
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.9rem 1rem;
		text-decoration: none;
		box-shadow: 0 4px 0 var(--tile5);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}

	a.stat:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 7px 0 var(--deep, var(--tile6));
	}
	a.stat:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--tile6);
	}
	.stat--static {
		box-shadow: 0 4px 0 var(--tile5);
	}

	.stat-label {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text2);
	}

	.stat-value {
		font-size: 1.9rem;
		font-weight: 600;
		line-height: 1;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.stat-unit {
		margin-left: 0.3rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text2);
	}

	/* Section headings */
	.sec-head {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-bottom: 0.85rem;
	}

	.sec-emoji {
		font-size: 1.15rem;
		line-height: 1;
	}

	.sec-head h2 {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.sec-sub {
		margin-left: auto;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border-radius: 100px;
		padding: 0.2rem 0.65rem;
	}

	/* Tiles */
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem;
		text-decoration: none;
		box-shadow: 0 4px 0 var(--tile5);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}

	.tile:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		box-shadow: 0 8px 0 var(--deep);
	}
	.tile:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep);
	}

	.tile--compact,
	.tile--sugg {
		flex-direction: row;
		align-items: center;
		gap: 0.65rem;
		padding: 0.8rem;
	}

	.tile-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
		transition: transform 0.22s ease-out;
	}

	.tile:hover .tile-icon {
		transform: rotate(-3deg) scale(1.05);
	}

	.tile-title {
		display: block;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text1);
	}

	.tile-desc {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text2);
	}

	/* Jump-back-in panel */
	.jump-panel {
		position: relative;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem 1.1rem;
	}

	.dismiss {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
		z-index: 10;
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		border: 2px solid var(--tile5);
		background: var(--tile4);
		color: var(--text2);
		cursor: pointer;
		transition:
			background 0.18s ease,
			color 0.18s ease,
			transform 0.16s ease;
	}
	.dismiss:hover {
		background: var(--tile5);
		color: var(--text1);
	}
	.dismiss:active {
		transform: scale(0.92);
	}
	.dismiss svg {
		width: 0.7rem;
		height: 0.7rem;
	}

	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.reveal {
		animation: reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			animation: none;
		}
		.tile,
		.stat,
		.tile-icon,
		.dismiss {
			transition: none;
		}
		.tile:hover,
		a.stat:hover {
			transform: none;
		}
		.tile:hover .tile-icon {
			transform: none;
		}
	}
</style>
