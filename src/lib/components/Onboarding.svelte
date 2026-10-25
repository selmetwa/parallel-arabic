<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut, backOut } from 'svelte/easing';
	import { currentDialect } from '$lib/store/store';
	import { goto } from '$app/navigation';
	import OnboardingConversation from '$lib/components/onboarding/OnboardingConversation.svelte';
	import LevelSlider from '$lib/components/onboarding/LevelSlider.svelte';
	import DialectPicker from '$lib/components/onboarding/DialectPicker.svelte';
	import YourPlan from '$lib/components/onboarding/YourPlan.svelte';
	import BuildingPlan from '$lib/components/onboarding/BuildingPlan.svelte';
	import ReadSentence from '$lib/components/onboarding/ReadSentence.svelte';
	import TraceWord from '$lib/components/onboarding/TraceWord.svelte';
	import TryScramble from '$lib/components/onboarding/TryScramble.svelte';
	import { onboardingLines, onboardingScenario } from '$lib/constants/tutor-scenarios';
	import {
		NOTHING_TRIED,
		scrambleSentences,
		tryContent,
		type TryProgress
	} from '$lib/constants/onboarding-try';
	import type { GameDialect } from '$lib/games/themes';
	import {
		CHALLENGES,
		CHALLENGE_FOCUS,
		DAILY_MINUTES,
		MINUTES_LABEL,
		REMINDER_OPTIONS,
		STREAK_GOALS,
		buildGoal,
		challengeHelp,
		wordsPerMonth,
		type ChallengeId,
		type DailyMinutes,
		type ReminderWindow
	} from '$lib/constants/onboarding-questions';
	import { enablePush, pushPermission, snoozePushPrompt } from '$lib/helpers/push-notifications';
	import { FEATURES } from '$lib/constants/features';
	import { firstLesson } from '$lib/helpers/first-lesson';
	import TrialOffer from '$lib/components/TrialOffer.svelte';
	import { CEFR_LEVELS, type CefrLevel } from '$lib/constants/cefr-levels';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { isNativeApp } from '$lib/helpers/is-native-app';
	import { trackEvent } from '$lib/analytics';
	import type { Dialect } from '$lib/types';
	import { isSelectableDialect } from '$lib/constants/dialects';

	type Props = {
		isOpen: boolean;
		handleCloseModal: () => void;
	};

	let { isOpen = false, handleCloseModal = () => {} }: Props = $props();

	const STEP = {
		WELCOME: 0,
		DIALECT: 1,
		REASON: 2,
		CHALLENGES: 3,
		/** How the app answers what they picked: one card per challenge. */
		HELP: 4,
		LEVEL: 5,
		GOAL: 6,
		// Habit questions: time a day, reminder time, streak (docs/onboarding-questions-plan.md).
		DAILY_TIME: 7,
		REMINDER: 8,
		STREAK: 9,
		// "Try it": one dialog, read, said, traced and played (docs/onboarding-v4-plan.md).
		READ: 10,
		CONVERSATION: 11,
		TRACE: 12,
		PLAY: 13,
		/** A short narrated pause between the Try-it steps and the plan. */
		BUILDING: 14,
		PLAN: 15,
		TRIAL: 16
	} as const;

	/** The header stepper shows one group at a time: about you, your habit, then Try it. */
	const STEPPER_STEPS = [STEP.DIALECT, STEP.REASON, STEP.CHALLENGES, STEP.LEVEL, STEP.GOAL];
	const HABIT_STEPS = [STEP.DAILY_TIME, STEP.REMINDER, STEP.STREAK];
	const TRY_STEPS = [STEP.READ, STEP.CONVERSATION, STEP.TRACE, STEP.PLAY];

	/** How far above their current level we pre-set someone's goal. */
	const GOAL_OFFSET = 2;

	let step = $state<number>(STEP.WELCOME);
	let targetDialect = $state('');
	let learningReason = $state('');
	let proficiencyLevel = $state<CefrLevel | ''>('');
	let goalLevel = $state<CefrLevel | ''>('');
	let isSubmitting = $state(false);
	let error = $state('');
	let tried = $state<TryProgress>({ ...NOTHING_TRIED });
	// Habit answers; null when the screen was skipped.
	let challenges = $state<ChallengeId[]>([]);
	let dailyMinutes = $state<DailyMinutes | null>(15);
	let reminderWindow = $state<ReminderWindow | null>(null);
	let streakGoal = $state<number | null>(7);

	// Web gets the Stripe trial offer; iOS gets the same step with Apple's
	// plans and trial (TrialOffer/SubscribeButton never show Stripe in the app).
	// isNative stays null until mount, so nothing shows before the check.
	let isNative = $state<boolean | null>(null);
	let pendingDestination = $state('/');
	// Paywall group, assigned by /api/onboarding. 'hard' (web test) and
	// 'hard_ios' (every new iOS signup) hide the skip link.
	let paywallVariant = $state<string | null>(null);
	const isHardPaywall = $derived(paywallVariant === 'hard' || paywallVariant === 'hard_ios');

	onMount(() => {
		isNative = isNativeApp();
	});

	// Keep the page behind from scrolling while onboarding is up, as PaywallModal does.
	$effect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	// Accents match the dialect colours used across the rest of the app.
	const dialects = [
		{
			id: 'egyptian-arabic',
			label: 'Egyptian',
			emoji: '🇪🇬',
			description: 'Most widely understood dialect',
			accent: '#f59e0b',
			deep: '#b45309'
		},
		{
			id: 'levantine',
			label: 'Levantine',
			emoji: '🇱🇧',
			description: 'Syria, Lebanon, Palestine, Jordan',
			accent: '#10b981',
			deep: '#047857'
		},
		{
			id: 'fusha',
			label: 'MSA (Fusha)',
			emoji: '📖',
			description: 'Formal Arabic of news and books, shared across the Arab world',
			accent: '#8b5cf6',
			deep: '#6d28d9'
		},
		{
			id: 'darija',
			label: 'Moroccan',
			emoji: '🇲🇦',
			description: 'Unique North African dialect',
			accent: '#f43f5e',
			deep: '#9f1239'
		},
		{
			id: 'iraqi',
			label: 'Iraqi',
			emoji: '🇮🇶',
			description: 'Baghdad, Basra and across Iraq',
			accent: '#dc2626',
			deep: '#991b1b'
		},
		{
			id: 'khaleeji',
			label: 'Khaleeji',
			emoji: '🇦🇪',
			description: 'UAE, Kuwait, Qatar, Bahrain and Oman',
			accent: '#c026d3',
			deep: '#86198f'
		},
		{
			id: 'saudi',
			label: 'Saudi',
			emoji: '🇸🇦',
			description: 'Jeddah, Mecca and the Hijaz',
			accent: '#2563eb',
			deep: '#1e40af'
		}
	].filter((d) => isSelectableDialect(d.id));

	const learningReasons = [
		{ id: 'Travel', label: 'Travel', emoji: '✈️', accent: '#0ea5e9', deep: '#0369a1' },
		{ id: 'Work', label: 'Work', emoji: '💼', accent: '#f59e0b', deep: '#b45309' },
		{ id: 'Heritage', label: 'Heritage', emoji: '🌍', accent: '#10b981', deep: '#047857' },
		{ id: 'Academic', label: 'Academic', emoji: '🎓', accent: '#8b5cf6', deep: '#6d28d9' },
		{ id: 'Personal Interest', label: 'Interest', emoji: '❤️', accent: '#f43f5e', deep: '#9f1239' },
		{ id: 'Other', label: 'Other', emoji: '✨', accent: '#6366f1', deep: '#4338ca' }
	];

	// One entry per step, indexed by the STEP values above.
	const stepInfo = [
		{ title: 'Welcome', subtitle: '' },
		{ title: 'Dialect', subtitle: 'Choose your focus' },
		{ title: 'Goals', subtitle: 'Why are you learning?' },
		{ title: 'Challenges', subtitle: "What's hard for you?" },
		{ title: 'Challenge help', subtitle: '' },
		{ title: 'Level', subtitle: 'Where are you now?' },
		{ title: 'Target', subtitle: 'Where do you want to get to?' },
		{ title: 'Daily time', subtitle: 'Make it a habit' },
		{ title: 'Reminder', subtitle: 'Make it a habit' },
		{ title: 'Streak goal', subtitle: 'Make it a habit' },
		{ title: 'Read', subtitle: 'Read it' },
		{ title: 'Practice', subtitle: 'Say it' },
		{ title: 'Trace', subtitle: 'Write it' },
		{ title: 'Play', subtitle: 'Play with it' },
		{ title: 'Building', subtitle: '' },
		{ title: 'Plan', subtitle: '' },
		{ title: 'Trial', subtitle: '' }
	];

	/** "for travel", "for work"… what the plan starts with, from their reason. */
	const REASON_FOCUS: Record<string, string> = {
		Travel: 'Starting with conversations for travel',
		Work: 'Starting with conversations for work',
		Heritage: 'Starting with conversations about family',
		Academic: 'Starting with the foundations for study'
	};

	let chosenDialectName = $derived.by(() => {
		if (targetDialect === 'fusha') return 'Modern Standard Arabic';
		const d = dialects.find((d) => d.id === targetDialect);
		return d ? `${d.label} Arabic` : '';
	});

	let lesson = $derived(firstLesson(targetDialect, proficiencyLevel, page.data.isSubscribed === true));

	/** How the app answers each challenge they picked, in their order (up to three on the help screen). */
	let helps = $derived(
		challenges.map((id) => ({
			id,
			label: CHALLENGES.find((c) => c.id === id)?.label ?? '',
			...challengeHelp(id, targetDialect, chosenDialectName)
		}))
	);
	let helpCards = $derived(
		helps.slice(0, 3).map((h) => ({ ...h, shot: FEATURES.find((f) => f.slug === h.feature)?.hero }))
	);
	/** The plan's first stop: the place that answers their first challenge, if it has one. */
	let focusStart = $derived(helps.find((h) => h.start)?.start ?? null);
	/** On a Try-it step that tackles one of their challenges, which one. */
	let tryFocus = $derived.by(() => {
		const key = step === STEP.READ ? 'read' : step === STEP.CONVERSATION ? 'conversation' : step === STEP.PLAY ? 'play' : null;
		return key ? (helps.find((h) => h.tryStep === key) ?? null) : null;
	});

	let buildingLines = $derived([
		goalLevel && goalLevel !== proficiencyLevel
			? `${chosenDialectName}, ${proficiencyLevel} to ${goalLevel}`
			: `${chosenDialectName}, from ${proficiencyLevel}`,
		REASON_FOCUS[learningReason] ?? 'Starting with everyday conversations',
		...(challenges.length
			? [`Focusing on ${challenges.slice(0, 2).map((c) => CHALLENGE_FOCUS[c]).join(' and ')}`]
			: []),
		lesson.title === 'Your first lesson' ? 'Picking your first lesson' : `Picking your first lesson: ${lesson.title}`
	]);

	$effect(() => {
		if (isOpen) trackEvent('onboarding_step_viewed', { step: stepInfo[step].title.toLowerCase() });
	});

	// One dialog for the whole Try-it section, picked from their reason.
	let scenario = $derived(onboardingScenario(learningReason, targetDialect as Dialect));
	let dialog = $derived(scenario?.dialogs[targetDialect as Dialect]);
	let tryData = $derived(tryContent(scenario, targetDialect as Dialect));
	// The scramble rebuilds the learner's own lines from the conversation.
	let sentences = $derived(scrambleSentences(onboardingLines(scenario, targetDialect as Dialect)));

	let inTry = $derived(TRY_STEPS.includes(step as (typeof TRY_STEPS)[number]));
	let inHabit = $derived(HABIT_STEPS.includes(step as (typeof HABIT_STEPS)[number]));
	let stepperSteps = $derived<readonly number[]>(
		inTry ? TRY_STEPS : inHabit ? HABIT_STEPS : STEPPER_STEPS
	);
	let showStepper = $derived(
		inTry || inHabit || STEPPER_STEPS.includes(step as (typeof STEPPER_STEPS)[number])
	);

	/** Read and Trace need written content, Play needs the conversation; without them they're left out. */
	function nextTryStep(from: number): number {
		for (const s of TRY_STEPS.slice(TRY_STEPS.indexOf(from as (typeof TRY_STEPS)[number]) + 1)) {
			if (s === STEP.PLAY ? sentences.length > 0 : tryData || s === STEP.CONVERSATION)
				return s;
		}
		return STEP.BUILDING;
	}

	/** Every Try-it step ends here, whether it was done or skipped. */
	function finishTryStep(key: 'read' | 'spoke' | 'traced' | 'played' | null, done: boolean) {
		if (key) tried[key] = done;
		trackEvent(done ? 'onboarding_try_done' : 'onboarding_try_skipped', {
			step: stepInfo[step].title.toLowerCase()
		});
		step = nextTryStep(step);
	}

	function nextStep() {
		if (step === STEP.WELCOME) {
			step += 1;
			return;
		}
		if (step === STEP.DIALECT && !targetDialect) return;
		if (step === STEP.REASON && !learningReason) return;
		if (step === STEP.LEVEL) {
			if (!proficiencyLevel) return;
			applyGoalDefault();
			step = STEP.GOAL;
			return;
		}
		if (step === STEP.GOAL) {
			if (!goalLevel) return;
			step = STEP.DAILY_TIME;
			return;
		}
		if (step === STEP.CHALLENGES) {
			if (!challenges.length) return;
			trackEvent('onboarding_challenges_chosen', { challenges });
		}
		if (step === STEP.DAILY_TIME) {
			if (!dailyMinutes) return;
			trackEvent('onboarding_minutes_chosen', { minutes: dailyMinutes });
		}
		if (step === STEP.STREAK) {
			if (!streakGoal) return;
			trackEvent('onboarding_streak_goal_chosen', { days: streakGoal });
			handleSubmit();
			return;
		}
		step += 1;
	}

	/** The footer's Skip: leaves this screen's answer empty and moves on. */
	function skipStep() {
		if (step === STEP.CHALLENGES) {
			challenges = [];
			step = STEP.LEVEL;
			return;
		} else if (step === STEP.GOAL) goalLevel = '';
		else if (step === STEP.DAILY_TIME) dailyMinutes = null;
		else if (step === STEP.REMINDER) reminderWindow = null;
		else if (step === STEP.STREAK) {
			streakGoal = null;
			handleSubmit();
			return;
		} else {
			nextStep();
			return;
		}
		step += 1;
	}

	function toggleChallenge(id: ChallengeId) {
		challenges = challenges.includes(id) ? challenges.filter((c) => c !== id) : [...challenges, id];
	}

	/** Long enough that the generic reminder banner doesn't re-ask straight after onboarding. */
	const SNOOZE_AFTER_ONBOARDING_MS = 14 * 24 * 60 * 60 * 1000;

	/**
	 * They picked when to be reminded. In the app this is where iOS asks for
	 * notification permission; on the web the time applies to the streak email.
	 */
	async function chooseReminder(id: ReminderWindow) {
		reminderWindow = id;
		trackEvent('onboarding_reminder_chosen', { window: id });
		if (id !== 'off' && isNative && (await pushPermission()) === 'prompt') {
			snoozePushPrompt(SNOOZE_AFTER_ONBOARDING_MS);
			const allowed = await enablePush();
			trackEvent('onboarding_reminder_answered', { allowed });
		}
		step = STEP.STREAK;
	}

	function prevStep() {
		// With nothing picked there was no help screen on the way here.
		if (step === STEP.LEVEL && !challenges.length) step = STEP.CHALLENGES;
		else if (step > 0) step -= 1;
	}

	/**
	 * Opens the goal screen a couple of levels ahead, and pulls a goal that now sits
	 * below the current level (they went back and raised it) back up to a sane target.
	 */
	function applyGoalDefault() {
		const currentIndex = CEFR_LEVELS.indexOf(proficiencyLevel as CefrLevel);
		if (currentIndex < 0) return;

		const goalIndex = goalLevel ? CEFR_LEVELS.indexOf(goalLevel) : -1;
		if (goalIndex >= currentIndex) return;

		goalLevel = CEFR_LEVELS[Math.min(CEFR_LEVELS.length - 1, currentIndex + GOAL_OFFSET)];
	}

	function selectDialect(id: string) {
		targetDialect = id;
		currentDialect.set(id);
	}

	function selectReason(id: string) {
		learningReason = id;
		setTimeout(() => nextStep(), 400);
	}

	async function handleSubmit() {
		if (!targetDialect || !learningReason || !proficiencyLevel) {
			error = 'Please complete all steps';
			return;
		}

		if (isSubmitting) return;

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					target_dialect: targetDialect,
					learning_reason: learningReason,
					proficiency_level: proficiencyLevel,
					goal_level: goalLevel || null,
					platform: isNative ? 'native' : 'web',
					learning_challenges: challenges,
					daily_minutes: dailyMinutes,
					reminder_window: reminderWindow,
					streak_goal: streakGoal
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to save onboarding data');
			}
			paywallVariant = data.variant ?? null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			isSubmitting = false;
			return;
		}

		isSubmitting = false;
		// The time they have is their daily goal now; the plan and trial offer recap it.
		tried.goal = dailyMinutes ? buildGoal(dailyMinutes, challenges, targetDialect) : null;
		step = tryData ? STEP.READ : STEP.CONVERSATION;
	}

	function getStaggerDelay(index: number) {
		return index * 80;
	}

	async function finishOnboarding(destination: string) {
		trackEvent('onboarding_exit', { destination, conversation_done: tried.spoke });
		handleCloseModal();
		await goto(destination, { replaceState: true });
	}

	function handleConversationFinish(completed: boolean) {
		finishTryStep('spoke', completed);
	}

	/**
	 * They picked where to start. Eligible web users and new iOS signups get the
	 * trial offer before they leave; everyone else goes straight there. On iOS,
	 * TrialOffer asks Apple whether to say "free trial".
	 */
	async function handlePlanStart(destination: string) {
		pendingDestination = destination;

		const showOffer =
			isNative === false ? page.data.trialEligible === true : paywallVariant === 'hard_ios';
		if (showOffer) {
			trackEvent('trial_offer_shown', { placement: 'onboarding', variant: paywallVariant });
			step = STEP.TRIAL;
			return;
		}

		await finishOnboarding(destination);
	}

	async function skipTrial() {
		trackEvent('trial_offer_skipped', { placement: 'onboarding' });
		await finishOnboarding(pendingDestination);
	}
