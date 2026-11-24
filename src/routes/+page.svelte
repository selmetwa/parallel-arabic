<!-- Design · editorial dashboard · theme-aware (HSL hue-200) · ReadexPro -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { puzzleNumber } from '$lib/games/daily-root';
	import { gameOfTheDay } from '$lib/games/today';
	import { getGame } from '$lib/constants/games';
	import { resolve } from '$app/paths';
	import { currentDialect } from '$lib/store/store';
	import type { PageData } from './$types';
	import ContinueCard from '$lib/components/ContinueCard.svelte';
	import WordOfTheDay from '$lib/components/WordOfTheDay.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import ArabicMap from '$lib/components/ArabicMap.svelte';
	import WeekStrip from '$lib/components/WeekStrip.svelte';
	import TodayQuests from '$lib/components/TodayQuests.svelte';
	import { parseGoal } from '$lib/constants/daily-goal';

	let { data }: { data: PageData } = $props();

	// Masthead greeting — neutral defaults render identically on server & client to
	// avoid a hydration mismatch; the time-of-day variant is filled in onMount.
	let greetingEn = $state('Welcome');
	let greetingAr = $state('أهلاً');
	let todayLabel = $state('');

	// Same deep link as the sidebar: straight to the learner's dialect.
	const lessonsHref = $derived(`/lessons/structured/${data.targetDialect || 'egyptian-arabic'}`);

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
	});
</script>

<section class="mx-auto max-w-6xl space-y-7 px-3 pb-12 pt-6 sm:px-8">
	<!-- ── Snippets ──────────────────────────────────────────────────────────── -->

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

	<!-- ── Today's quests: main quest (their goal, in order) + side quests ─── -->
	{#if data.todayPath && data.quests}
		<div class="reveal">
			<TodayQuests
				path={data.todayPath}
				quests={data.quests}
				goal={parseGoal(data.user?.daily_goal)}
				streak={data.currentStreak ?? 0}
			/>
		</div>
	{/if}

	<!-- ── Pick up where you left off: a lesson or game left part-way ──────── -->
	{#if data.resume?.length}
		<div class="reveal" style="animation-delay: 40ms;">
			{@render sectionHead('⏯️', 'Pick up where you left off', '')}
			<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
				{#each data.resume as item (item.id)}
					<ContinueCard
						href={item.href}
						icon={item.icon}
						title={item.title}
						subtitle={item.subtitle}
						variant={item.variant}
						compact
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Week strip ──────────────────────────────────────────────────────── -->
	{#if data.user && data.weekActivityDates}
		<div class="reveal" style="animation-delay: 60ms;">
			<WeekStrip
				weekActivityDates={data.weekActivityDates}
				weekStartTimestamp={data.weekStartTimestamp}
			/>
		</div>
	{/if}

	<!-- ── First run: one clear next step ──────────────────────────────────── -->
	{#if data.firstRun}
		<div class="reveal jump-panel start-here" style="animation-delay: 120ms;">
			<div class="sec-head">
				<span class="sec-emoji" aria-hidden="true">🧭</span>
				<h2>Start here</h2>
			</div>
			<ol class="start-list">
				{#each [{ label: 'Your first conversation', done: data.firstRun.conversationDone }, { label: data.firstRun.lesson.title, done: false }, { label: 'Today’s challenge', done: false }] as item, i (i)}
					<li class="start-item {item.done ? 'is-done' : ''}">
						<span class="start-dot" aria-hidden="true">{item.done ? '✓' : i + 1}</span>
						<span>{item.label}</span>
						{#if item.done}<span class="sr-only">(done)</span>{/if}
					</li>
				{/each}
			</ol>
			<a href={resolve(data.firstRun.lesson.href)} class="start-cta">
				Start: {data.firstRun.lesson.title} <span aria-hidden="true">→</span>
			</a>
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

	<!-- ── Today's challenge ───────────────────────────────────────────────── -->
	<div class="reveal" style="animation-delay: 220ms;">
		{@render tile(
			'/learn/game/today',
			'📅',
			'Today’s challenge',
			`Daily Root + ${getGame(gameOfTheDay(puzzleNumber()))?.name}. About three minutes; keeps your streak going.`,
			'#22c55e',
			'#15803d'
		)}
	</div>

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
				lessonsHref,
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
				'Games',
				'Word games and a vocabulary quiz.',
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

	.tile--compact {
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
	.start-here {
		border-color: var(--brand);
	}

	.start-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin-bottom: 1rem;
	}

	.start-item {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		font-weight: 600;
		color: var(--text1);
	}

	.start-item.is-done {
		color: var(--text2);
		text-decoration: line-through;
	}

	.start-dot {
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		flex-shrink: 0;
		border-radius: 50%;
		border: 2px solid var(--tile5);
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text2);
		text-decoration: none;
	}

	.is-done .start-dot {
		border-color: #15803d;
		background: #22c55e;
		color: #fff;
	}

	.start-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 100px;
		padding: 0.7rem 1.6rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
		text-decoration: none;
	}

	.start-cta:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}

	.jump-panel {
		position: relative;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem 1.1rem;
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
		.tile-icon {
			transition: none;
		}
		.tile:hover {
			transform: none;
		}
		.tile:hover .tile-icon {
			transform: none;
		}
	}
</style>
