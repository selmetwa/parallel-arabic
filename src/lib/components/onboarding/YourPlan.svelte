<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { CEFR_LEVEL_INFO, type CefrLevel } from '$lib/constants/cefr-levels';
	import {
		enablePush,
		pushPermission,
		snoozePushPrompt
	} from '$lib/helpers/push-notifications';
	import { trackEvent } from '$lib/analytics';
	import type { FirstLesson } from '$lib/helpers/first-lesson';
	import type { TryProgress } from '$lib/constants/onboarding-try';
	import { describeGoal } from '$lib/constants/daily-goal';

	interface Props {
		proficiencyLevel: CefrLevel | '';
		goalLevel: CefrLevel | '';
		tried: TryProgress;
		lesson: FirstLesson;
		isNative: boolean;
		onStart: (destination: string) => void;
	}

	let { proficiencyLevel, goalLevel, tried, lesson, isNative, onStart }: Props = $props();

	/** Long enough that the generic reminder banner doesn't re-ask straight after this screen. */
	const SNOOZE_AFTER_PLAN_MS = 14 * 24 * 60 * 60 * 1000;

	// Only offered when iOS can still show its one-time dialog.
	let canAskForPush = $state(false);
	let reminder = $state<'unasked' | 'on' | 'declined'>('unasked');

	onMount(async () => {
		if (isNative) canAskForPush = (await pushPermission()) === 'prompt';
	});

	const goalCaption = $derived(goalLevel ? CEFR_LEVEL_INFO[goalLevel].goal : '');

	const checklist = $derived([
		{ label: 'Your first sentence: read, said, written', done: tried.read || tried.spoke || tried.traced },
		{ label: lesson.title, done: false },
		{
			label: tried.goal ? `Today's goal: ${describeGoal(tried.goal)}` : "Today's challenge",
			done: false
		}
	]);

	async function remindMe() {
		snoozePushPrompt(SNOOZE_AFTER_PLAN_MS);
		const allowed = await enablePush();
		reminder = allowed ? 'on' : 'declined';
		trackEvent('onboarding_reminder_answered', { allowed });
	}

	function notNow() {
		snoozePushPrompt(SNOOZE_AFTER_PLAN_MS);
		reminder = 'declined';
		trackEvent('onboarding_reminder_answered', { allowed: false, dismissed: true });
	}

	function start(destination: string) {
		trackEvent('onboarding_plan_destination_chosen', { destination });
		onStart(destination);
	}
</script>

<div class="mx-auto max-w-md" in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
	<div class="mb-6 text-center">
		<h2 class="plan-title">Your plan</h2>
		{#if proficiencyLevel && goalLevel}
			<div class="path" aria-label="From {proficiencyLevel} to {goalLevel}">
				<span class="level-chip">{proficiencyLevel}</span>
				<span class="path-line" aria-hidden="true"></span>
				<span class="level-chip level-chip--goal">{goalLevel}</span>
			</div>
			<p class="goal-caption">“{goalCaption}”</p>
		{:else}
			<p class="plan-sub">Three small steps to get you going.</p>
		{/if}
	</div>

	<ol class="checklist">
		{#each checklist as item, i (i)}
			<li class="check-item {item.done ? 'is-done' : ''} {i === 1 ? 'is-next' : ''}">
				<span class="check-dot" aria-hidden="true">
					{#if item.done}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						{i + 1}
					{/if}
				</span>
				<span class="check-label">{item.label}</span>
				{#if item.done}<span class="sr-only">(done)</span>{/if}
			</li>
		{/each}
	</ol>

	{#if canAskForPush && reminder === 'unasked'}
		<div class="reminder">
			<p class="reminder-title">Practise a little every day?</p>
			<p class="reminder-sub">One reminder a day at most, and only if you haven't practised yet.</p>
			<div class="reminder-actions">
				<button type="button" class="pill pill--on" onclick={remindMe}>Remind me daily</button>
				<button type="button" class="pill" onclick={notNow}>Not now</button>
			</div>
		</div>
	{:else if reminder === 'on'}
		<p class="reminder-done">🔔 Daily reminder on.</p>
	{:else if !isNative}
		<p class="reminder-done">We'll email you if you miss a day. You can turn that off in your profile.</p>
	{/if}

	<div class="mt-7 flex flex-col items-center gap-3">
		<button type="button" class="press" onclick={() => start(lesson.href)}>
			Start: {lesson.title}
		</button>
		<button type="button" class="secondary" onclick={() => start('/tutor')}>
			Talk to the tutor instead
		</button>
	</div>
</div>

<style>
	.plan-title {
		font-size: 1.6rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
		margin-bottom: 0.9rem;
	}

	.plan-sub {
		font-size: 0.95rem;
		color: var(--text2);
	}

	.path {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		margin-bottom: 0.6rem;
	}

	.path-line {
		width: 5rem;
		height: 3px;
		border-radius: 100px;
		background: linear-gradient(90deg, var(--tile6), var(--brand));
	}

	.level-chip {
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.25rem 0.8rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text2);
	}

	.level-chip--goal {
		border-color: var(--brand);
		color: var(--text1);
	}

	.goal-caption {
		font-size: 1.05rem;
		font-style: italic;
		color: var(--brand);
		text-wrap: balance;
	}

	.checklist {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.75rem 1rem;
	}

	.check-item.is-next {
		border-color: var(--brand);
	}

	.check-dot {
		display: grid;
		place-items: center;
		width: 1.7rem;
		height: 1.7rem;
		flex-shrink: 0;
		border-radius: 50%;
		border: 2px solid var(--tile5);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text2);
	}

	.check-dot svg {
		width: 0.85rem;
		height: 0.85rem;
	}

	.is-done .check-dot {
		border-color: #15803d;
		background: #22c55e;
		color: #fff;
	}

	.check-label {
		font-weight: 600;
		color: var(--text1);
	}

	.is-done .check-label {
		color: var(--text2);
		text-decoration: line-through;
	}

	.reminder {
		margin-top: 1.25rem;
		border-radius: 1rem;
		background: var(--tile4);
		padding: 1rem;
		text-align: center;
	}

	.reminder-title {
		font-weight: 700;
		color: var(--text1);
	}

	.reminder-sub {
		margin-top: 0.2rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.reminder-actions {
		margin-top: 0.8rem;
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.reminder-done {
		margin-top: 1.25rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.pill {
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.45rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
	}

	.pill--on {
		border-color: var(--brand);
		background: var(--brand);
		color: #fff;
	}

	.press {
		border-radius: 100px;
		padding: 0.8rem 2.1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 5px 0 #15803d;
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease;
	}

	.press:active {
		transform: translateY(5px);
		box-shadow: 0 0 0 #15803d;
	}

	.secondary {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	@media (prefers-reduced-motion: reduce) {
		.press {
			transition: none;
		}
		.press:active {
			transform: none;
		}
	}
</style>
