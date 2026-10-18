<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import SubscribeButton from '$lib/components/SubscribeButton.svelte';
	import SocialProof from '$lib/components/SocialProof.svelte';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';
	import { isNativeApp } from '$lib/helpers/is-native-app';
	import { PLANS } from '$lib/constants/pricing';
	import { RevenueCatService, type StorePlans } from '$lib/services/revenuecat.service';

	// The page is prerendered, so platform and prices are only known after mount.
	// Web shows Stripe prices and terms; the app shows StoreKit prices and Apple's
	// terms (App Store 3.1.1), and today's copy until they load.
	let isNative = $state<boolean | null>(null);
	let storePlans = $state.raw<StorePlans | null>(null);
	let showAll = $state(false);

	onMount(() => {
		isNative = isNativeApp();
		const userId = page.data.user?.id;
		if (isNative && userId) {
			RevenueCatService.getPlans(userId).then((plans) => (storePlans = plans));
		}
	});

	const appleTrialDays = $derived(
		storePlans?.monthly.trialDays ?? storePlans?.annual?.trialDays ?? null
	);

	const OUTCOMES = [
		'Speak your dialect with a tutor that listens and corrects you',
		'A step-by-step path from A1 to C2, one lesson a day',
		"Stories, games and review that bring words back right before you'd forget them"
	];

	// There's no free plan for new signups (everyone gets the hard paywall), so
	// the second card explains the trial instead. Web trials are 7 days; the
	// app shows Apple's, if the product has one.
	const trialDays = $derived(isNative === false ? 7 : isNative === true ? appleTrialDays : null);
</script>

