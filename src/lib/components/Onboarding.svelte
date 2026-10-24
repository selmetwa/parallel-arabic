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
	import DailyGoalPick from '$lib/components/onboarding/DailyGoalPick.svelte';
	import { onboardingLines, onboardingScenario } from '$lib/constants/tutor-scenarios';
	import {
		NOTHING_TRIED,
		scrambleSentences,
		tryContent,
		type TryProgress
	} from '$lib/constants/onboarding-try';
	import type { GameDialect } from '$lib/games/themes';
	import type { DailyGoal } from '$lib/constants/daily-goal';
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
		LEVEL: 3,
		GOAL: 4,
		// "Try it": one dialog, read, said, traced and played (docs/onboarding-v4-plan.md).
		READ: 5,
		CONVERSATION: 6,
		TRACE: 7,
		PLAY: 8,
		DAILY_GOAL: 9,
		/** A short narrated pause between the Try-it steps and the plan. */
		BUILDING: 10,
		PLAN: 11,
		TRIAL: 12
	} as const;

	/** Steps the header stepper covers: the questions, then the Try-it steps. */
	const STEPPER_STEPS = [STEP.WELCOME, STEP.DIALECT, STEP.REASON, STEP.LEVEL, STEP.GOAL];
	const TRY_STEPS = [STEP.READ, STEP.CONVERSATION, STEP.TRACE, STEP.PLAY, STEP.DAILY_GOAL];

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
		{ title: 'Level', subtitle: 'Where are you now?' },
		{ title: 'Target', subtitle: 'Where do you want to get to?' },
		{ title: 'Read', subtitle: 'Read it' },
		{ title: 'Practice', subtitle: 'Say it' },
		{ title: 'Trace', subtitle: 'Write it' },
		{ title: 'Play', subtitle: 'Play with it' },
		{ title: 'Daily goal', subtitle: 'Make it a habit' },
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

	let buildingLines = $derived([
		goalLevel && goalLevel !== proficiencyLevel
			? `${chosenDialectName}, ${proficiencyLevel} to ${goalLevel}`
			: `${chosenDialectName}, from ${proficiencyLevel}`,
		REASON_FOCUS[learningReason] ?? 'Starting with everyday conversations',
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
	let stepperSteps = $derived<readonly number[]>(inTry ? TRY_STEPS : STEPPER_STEPS);
	let showStepper = $derived(inTry || STEPPER_STEPS.includes(step as (typeof STEPPER_STEPS)[number]));

	/** Read and Trace need written content, Play needs the conversation; without them they're left out. */
	function nextTryStep(from: number): number {
		for (const s of TRY_STEPS.slice(TRY_STEPS.indexOf(from as (typeof TRY_STEPS)[number]) + 1)) {
			if (s === STEP.PLAY ? sentences.length > 0 : tryData || s === STEP.CONVERSATION || s === STEP.DAILY_GOAL)
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

	function finishDailyGoal(goal: DailyGoal) {
		tried.goal = goal;
		finishTryStep(null, true);
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
			handleSubmit();
			return;
		}
		step += 1;
	}

	function prevStep() {
		if (step > 0) step -= 1;
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

	function skipGoal() {
		goalLevel = '';
		handleSubmit();
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
					platform: isNative ? 'native' : 'web'
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
									disabled={!goalLevel || isSubmitting}
									onclick={nextStep}
								>
									Continue
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
					{#if step === STEP.DAILY_GOAL}
						<DailyGoalPick onDone={finishDailyGoal} onSkip={() => finishTryStep(null, false)} />
					{/if}

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
							isNative={isNative === true}
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
						/>
					{/if}

					<!-- Error Message -->
					{#if error}
						<div class="error-note" in:fly={{ y: 10, duration: 300 }}>{error}</div>
					{/if}
				</div>
			</div>

			<!-- Footer Navigation -->
			{#if step >= STEP.DIALECT && step <= STEP.GOAL}
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

						<button class="nav-pill" onclick={step === STEP.GOAL ? skipGoal : nextStep}>
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
