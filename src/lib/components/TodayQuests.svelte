<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { GoalItem } from '$lib/constants/daily-goal';
	import type { QuestProgress, QuestsState } from '$lib/constants/quests';
	import type { TodayPath, TodayStep } from '$lib/helpers/today-path';
	import { startTodayFlow } from '$lib/helpers/today-flow';
	import { XP_AWARDS } from '$lib/helpers/xp-levels';
	import { applyTodayQuests, claimReward, todayQuests } from '$lib/stores/today-quests.svelte';
	import { trackEvent } from '$lib/analytics';
	import GoalPicker from './GoalPicker.svelte';

	interface Props {
		path: TodayPath;
		quests: QuestsState;
		/** Their saved goal, or null when the main quest uses the default steps. */
		goal: GoalItem[] | null;
		streak: number;
	}

	let { path, quests, goal, streak }: Props = $props();

	let editing = $state(false);

	// Server data seeds the shared store; the tracker and later refreshes update it.
	$effect(() => {
		const next = { path, quests };
		untrack(() => applyTodayQuests(next));
	});

	const main = $derived(todayQuests.data?.path ?? path);
	const side = $derived(todayQuests.data?.quests ?? quests);
	const bonus = XP_AWARDS.quests_bonus;

	function go(step: TodayStep) {
		startTodayFlow();
		trackEvent('today_step_started', { kind: step.kind });
	}
</script>

