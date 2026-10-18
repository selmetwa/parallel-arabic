<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import SubscribeButton from '$lib/components/SubscribeButton.svelte';
	import SocialProof from '$lib/components/SocialProof.svelte';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';
	import { GAMES } from '$lib/constants/games';
	import {
		PAYWALL_HEADLINES,
		type PaywallLesson,
		type PaywallSource
	} from '$lib/constants/paywall';
	import { onboardingLines, onboardingScenario } from '$lib/constants/tutor-scenarios';
	import { isNativeApp } from '$lib/helpers/is-native-app';
	import { RevenueCatService } from '$lib/services/revenuecat.service';
	import { trackEvent } from '$lib/analytics';
	import type { Dialect } from '$lib/types';

	type Props = {
		isOpen: boolean;
		handleCloseModal: () => void;
		/** Set when a game opened the paywall: the top leads with that game. */
		gameName?: string;
		/** What they tapped. Picks the top of the popup; see constants/paywall.ts. */
		source?: PaywallSource;
		/** The locked lesson they tapped, for the lesson preview. */
		lesson?: PaywallLesson | null;
	};

	let {
		isOpen = false,
		handleCloseModal = () => {},
		gameName,
		source: sourceProp = 'other',
		lesson = null
	}: Props = $props();

	// One popup for every locked feature: the top changes with what they tapped,
	// the plan picker and button below are always the same.
	const source = $derived<PaywallSource>(gameName ? 'game' : sourceProp);
	const dialect = $derived((page.data.targetDialect ?? 'egyptian-arabic') as Dialect);

	// Two real lines from the onboarding conversation in their dialect.
	const tutorLines = $derived(
		onboardingLines(onboardingScenario(null, dialect), dialect).slice(0, 2)
	);
	const game = $derived(gameName ? GAMES.find((g) => g.name === gameName) : undefined);

	// What they've built, shown once there's enough of it to be worth showing.
	const stats = $derived.by(() => {
		const p = page.data.progress;
		if (!p || (p.lessons < 3 && p.savedWords < 10 && p.streak < 3)) return [];
		return [
			{ value: p.lessons, label: p.lessons === 1 ? 'lesson done' : 'lessons done' },
			{ value: p.savedWords, label: 'words in your deck' },
			{ value: p.streak, label: 'day streak', warm: true }
		].filter((s) => s.value > 0);
	});

	// Trial copy: web reads the Stripe flag; the app asks Apple. Nothing shows
	// until mount, so the WebView never flashes Stripe wording (App Store 3.1.1).
	let isNative = $state<boolean | null>(null);
	let appleTrialDays = $state<number | null>(null);
	const trialDays = $derived(
		isNative === false
			? page.data.trialEligible === true
				? 7
				: null
			: isNative === true
				? appleTrialDays
				: null
	);

	let showAll = $state(false);

	onMount(() => {
		isNative = isNativeApp();
		const userId = page.data.user?.id;
		if (isNative && userId) {
			RevenueCatService.getPlans(userId).then((plans) => {
				appleTrialDays = plans?.monthly.trialDays ?? plans?.annual?.trialDays ?? null;
			});
		}
	});

	let wasOpen = false;
	$effect(() => {
		if (isOpen && !wasOpen)
			trackEvent('paywall_shown', { source, game: gameName, lesson: lesson?.title });
		wasOpen = isOpen;
	});

	// Keep the page behind from scrolling while the popup is up.
	$effect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	function close() {
		trackEvent('paywall_dismissed', { source });
		showAll = false;
		handleCloseModal();
	}

	function onkeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

