<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import SubscribeButton from '$lib/components/SubscribeButton.svelte';
	import SocialProof from '$lib/components/SocialProof.svelte';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';
	import { isNativeApp } from '$lib/helpers/is-native-app';
	import { RevenueCatService } from '$lib/services/revenuecat.service';
	import { CEFR_LEVEL_INFO, type CefrLevel } from '$lib/constants/cefr-levels';

	type Props = {
		/** e.g. "Egyptian Arabic"; falls back to generic copy when empty. */
		dialectName?: string;
		/** Renders "Continue with the free plan". Left out for the hard paywall. */
		onSkip?: () => void;
		onLogout?: () => void;
		/** From onboarding: lets the offer recap what they've already done. */
		conversationDone?: boolean;
		proficiencyLevel?: CefrLevel | '';
		goalLevel?: CefrLevel | '';
	};

	let {
		dialectName = '',
		onSkip,
		onLogout,
		conversationDone = false,
		proficiencyLevel = '',
		goalLevel = ''
	}: Props = $props();

	let showAll = $state(false);

	const hasRecap = $derived(conversationDone || !!goalLevel);

	const benefits = $derived([
		`Speak ${dialectName || 'Arabic'} with live corrections`,
		proficiencyLevel && goalLevel && proficiencyLevel !== goalLevel
			? `A path from ${proficiencyLevel} to ${goalLevel}, one lesson a day`
			: 'A step-by-step path from A1 to C2, one lesson a day',
		"Words that come back right before you'd forget them"
	]);

	// Someone who already used their trial (or let it lapse) can only subscribe.
	// Web reads the Stripe flag; the app asks Apple, since a Stripe trial can't
	// be advertised there. Both stay false until mount, so nothing flashes.
	let isNative = $state<boolean | null>(null);
	let appleTrial = $state(false);
	let trialEligible = $derived(
		isNative === false ? page.data.trialEligible === true : isNative === true && appleTrial
	);

	onMount(() => {
		isNative = isNativeApp();
		const userId = page.data.user?.id;
		if (isNative && userId) {
			RevenueCatService.getPlans(userId).then((plans) => {
				appleTrial = !!(plans?.monthly.trialDays || plans?.annual?.trialDays);
			});
		}
	});
</script>

<div class="mx-auto max-w-md text-center" in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
	{#if hasRecap}
		<ul class="recap">
			{#if conversationDone}
				<li>
					<span class="tick" aria-hidden="true"></span>
					You spoke your first {dialectName || 'Arabic'}
				</li>
			{/if}
			{#if goalLevel}
				<li>
					<span class="tick tick--goal" aria-hidden="true"></span>
					Goal: {goalLevel}, "{CEFR_LEVEL_INFO[goalLevel].goal.replace(/^I want to /, '')}"
				</li>
			{/if}
			{#if conversationDone}
				<li>
					<span class="tick tick--streak" aria-hidden="true"></span>
					Day 1 of your streak
				</li>
			{/if}
		</ul>
	{/if}

	{#if trialEligible}
		<h2 class="screen-title">
			{hasRecap ? 'Keep going, free for 7 days' : 'Unlock everything free for 7 days'}
		</h2>
	{:else}
		<h2 class="screen-title">
			{hasRecap ? 'Keep going with full access' : 'Subscribe to unlock everything'}
		</h2>
	{/if}

	<ul class="benefits">
		{#each benefits as benefit (benefit)}
			<li>{benefit}</li>
		{/each}
	</ul>

	{#if trialEligible}
		<ol class="timeline" aria-label="How the free trial works">
			<li><strong>Today</strong><span>Full access</span></li>
			<li><strong>Day 7</strong><span>Your plan starts</span></li>
			<li><strong>Any time</strong><span>Cancel, no charge before day 7</span></li>
		</ol>
	{/if}

	<SubscribeButton className="!py-3 !text-lg w-full !rounded-2xl" />

	{#if onSkip}
		<button class="skip-link mt-4" onclick={onSkip}>Continue with the free plan</button>
	{/if}
	{#if onLogout}
		<button class="skip-link mt-4" onclick={onLogout}>Log out</button>
	{/if}

	<SocialProof class="mt-6" />

	<div class="mt-6">
		<button class="all-toggle" aria-expanded={showAll} onclick={() => (showAll = !showAll)}>
			{showAll ? 'Hide' : 'See'} everything included
		</button>
	</div>
</div>

{#if showAll}
	<div class="mx-auto mt-4 max-w-4xl text-center" in:fly={{ y: 10, duration: 250 }}>
		<FeatureGrid />
	</div>
{/if}

<style>
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

	.recap {
		display: inline-flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 1.25rem;
		text-align: left;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text2);
	}

	.recap li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	/* Drawn ticks rather than emoji: a green check, a ring for the goal, an amber dot for the streak. */
	.tick {
		position: relative;
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
		border-radius: 50%;
		background: #22c55e;
	}
	.tick::after {
		content: '';
		position: absolute;
		left: 0.38rem;
		top: 0.2rem;
		width: 0.3rem;
		height: 0.55rem;
		border: solid #fff;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}
	.tick--goal {
		background: transparent;
		border: 3px solid var(--brand);
	}
	.tick--streak {
		background: #f59e0b;
	}
	.tick--goal::after,
	.tick--streak::after {
		display: none;
	}

	.benefits {
		margin: 1.1rem 0 1.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		text-align: left;
	}

	.benefits li {
		position: relative;
		padding-left: 1.4rem;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--text1);
	}
	.benefits li::before {
		content: '';
		position: absolute;
		left: 0.2rem;
		top: 0.5rem;
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--brand);
	}

	.timeline {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-bottom: 1.25rem;
		border-top: 2px solid var(--tile5);
		padding-top: 0.75rem;
	}

	.timeline li {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.78rem;
		color: var(--text2);
	}

	.timeline strong {
		font-size: 0.85rem;
		color: var(--text1);
	}

	.all-toggle {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
	}
	.all-toggle:hover {
		color: var(--text1);
	}

	.skip-link {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
		transition: color 0.2s ease;
	}
	.skip-link:hover {
		color: var(--text1);
	}
</style>