<div class="min-h-screen bg-tile-300 px-4 pb-20 pt-14 sm:px-8 sm:pt-20">
	<header class="mx-auto max-w-2xl text-center">
		<p class="kicker">Pricing</p>
		<h1 class="title">Speak Arabic with confidence</h1>
		<p class="lede">
			Every dialect, every lesson and a tutor that listens, for less than one lesson on
			<a
				class="underline underline-offset-2 hover:text-text-300"
				target="_blank"
				rel="noopener"
				href="https://www.italki.com/en/teachers/arabic?from%5B0%5D=EG&speaks%5B0%5D=english"
				>italki</a
			> a month.
		</p>
	</header>

	<div class="plans" class:plans--single={!trialDays}>
		<!-- Premium first: it's the one we're recommending, and on phones it should be on top. -->
		<section class="plan plan--premium" aria-labelledby="premium-title">
			<h2 id="premium-title" class="plan-name">Premium</h2>

			{#if isNative === true}
				<p class="price">
					{storePlans?.monthly.priceString ?? '$10'}<span class="price-unit">/month</span>
				</p>
				{#if storePlans?.annual}
					<p class="price-alt">or {storePlans.annual.priceString}/year</p>
				{/if}
				{#if appleTrialDays}
					<p class="trial">Start with {appleTrialDays} days free. Cancel any time.</p>
				{/if}
			{:else}
				<p class="price">{PLANS.annual.perMonth}<span class="price-unit"> billed yearly</span></p>
				<p class="price-alt">{PLANS.annual.price}, or {PLANS.monthly.price}</p>
				{#if isNative === false}
					<p class="trial">New subscribers start with 7 days free: $0 today, cancel any time.</p>
				{/if}
			{/if}

			<ul class="outcomes">
				{#each OUTCOMES as outcome (outcome)}
					<li>{outcome}</li>
				{/each}
			</ul>

			<SubscribeButton className="!py-3 !text-lg w-full !rounded-2xl" />

			{#if isNative === true}
				<div class="terms">
					<p class="terms-title">Subscription: Parallel Arabic Premium</p>
					<ul class="terms-list">
						<li>
							Monthly: 1 month, auto-renewing, {storePlans?.monthly.priceString ?? '$10.00'} per month{storePlans
								?.monthly.trialDays
								? `, after a ${storePlans.monthly.trialDays}-day free trial`
								: ''}
						</li>
						{#if storePlans?.annual}
							<li>
								Annual: 1 year, auto-renewing, {storePlans.annual.priceString} per year{storePlans
									.annual.trialDays
									? `, after a ${storePlans.annual.trialDays}-day free trial`
									: ''}
							</li>
						{/if}
					</ul>
					<p>
						{#if appleTrialDays}
							The free trial is for new subscribers only. If you don't cancel at least 24 hours
							before the trial ends, your subscription starts and you are charged the plan's price.
						{/if}
						Payment will be charged to your Apple ID account at the confirmation of purchase{appleTrialDays
							? ', or at the end of the free trial'
							: ''}. Subscription automatically renews unless auto-renew is turned off at least 24
						hours before the end of the current period. Your account will be charged for renewal
						within 24 hours prior to the end of the current period at the same price. You can manage
						your subscription and turn off auto-renewal in your Apple ID Account Settings after
						purchase.
					</p>
				</div>
				<p class="legal">
					By subscribing you agree to our
					<a
						href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
						target="_blank"
						class="underline">Terms of Use (EULA)</a
					>
					and <a href={resolve('/privacy')} class="underline">Privacy Policy</a>.
				</p>
			{:else if isNative === false}
				<p class="legal">
					Payments are handled securely by Stripe. Your plan renews automatically until you cancel,
					which you can do any time from your profile. By subscribing you agree to our
					<a href={resolve('/privacy')} class="underline">Privacy Policy</a>.
				</p>
			{/if}
		</section>

		{#if trialDays}
			<section class="plan" aria-labelledby="trial-title">
				<h2 id="trial-title" class="plan-name">How the free trial works</h2>
				<ol class="trial-steps">
					<li><strong>Today</strong><span>Full access to everything, $0</span></li>
					<li>
						<strong>Day {trialDays}</strong><span
							>Your plan starts, unless you cancel before then</span
						>
					</li>
					<li>
						<strong>Any time</strong><span
							>{isNative
								? 'Cancel in your Apple ID settings'
								: 'Cancel from your profile, nothing charged before day 7'}</span
						>
					</li>
				</ol>
				{#if !page.data.user}
					<a href={resolve('/signup')} class="free-cta">New here? Create your account</a>
				{/if}
			</section>
		{/if}
	</div>

	<div class="mx-auto mt-10 max-w-4xl text-center">
		<button class="all-toggle" aria-expanded={showAll} onclick={() => (showAll = !showAll)}>
			{showAll ? 'Hide' : 'See'} everything Premium includes
		</button>
		{#if showAll}
			<div in:fly={{ y: 10, duration: 250 }}>
				<FeatureGrid />
			</div>
		{/if}
	</div>

	<SocialProof quotes={3} class="mx-auto mt-10 max-w-5xl" />
</div>

<style>
	.kicker {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text2);
	}

	.title {
		margin-top: 0.4rem;
		font-size: clamp(2rem, 6vw, 3.2rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.035em;
		color: var(--text1);
		text-wrap: balance;
	}

	.lede {
		margin-top: 1rem;
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--text2);
	}

	.plans {
		display: grid;
		gap: 1.25rem;
		max-width: 56rem;
		margin: 2.5rem auto 0;
		align-items: start;
	}

	@media (min-width: 900px) {
		.plans {
			grid-template-columns: 1.25fr 1fr;
		}
		.plans--single {
			grid-template-columns: minmax(0, 34rem);
			justify-content: center;
		}
	}

	.plan {
		border-radius: 1.5rem;
		border: 2px solid var(--tile5);
		background: var(--tile4);
		padding: 1.5rem 1.4rem 1.6rem;
	}

	.plan--premium {
		border-color: var(--brand);
		background: var(--tile3);
		box-shadow: 0 6px 0 var(--tile5);
	}

	.plan-name {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text1);
	}

	.price {
		margin-top: 0.5rem;
		font-size: 2.4rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1;
		color: var(--text1);
	}

	.price-unit {
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: 0;
		color: var(--text2);
	}

	.price-alt {
		margin-top: 0.4rem;
		font-size: 0.9rem;
		color: var(--text2);
	}

	.trial {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
	}

	.outcomes {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin: 1.25rem 0 1.4rem;
	}

	.outcomes li {
		position: relative;
		padding-left: 1.4rem;
		line-height: 1.4;
	}

	.outcomes li {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.outcomes li::before {
		content: '';
		position: absolute;
		left: 0.2rem;
		top: 0.5rem;
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--brand);
	}

	.trial-steps {
		display: grid;
		gap: 0.9rem;
		margin: 1.1rem 0 1.4rem;
		border-left: 2px solid var(--tile5);
		padding-left: 1rem;
	}

	.trial-steps li {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.92rem;
		line-height: 1.4;
		color: var(--text2);
	}

	.trial-steps strong {
		color: var(--text1);
	}

	.terms {
		margin-top: 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--tile6);
		background: var(--tile2);
		padding: 0.9rem 1rem;
		font-size: 0.75rem;
		line-height: 1.55;
		color: var(--text2);
	}

	.terms-title {
		margin-bottom: 0.4rem;
		font-weight: 600;
		color: var(--text1);
	}

	.terms-list {
		margin-bottom: 0.6rem;
		padding-left: 1rem;
		list-style: disc;
	}

	.legal {
		margin-top: 0.85rem;
		font-size: 0.75rem;
		line-height: 1.5;
		color: var(--text2);
		text-align: center;
	}

	.free-cta {
		display: block;
		border-radius: 1rem;
		border: 2px solid var(--tile6);
		background: var(--tile3);
		padding: 0.75rem 1rem;
		text-align: center;
		font-weight: 600;
		color: var(--text1);
		transition: background 0.18s ease;
	}

	.free-cta:hover {
		background: var(--tile5);
	}

	.all-toggle {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.all-toggle:hover {
		color: var(--text1);
	}
</style>