{#if isOpen}
	<div class="pw-root">
		<button type="button" class="pw-overlay" aria-label="Close" tabindex="-1" onclick={close}
		></button>
		<div
			class="pw-sheet"
			role="dialog"
			aria-modal="true"
			aria-label="Subscribe to Parallel Arabic"
			in:fly={{ y: 40, duration: 280 }}
		>
			<button
				type="button"
				class="pw-close"
				class:pw-close--light={source === 'tutor'}
				aria-label="Close"
				onclick={close}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg
				>
			</button>
			{#if source === 'tutor' && tutorLines.length === 2}
				<!-- Top: the tutor itself -->
				<div class="tutor-hero">
					<span class="kicker kicker--light">Your tutor</span>
					<div class="bubble bubble--them">
						<span lang="ar" dir="rtl" class="bubble-ar">{tutorLines[1].arabic}</span>
						<span class="bubble-tr">{tutorLines[1].transliteration}</span>
					</div>
					<div class="bubble bubble--you">
						<span lang="ar" dir="rtl" class="bubble-ar">{tutorLines[0].arabic}</span>
						<span class="bubble-tr">{tutorLines[0].transliteration}</span>
					</div>
				</div>
			{/if}

			<div class="flex flex-col gap-4 px-5 pb-6 pt-5 sm:px-7">
				{#if source === 'lesson' && lesson}
					<!-- Top: the lesson they tapped -->
					<div class="flex flex-col gap-1.5">
						<span class="kicker">Next on your path</span>
						<h2 class="title">{lesson.title}</h2>
						{#if lesson.description}<p class="sub">{lesson.description}</p>{/if}
					</div>
					{#if lesson.words?.length}
						<div class="preview">
							{#each lesson.words.slice(0, 4) as word, i (i)}
								<div
									class="word"
									class:word--hidden={i >= 2}
									aria-hidden={i >= 2 ? 'true' : undefined}
								>
									<span class="flex flex-col">
										<span class="word-tr">{word.transliteration}</span>
										<span class="word-en">{word.english}</span>
									</span>
									<span lang="ar" dir="rtl" class="word-ar">{word.arabic}</span>
								</div>
							{/each}
							<span class="preview-lock">
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
									><rect x="5" y="11" width="14" height="10" rx="2" /><path
										d="M8 11V8a4 4 0 0 1 8 0v3"
									/></svg
								>
								The rest of the lesson: quiz, speaking and a conversation
							</span>
						</div>
					{/if}
				{:else if source === 'game' && gameName}
					<!-- Top: the game they were playing -->
					<div class="flex items-start gap-3">
						<span class="game-icon" style="--accent:{game?.accent ?? '#f97316'}">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg
							>
						</span>
						<div class="flex flex-col gap-0.5">
							<h2 class="title">Unlimited {gameName}</h2>
							<p class="sub">Plus every other game, lesson and story</p>
						</div>
					</div>
				{:else}
					<div class="flex flex-col gap-1.5">
						<h2 class="title">{PAYWALL_HEADLINES[source]}</h2>
						<p class="sub">
							{source === 'tutor'
								? 'Speak out loud, and your tutor answers and corrects you as you go.'
								: 'Every dialect, every lesson, and a tutor that listens.'}
						</p>
					</div>
				{/if}

				{#if stats.length}
					<ul class="stats" aria-label="Your progress so far">
						{#each stats as stat (stat.label)}
							<li class="stat" class:stat--warm={stat.warm}>
								<span class="stat-value">{stat.value}</span>
								<span class="stat-label">{stat.label}</span>
							</li>
						{/each}
					</ul>
				{/if}

				<!-- Bottom: the same on every paywall -->
				<div class="flex flex-col">
					<SubscribeButton
						planLayout="cards"
						{source}
						label="Subscribe"
						className="!py-3 !text-lg w-full !rounded-2xl"
					/>
					{#if trialDays}
						<ol class="timeline" aria-label="How the free trial works">
							<li><strong>Today</strong><span>Full access, $0</span></li>
							<li><strong>Day {trialDays}</strong><span>Your plan starts</span></li>
							<li><strong>Any time</strong><span>Cancel, no charge before then</span></li>
						</ol>
					{/if}
				</div>

				<SocialProof quotes={0} />

				<div class="flex flex-col items-center gap-2">
					<button class="link" aria-expanded={showAll} onclick={() => (showAll = !showAll)}>
						{showAll ? 'Hide' : 'See'} everything included
					</button>
					{#if showAll}
						<div class="w-full text-center" in:fly={{ y: 10, duration: 250 }}>
							<FeatureGrid />
						</div>
					{/if}
					<p class="legal">
						{#if isNative}
							By subscribing you agree to our
							<a
								href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
								target="_blank"
								class="underline">Terms of Use</a
							>
							and <a href={resolve('/privacy')} class="underline">Privacy Policy</a>.
						{:else}
							Secure checkout with Stripe. See our <a href={resolve('/privacy')} class="underline"
								>Privacy Policy</a
							>.
						{/if}
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.pw-root {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.pw-overlay {
		position: absolute;
		inset: 0;
		border: 0;
		background: hsl(200 100% 8% / 0.5);
		cursor: default;
		touch-action: none; /* dragging the dimmed area must not scroll the page */
	}

	/* A bottom sheet on phones; a centred card from tablet width up. */
	.pw-sheet {
		position: relative;
		width: 100%;
		max-width: 30rem;
		max-height: 92dvh;
		overflow-y: auto;
		overscroll-behavior: contain;
		border-radius: 1.75rem 1.75rem 0 0;
		background: var(--tile3);
		padding-bottom: env(safe-area-inset-bottom);
	}

	@media (min-width: 640px) {
		.pw-root {
			align-items: center;
			padding: 1.5rem;
		}
		.pw-sheet {
			border-radius: 1.75rem;
			max-height: 88dvh;
		}
	}

	.pw-close {
		position: absolute;
		top: 0.4rem;
		right: 0.4rem;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		color: var(--text2);
		cursor: pointer;
	}

	.pw-close:hover {
		background: var(--tile4);
		color: var(--text1);
	}

	.pw-close--light {
		color: hsl(200 40% 88%);
	}

	.pw-close--light:hover {
		background: hsl(200 100% 30%);
		color: #fff;
	}

	.kicker {
		padding-right: 2.25rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text2);
	}

	.kicker--light {
		color: hsl(200 40% 85%);
	}

	.title {
		padding-right: 2.25rem; /* clear of the close button */
		font-size: 1.6rem;
		font-weight: 600;
		line-height: 1.12;
		letter-spacing: -0.02em;
		color: var(--text1);
		text-wrap: balance;
	}

	.sub {
		font-size: 0.92rem;
		line-height: 1.45;
		color: var(--text2);
	}

	.tutor-hero {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.25rem 1.25rem 1.1rem;
		background: hsl(200 100% 22%);
	}

	.bubble {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		max-width: 82%;
		padding: 0.6rem 0.9rem;
	}

	.bubble--them {
		align-self: flex-start;
		border-radius: 1.1rem 1.1rem 1.1rem 0.4rem;
		background: hsl(200 30% 96%);
		color: hsl(200 100% 10%);
	}

	.bubble--you {
		align-self: flex-end;
		border-radius: 1.1rem 1.1rem 0.4rem 1.1rem;
		background: hsl(142 55% 34%);
		color: #fff;
	}

	.bubble-ar {
		font-size: 1.2rem;
		font-weight: 600;
		text-align: right;
	}

	.bubble-tr {
		font-size: 0.75rem;
		opacity: 0.85;
	}

	.preview {
		position: relative;
		overflow: hidden;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		padding-bottom: 3rem;
	}

	.word {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 1rem;
	}

	.word + .word {
		border-top: 1px solid var(--tile4);
	}

	.word--hidden {
		opacity: 0.4;
		filter: blur(3px);
	}

	.word-tr {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text1);
	}

	.word-en {
		font-size: 0.8rem;
		color: var(--text2);
	}

	.word-ar {
		font-size: 1.45rem;
		font-weight: 600;
		color: var(--text1);
	}

	.preview-lock {
		position: absolute;
		left: 50%;
		bottom: 0.75rem;
		transform: translateX(-50%);
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		width: max-content;
		max-width: calc(100% - 1.5rem);
		padding: 0.4rem 0.75rem;
		border-radius: 100px;
		background: var(--text1);
		color: var(--tile2);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.game-icon {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		border-radius: 1rem;
		background: var(--accent);
		color: #fff;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		grid-auto-flow: column;
		gap: 0.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.65rem 0.7rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
	}

	.stat--warm {
		border-color: color-mix(in srgb, #f59e0b 60%, var(--tile5));
		background: color-mix(in srgb, #f59e0b 14%, var(--tile2));
	}

	.stat-value {
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.1;
		color: var(--text1);
	}

	.stat-label {
		font-size: 0.72rem;
		color: var(--text2);
	}

	.timeline {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
		margin-top: 0.9rem;
		padding-top: 0.75rem;
		border-top: 2px solid var(--tile5);
	}

	.timeline li {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.75rem;
		color: var(--text2);
	}

	.timeline strong {
		font-size: 0.82rem;
		color: var(--text1);
	}

	.link {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.link:hover {
		color: var(--text1);
	}

	.legal {
		font-size: 0.72rem;
		color: var(--text2);
		text-align: center;
	}
</style>