{#snippet sideRow(q: QuestProgress)}
	<span class="box" aria-hidden="true">{q.complete ? '✓' : ''}</span>
	<span class="label">
		{q.label}
		{#if q.hint && !q.complete}<span class="hint">{q.hint}</span>{/if}
	</span>
	{#if q.target > 1}
		<span class="bar" aria-hidden="true">
			<span class="fill" style="width: {(q.done / q.target) * 100}%"></span>
		</span>
		<span class="count">{q.done}/{q.target}</span>
	{/if}
	{#if q.complete}<span class="sr-only">(done)</span>{/if}
{/snippet}

<div class="card">
	{#if editing}
		<GoalPicker initial={goal ?? []} onClose={() => (editing = false)} />
	{:else}
		<h2 class="title">Today’s quests</h2>

		<!-- Main quest: their own goal, in order, one button -->
		<section class="part" class:is-done={main.allDone} aria-labelledby="main-quest">
			<div class="part-head">
				<h3 id="main-quest" class="kicker">Main quest</h3>
				<span class="meta">{main.completed} of {main.steps.length}</span>
			</div>
			<ol class="rows">
				{#each main.steps as step (step.kind)}
					{@const isNext = step.kind === main.next?.kind}
					<li>
						<a
							href={resolve(step.href as Pathname)}
							class="row"
							class:is-complete={step.complete}
							class:is-next={isNext}
							onclick={() => go(step)}
						>
							<span class="dot" aria-hidden="true">{step.complete ? '✓' : isNext ? '▶' : ''}</span>
							<span class="label">{step.label}</span>
							{#if step.target > 1}
								<span class="count">{step.done}/{step.target}</span>
							{/if}
							{#if step.complete}<span class="sr-only">(done)</span>{/if}
						</a>
					</li>
				{/each}
			</ol>
			<div class="actions">
				{#if main.next}
					<a
						href={resolve(main.next.href as Pathname)}
						class="cta"
						onclick={() => main.next && go(main.next)}
					>
						{main.completed === 0 ? 'Start' : 'Continue'} <span aria-hidden="true">→</span>
					</a>
				{:else}
					<p class="done-note">
						Main quest done{streak > 0 ? ` · ${streak}-day streak` : ''}.
						<a href={resolve('/learn/game')} class="link">Practise more</a>
					</p>
				{/if}
				<button type="button" class="link edit" onclick={() => (editing = true)}>
					{goal ? 'Edit main quest' : 'Choose your main quest'}
				</button>
			</div>
		</section>

		<!-- Side quests: picked by the app, with a reward -->
		{#if side.items.length}
			<section class="part side" class:is-done={side.claimed} aria-labelledby="side-quests">
				<div class="part-head">
					<h3 id="side-quests" class="kicker">Side quests</h3>
					<span class="meta">{side.completed} of {side.items.length} · +{bonus} XP</span>
				</div>
				<ul class="rows">
					{#each side.items as q (q.id)}
						<li>
							{#if q.href}
								<a href={resolve(q.href as Pathname)} class="row" class:is-complete={q.complete}>
									{@render sideRow(q)}
								</a>
							{:else}
								<!-- Done along the way, so there's nowhere to send them. -->
								<div class="row" class:is-complete={q.complete}>{@render sideRow(q)}</div>
							{/if}
						</li>
					{/each}
				</ul>
				<p class="foot" role="status">
					{#if side.claimed}
						+{bonus} XP earned{todayQuests.freezeEarned ? ', and a streak freeze' : ''}. New side
						quests tomorrow.
					{:else if todayQuests.claim === 'sending'}
						Adding your bonus…
					{:else if todayQuests.claim === 'failed'}
						We couldn’t add your bonus. <button type="button" class="link" onclick={claimReward}
							>Try again</button
						>
					{:else if side.weekClaims >= side.daysForFreeze}
						You’ve earned this week’s streak freeze.
					{:else}
						{side.weekClaims} of {side.daysForFreeze} side-quest days this week → earn a streak freeze
					{/if}
				</p>
			</section>
		{/if}
	{/if}
</div>

<style>
	.card {
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem 1.1rem;
	}

	.title {
		font-size: 1.2rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.part {
		margin-top: 0.85rem;
	}

	.side {
		border-top: 2px dashed var(--tile5);
		padding-top: 0.85rem;
	}

	.part-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.kicker {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text2);
	}

	.is-done .kicker {
		color: #16a34a;
	}

	.side.is-done .kicker {
		color: #d97706;
	}

	.meta {
		font-size: 0.82rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text2);
	}

	.rows {
		display: grid;
		gap: 0.4rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		border-radius: 0.9rem;
		border: 2px solid transparent;
		padding: 0.55rem 0.7rem;
		background: var(--tile2);
		font-weight: 600;
		color: var(--text1);
		text-decoration: none;
		transition: background 0.18s ease;
	}

	a.row:hover {
		background: var(--tile4);
	}

	.row.is-next {
		border-color: #22c55e;
	}

	.row.is-complete .label {
		color: var(--text2);
		text-decoration: line-through;
	}

	.dot,
	.box {
		display: grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		flex-shrink: 0;
		border-radius: 50%;
		border: 2px solid var(--tile6);
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--text2);
	}

	.box {
		border-radius: 0.35rem;
		color: #fff;
	}

	.is-next .dot {
		border-color: #22c55e;
		color: #22c55e;
	}

	.is-complete .dot {
		border-color: #15803d;
		background: #22c55e;
		color: #fff;
	}

	.is-complete .box {
		border-color: #b45309;
		background: #f59e0b;
	}

	.label {
		min-width: 0;
		flex: 1;
	}

	.hint {
		display: block;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--text2);
	}

	.bar {
		width: 3.5rem;
		height: 0.4rem;
		flex-shrink: 0;
		border-radius: 100px;
		background: var(--tile5);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: #f59e0b;
		transition: width 0.4s ease;
	}

	.count {
		min-width: 2.3rem;
		text-align: right;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--text2);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.9rem;
		margin-top: 0.85rem;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 100px;
		padding: 0.7rem 1.7rem;
		font-weight: 700;
		color: #fff;
		text-decoration: none;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
	}

	.cta:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}

	.done-note,
	.foot {
		font-size: 0.88rem;
		color: var(--text2);
	}

	.foot {
		margin-top: 0.65rem;
	}

	.link {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.link:hover {
		color: var(--text1);
	}

	.edit {
		margin-left: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.fill {
			transition: none;
		}
	}
</style>