</script>

{#if isOpen}
	<div
		class="onboarding-bg fixed inset-0 z-50 h-dvh overflow-hidden"
		transition:fade={{ duration: 300 }}
	>
		<div class="relative flex h-full w-full flex-col">
			<!-- Header with Progress -->
			{#if showStepper}
				<div class="px-4 pb-2 pt-5 sm:px-8 sm:pt-7">
					<div class="mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
						{#each stepperSteps as stepperStep, i (stepperStep)}
							<!-- Try-it steps can't be revisited: the conversation would award XP twice. -->
							<button
								type="button"
								class="step {stepperStep === step ? 'is-on' : ''} {stepperStep < step
									? 'is-done'
									: ''}"
								onclick={() => {
									if (!inTry && stepperStep < step) step = stepperStep;
								}}
								disabled={inTry ? stepperStep !== step : stepperStep > step}
								aria-label={`Step ${i + 1}`}
								aria-current={stepperStep === step ? 'step' : undefined}
							>
								{#if stepperStep < step}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3.5"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								{:else}
									{i + 1}
								{/if}
							</button>
							{#if i < stepperSteps.length - 1}
								<div class="connector {stepperStep < step ? 'is-done' : ''}"></div>
							{/if}
						{/each}
					</div>

					<div class="h-5 text-center">
						{#if stepInfo[step].subtitle}
							<span class="step-label">{stepInfo[step].subtitle}</span>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Content Area -->
			<div class="flex flex-1 justify-center overflow-y-auto overscroll-contain px-4 py-4 sm:px-8">
				<!-- my-auto rather than items-center, so content taller than the screen scrolls from the top instead of being clipped -->
				<div class="my-auto w-full max-w-4xl">
					<!-- Step 0: Welcome -->
					{#if step === STEP.WELCOME}
						<div
							class="flex flex-col items-center text-center"
							in:fly={{ y: 30, duration: 500, easing: cubicOut }}
						>
							<span class="brand-kicker" in:fade={{ duration: 500, delay: 150 }}
								>Parallel Arabic</span
							>

							<h1
								class="font-arabic mb-3 text-4xl font-bold text-text-300 sm:mb-4 sm:text-5xl lg:text-6xl"
								dir="rtl"
								lang="ar"
								in:scale={{ start: 0.85, duration: 700, delay: 200, easing: backOut }}
							>
								أهلاً وسهلاً
							</h1>

							<div
								class="mb-5 flex items-center gap-3 sm:mb-7 sm:gap-4"
								in:fly={{ y: 16, duration: 500, delay: 380, easing: cubicOut }}
							>
								<span class="bg-text-300/25 h-px w-8 sm:w-12"></span>
								<span class="text-base font-semibold tracking-wide text-text-300 sm:text-lg"
									>Welcome</span
								>
								<span class="bg-text-300/25 h-px w-8 sm:w-12"></span>
							</div>

							<p
								class="mb-8 max-w-md text-base leading-relaxed text-text-200 sm:mb-10 sm:text-lg"
								in:fly={{ y: 20, duration: 500, delay: 500, easing: cubicOut }}
							>
								Arabic isn't one language — it's Egyptian, Levantine, Gulf, Iraqi, Moroccan, Modern
								Standard, and more. Parallel Arabic is built around the variety you actually want to learn. Let's
								set you up in a few quick steps.
							</p>

							<button
								class="press"
								style="--accent:#22c55e; --deep:#15803d;"
								onclick={nextStep}
								in:fly={{ y: 20, duration: 500, delay: 620, easing: cubicOut }}
							>
								Get Started
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/>
								</svg>
							</button>
						</div>
					{/if}

					<!-- Step 1: Dialect Selection -->
					{#if step === STEP.DIALECT}
						<div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-7 text-center">
								<h2 class="screen-title">Choose Your Dialect</h2>
								<p class="screen-sub">Select the Arabic dialect you want to master</p>
								<p class="screen-note">This shapes all your lessons, stories, and vocabulary.</p>
							</div>

							<DialectPicker {dialects} value={targetDialect} onSelect={selectDialect} />

							<div class="mt-7 flex justify-center">
								<button
									class="press"
									style="--accent:#22c55e; --deep:#15803d;"
									disabled={!targetDialect}
									onclick={nextStep}
								>
									Continue
								</button>
							</div>
						</div>
					{/if}

					<!-- Step 2: Learning Reason -->
					{#if step === STEP.REASON}
						<div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-7 text-center">
								<h2 class="screen-title">What do you want Arabic for?</h2>
								<p class="screen-sub">We'll start you on a conversation you'd actually have.</p>
							</div>

							<div class="mx-auto grid max-w-xl grid-cols-3 gap-2.5 sm:gap-3">
								{#each learningReasons as reason, i (reason.id)}
									<button
										class="reason {learningReason === reason.id ? 'is-on' : ''}"
										style="--accent:{reason.accent}; --deep:{reason.deep};"
										aria-pressed={learningReason === reason.id}
										onclick={() => selectReason(reason.id)}
										in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
									>
										<span class="reason-emoji" aria-hidden="true">{reason.emoji}</span>
										<span class="reason-label">{reason.label}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					{#if step === STEP.CHALLENGES}
						<div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-7 text-center">
								<h2 class="screen-title">What's hardest for you?</h2>
								<p class="screen-sub">Pick as many as you like. We'll focus your plan on them.</p>
							</div>

							<div class="mx-auto grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
								{#each CHALLENGES as challenge, i (challenge.id)}
									<button
										class="reason {challenges.includes(challenge.id) ? 'is-on' : ''}"
										style="--accent:#22c55e; --deep:#15803d;"
										aria-pressed={challenges.includes(challenge.id)}
										onclick={() => toggleChallenge(challenge.id)}
										in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
									>
										<span class="reason-emoji" aria-hidden="true">{challenge.emoji}</span>
										<span class="reason-label">{challenge.label}</span>
									</button>
								{/each}
							</div>

							<div class="mt-8 flex justify-center">
								<button
									class="press"
									style="--accent:#22c55e; --deep:#15803d;"
									disabled={!challenges.length}
									onclick={nextStep}
								>
									Continue
								</button>
							</div>
						</div>
					{/if}

					{#if step === STEP.HELP}
						<div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-7 text-center">
								<h2 class="screen-title">Here's how we'll help</h2>
								<p class="screen-sub">Your plan starts with what you find hardest.</p>
							</div>

							<div class="mx-auto grid max-w-3xl gap-3 {helpCards.length > 1 ? 'sm:grid-cols-2' : ''} {helpCards.length > 2 ? 'lg:grid-cols-3' : ''}">
								{#each helpCards as card, i (card.id)}
									<div class="help-card" in:fly={{ y: 30, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}>
										{#if card.shot}
											<img
												class="help-shot"
												src={card.shot.src}
												width={card.shot.w}
												height={card.shot.h}
												alt={card.shot.alt}
												decoding="async"
											/>
										{/if}
										<span class="help-for">{card.label}</span>
										<span class="help-title">{card.title}</span>
										<span class="help-body">{card.body}</span>
									</div>
								{/each}
							</div>

							<div class="mt-8 flex justify-center">
								<button class="press" style="--accent:#22c55e; --deep:#15803d;" onclick={nextStep}>
									Continue
								</button>
							</div>
						</div>
					{/if}

					<!-- Step 3: Current level -->
					{#if step === STEP.LEVEL}
						<div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-8 text-center">
								<h2 class="screen-title">How strong is your Arabic right now?</h2>
								<p class="screen-sub">Be honest — we'll meet you where you are.</p>
							</div>

							<LevelSlider
								variant="now"
								value={proficiencyLevel}
								onSelect={(level) => (proficiencyLevel = level)}
								hint="Tap on the level that best describes you"
							/>

							<div class="mt-8 flex justify-center">
								<button
									class="press"
									style="--accent:#22c55e; --deep:#15803d;"
									disabled={!proficiencyLevel}
									onclick={nextStep}
								>
									Continue
								</button>
							</div>
						</div>
					{/if}

					<!-- Step 4: Goal level -->
					{#if step === STEP.GOAL}
						<div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-8 text-center">
								<h2 class="screen-title">Where do you want to get to in the next year?</h2>
								<p class="screen-sub">Pick a level and we'll build your path towards it.</p>
							</div>

							<LevelSlider
								variant="goal"
								value={goalLevel}
								minLevel={proficiencyLevel}
								onSelect={(level) => (goalLevel = level)}
								hint="Tap on your goal level"
							/>

							<div class="mt-8 flex justify-center">
								<button
									class="press"
									style="--accent:#22c55e; --deep:#15803d;"
									disabled={!goalLevel}
									onclick={nextStep}
								>
									Continue
								</button>
							</div>
						</div>
					{/if}

					{#if step === STEP.DAILY_TIME}
						{@const minutes = dailyMinutes ?? 15}
						<div class="mx-auto max-w-md" in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-6 text-center">
								<h2 class="screen-title">How much time can you study each day?</h2>
								<p class="screen-sub">A little every day beats a lot once a week. Even 5 minutes works.</p>
							</div>

							<div class="text-center">
								<span class="chip">~{wordsPerMonth(minutes)} new words a month</span>
								<p class="minutes" aria-live="polite">{minutes} minutes</p>
								<input
									class="minutes-slider"
									type="range"
									min="0"
									max={DAILY_MINUTES.length - 1}
									step="1"
									value={DAILY_MINUTES.indexOf(minutes)}
									oninput={(e) => (dailyMinutes = DAILY_MINUTES[Number(e.currentTarget.value)])}
									aria-label="Minutes a day"
									aria-valuetext="{minutes} minutes"
								/>
								<span class="chip">{MINUTES_LABEL[minutes]}</span>
							</div>

							<div class="mt-8 flex justify-center">
								<button
									class="press"
									style="--accent:#22c55e; --deep:#15803d;"
									onclick={() => {
										dailyMinutes = minutes;
										nextStep();
									}}
								>
									I'm committed
								</button>
							</div>
						</div>
					{/if}

					{#if step === STEP.REMINDER}
						<div class="mx-auto max-w-md" in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-6 text-center">
								<h2 class="screen-title">
									When can you fit in {dailyMinutes ? `${dailyMinutes} minutes` : 'a little Arabic'}?
								</h2>
								<p class="screen-sub">One reminder at most, and only on days you haven't practised.</p>
							</div>

							<div class="flex flex-col gap-2.5">
								{#each REMINDER_OPTIONS as option, i (option.id)}
									<button
										class="reason is-row {reminderWindow === option.id ? 'is-on' : ''}"
										style="--accent:#22c55e; --deep:#15803d;"
										aria-pressed={reminderWindow === option.id}
										onclick={() => chooseReminder(option.id)}
										in:fly={{ y: 20, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
									>
										<span class="reason-emoji" aria-hidden="true">{option.emoji}</span>
										<span class="row-text">
											<span class="reason-label">{option.label}</span>
											<span class="row-hint">{option.hint}</span>
										</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					{#if step === STEP.STREAK}
						<div class="mx-auto max-w-md" in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<div class="mb-6 text-center">
								<h2 class="screen-title">Commit to a streak</h2>
								<p class="screen-sub">Streak goals help you stay with it and build a habit.</p>
							</div>

							<div class="flex flex-col gap-2.5">
								{#each STREAK_GOALS as goal, i (goal.days)}
									<button
										class="reason is-row {streakGoal === goal.days ? 'is-on' : ''}"
										style="--accent:#f59e0b; --deep:#b45309;"
										aria-pressed={streakGoal === goal.days}
										onclick={() => (streakGoal = goal.days)}
										in:fly={{ y: 20, duration: 400, delay: getStaggerDelay(i), easing: cubicOut }}
									>
										<span class="reason-emoji" aria-hidden="true">🔥</span>
										<span class="row-text">
											<span class="reason-label">{goal.days} days</span>
											<span class="row-hint">{goal.label}</span>
										</span>
									</button>
								{/each}
							</div>

							<div class="mt-8 flex justify-center">
								<button
									class="press"
									style="--accent:#22c55e; --deep:#15803d;"
									disabled={!streakGoal || isSubmitting}
									onclick={nextStep}
								>
									Build my plan
								</button>
							</div>

							{#if isSubmitting}
								<div class="mt-7 flex justify-center" in:fade={{ duration: 200 }}>
									<div class="flex items-center gap-3 px-8 py-3.5 text-text-300">
										<div
											class="h-5 w-5 animate-spin rounded-full border-2 border-text-300 border-t-transparent"
										></div>
										<span class="font-medium">Setting up your experience...</span>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if tryFocus}
						<p class="focus-tag" in:fade={{ duration: 300 }}>
							You said {tryFocus.label.toLowerCase()} is hardest. This is where it gets easier.
						</p>
					{/if}

					<!-- Try it: read the dialog's opening -->
					{#if step === STEP.READ && tryData && dialog}
						<ReadSentence
							{dialog}
							lines={tryData.readLines.map((i) => dialog.lines[i])}
							dialect={targetDialect as Dialect}
							onDone={() => finishTryStep('read', true)}
							onSkip={() => finishTryStep('read', false)}
						/>
					{/if}

					<!-- Try it: say it, as a three-line conversation -->
					{#if step === STEP.CONVERSATION}
						<div in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
							<OnboardingConversation
								dialect={targetDialect as Dialect}
								{scenario}
								onFinish={handleConversationFinish}
							/>
						</div>
					{/if}

					<!-- Try it: trace a short word from it -->
					{#if step === STEP.TRACE && tryData}
						<TraceWord
							word={tryData.trace}
							onDone={() => finishTryStep('traced', true)}
							onSkip={() => finishTryStep('traced', false)}
						/>
					{/if}

					<!-- Try it: rebuild what they said, word by word -->
					{#if step === STEP.PLAY && sentences.length > 0}
						<TryScramble
							{sentences}
							dialect={targetDialect as GameDialect}
							onDone={() => finishTryStep('played', true)}
							onSkip={() => finishTryStep('played', false)}
						/>
					{/if}

					<!-- Try it: a daily goal -->
					<!-- Between the Try-it steps and the plan: "Building your plan" -->
					{#if step === STEP.BUILDING}
						<BuildingPlan lines={buildingLines} onDone={() => (step = STEP.PLAN)} />
					{/if}

					<!-- The plan, and where to start -->
					{#if step === STEP.PLAN}
						<YourPlan
							{proficiencyLevel}
							{goalLevel}
							{tried}
							{lesson}
							{focusStart}
							{streakGoal}
							{reminderWindow}
							onStart={handlePlanStart}
						/>
					{/if}

					<!-- Free trial offer (Stripe on web, Apple on iOS) -->
					{#if step === STEP.TRIAL}
						<TrialOffer
							dialectName={chosenDialectName}
							onSkip={isHardPaywall ? undefined : skipTrial}
							{tried}
							{proficiencyLevel}
							{goalLevel}
							egyptianQuote={targetDialect === 'egyptian-arabic'}
							{challenges}
						/>
					{/if}

					<!-- Error Message -->
					{#if error}
						<div class="error-note" in:fly={{ y: 10, duration: 300 }}>{error}</div>
					{/if}
				</div>
			</div>

			<!-- Footer Navigation -->
			{#if step >= STEP.DIALECT && step <= STEP.STREAK}
				<div class="px-4 pb-5 sm:px-8 sm:pb-7">
					<div class="mx-auto flex max-w-2xl items-center justify-between">
						<button class="nav-pill" onclick={prevStep}>
							<svg
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2.5"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M11 17l-5-5m0 0l5-5m-5 5h12"
								/>
							</svg>
							Back
						</button>

						<button class="nav-pill" onclick={skipStep} disabled={isSubmitting}>
							Skip
							<svg
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2.5"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
							</svg>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* A soft brand wash — warm and open, rather than the old vignette + tessellation */
	.onboarding-bg {
		background: radial-gradient(
				90% 70% at 15% 0%,
				hsl(var(--brand-hue) 45% 55% / 0.16),
				transparent 60%
			),
			radial-gradient(80% 60% at 100% 100%, hsl(145 45% 50% / 0.12), transparent 55%), var(--tile2);
	}

	/* Stepper */
	.step {
		display: grid;
		place-items: center;
		width: 2.1rem;
		height: 2.1rem;
		flex-shrink: 0;
		border-radius: 50%;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.step:disabled {
		cursor: default;
		opacity: 0.55;
	}

	.step:not(:disabled):hover {
		transform: translateY(-2px);
	}

	.step.is-on {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
		transform: scale(1.1);
	}

	.step.is-done {
		background: #22c55e;
		border-color: #15803d;
		color: #fff;
	}

	.step svg {
		width: 0.9rem;
		height: 0.9rem;
	}

	.connector {
		width: 1.5rem;
		height: 2px;
		border-radius: 100px;
		background: var(--tile5);
		transition: background 0.4s ease;
	}
	@media (min-width: 640px) {
		.connector {
			width: 2.5rem;
		}
	}
	.connector.is-done {
		background: #22c55e;
	}

	.step-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
	}

	/* Headings */
	.brand-kicker {
		display: inline-block;
		margin-bottom: 1.25rem;
		border-radius: 100px;
		background: var(--tile3);
		padding: 0.3rem 0.9rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
	}

	.screen-title {
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.15;
		color: var(--text1);
		margin-bottom: 0.4rem;
		text-wrap: balance;
	}
	@media (min-width: 640px) {
		.screen-title {
			font-size: 1.85rem;
		}
	}

	.screen-sub {
		font-size: 0.9rem;
		color: var(--text2);
	}
	@media (min-width: 640px) {
		.screen-sub {
			font-size: 1rem;
		}
	}

	.screen-note {
		margin-top: 0.25rem;
		font-size: 0.8rem;
		color: var(--text2);
		opacity: 0.75;
	}

	/* Reason cards */
	.reason {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.5rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 5px 0 var(--tile5);
		cursor: pointer;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease,
			background 0.18s ease;
	}

	.reason:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		box-shadow: 0 9px 0 var(--deep);
	}

	.reason:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep);
	}

	.reason.is-on {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 13%, var(--tile3));
		box-shadow: 0 5px 0 var(--deep);
	}

	.reason-emoji {
		font-size: 1.7rem;
		line-height: 1;
		transition: transform 0.22s ease-out;
	}

	.reason:hover .reason-emoji,
	.reason.is-on .reason-emoji {
		transform: rotate(-3deg) scale(1.05);
	}

	.reason-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text1);
	}

	/* Pressable primary */
	.help-card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.75rem 0.75rem 1rem;
		text-align: left;
	}

	.help-shot {
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 10;
		object-fit: cover;
		object-position: top;
		border-radius: 0.8rem;
		margin-bottom: 0.4rem;
	}

	.help-for {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #16a34a;
	}

	.help-title {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text1);
	}

	.help-body {
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--text2);
	}

	.focus-tag {
		margin: 0 auto 1rem;
		max-width: 28rem;
		border-radius: 100px;
		background: color-mix(in srgb, #22c55e 14%, var(--tile3));
		padding: 0.4rem 1rem;
		text-align: center;
		font-size: 0.85rem;
		font-weight: 600;
		color: #16a34a;
	}

	/* Option rows (reminder time, streak goal): the reason card laid out sideways. */
	.reason.is-row {
		flex-direction: row;
		gap: 1rem;
		padding: 0.85rem 1.1rem;
		text-align: left;
	}

	.reason.is-row:hover {
		transform: translateY(-2px);
	}

	.reason.is-row .reason-label {
		font-size: 1rem;
	}

	.row-text {
		display: flex;
		flex-direction: column;
	}

	.row-hint {
		font-size: 0.82rem;
		color: var(--text2);
	}

	.chip {
		display: inline-block;
		border-radius: 100px;
		background: color-mix(in srgb, #22c55e 14%, var(--tile3));
		padding: 0.35rem 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #16a34a;
	}

	.minutes {
		margin: 1.5rem 0 1rem;
		font-size: clamp(2.4rem, 9vw, 3.2rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text1);
	}

	.minutes-slider {
		display: block;
		width: 100%;
		margin-bottom: 1.25rem;
		accent-color: #22c55e;
		cursor: pointer;
	}

	.press {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 100px;
		padding: 0.8rem 2.1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		box-shadow: 0 5px 0 var(--deep);
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}

	.press:hover:not(:disabled) {
		filter: brightness(1.06);
	}

	.press:active:not(:disabled) {
		transform: translateY(5px);
		box-shadow: 0 0 0 var(--deep);
	}

	.press:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Footer nav */
	.nav-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.45rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.2s ease,
			color 0.2s ease;
	}
	.nav-pill:hover {
		transform: translateY(-2px);
		background: var(--tile4);
		color: var(--text1);
	}
	.nav-pill svg {
		width: 0.9rem;
		height: 0.9rem;
	}

	.error-note {
		margin: 1rem auto 0;
		max-width: 28rem;
		border-radius: 1rem;
		border: 2px solid #f43f5e;
		background: color-mix(in srgb, #f43f5e 15%, var(--tile3));
		padding: 0.7rem 1rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--text1);
	}

	@media (prefers-reduced-motion: reduce) {
		.step,
		.reason,
		.press,
		.nav-pill,
		.reason-emoji,
		.connector {
			transition: none;
		}
		.step:not(:disabled):hover,
		.reason:hover,
		.nav-pill:hover {
			transform: none;
		}
		.reason:hover .reason-emoji {
			transform: none;
		}
	}
</style>
