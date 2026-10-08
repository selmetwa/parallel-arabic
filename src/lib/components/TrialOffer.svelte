<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import SubscribeButton from '$lib/components/SubscribeButton.svelte';
	import { FEATURES } from '$lib/constants/features';
	import { isNativeApp } from '$lib/helpers/is-native-app';
	import { RevenueCatService } from '$lib/services/revenuecat.service';

	type Props = {
		/** e.g. "Egyptian Arabic"; falls back to generic copy when empty. */
		dialectName?: string;
		/** Renders "Continue with the free plan". Left out for the hard paywall. */
		onSkip?: () => void;
		onLogout?: () => void;
	};

	let { dialectName = '', onSkip, onLogout }: Props = $props();

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

<div class="text-center" in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
	{#if trialEligible}
		<span class="trial-kicker">7-day free trial</span>
		<h2 class="screen-title">Unlock everything free for 7 days</h2>
	{:else}
		<h2 class="screen-title">Subscribe to unlock everything</h2>
	{/if}
	<p class="screen-sub">
		{dialectName
			? `Everything you need to learn ${dialectName}, and more.`
			: 'Everything you need to learn Arabic, in one place.'}
	</p>

	<p class="trial-dialects">Egyptian, Levantine, Moroccan and MSA all included</p>

	<ul class="trial-grid">
		{#each FEATURES as feature, i (feature.slug)}
			<li class="trial-tile" in:fly={{ y: 14, duration: 400, delay: 120 + i * 40, easing: cubicOut }}>
				<span class="trial-tile-name">{feature.name}</span>
				<span class="trial-tile-blurb">{feature.blurb}</span>
			</li>
		{/each}
	</ul>

	<div class="mx-auto max-w-md">
		<SubscribeButton className="!py-3 !text-lg w-full !rounded-2xl" />

		{#if onSkip}
			<button class="skip-link mt-4" onclick={onSkip}>Continue with the free plan</button>
		{/if}
		{#if onLogout}
			<button class="skip-link mt-4" onclick={onLogout}>Log out</button>
		{/if}
	</div>
</div>

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

	.screen-sub {
		font-size: 0.9rem;
		color: var(--text2);
	}
	@media (min-width: 640px) {
		.screen-sub {
			font-size: 1rem;
		}
	}

	.trial-kicker {
		display: inline-block;
		margin-bottom: 0.75rem;
		padding: 0.3rem 0.85rem;
		border-radius: 100px;
		background: color-mix(in srgb, #10b981 16%, var(--tile3));
		border: 2px solid color-mix(in srgb, #10b981 40%, var(--tile5));
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--text1);
	}

	.trial-dialects {
		display: inline-block;
		margin: 1rem 0 1.25rem;
		padding: 0.35rem 0.9rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	.trial-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
		margin: 0 0 1.75rem;
		text-align: left;
	}
	@media (min-width: 640px) {
		.trial-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.65rem;
		}
	}
	@media (min-width: 1024px) {
		.trial-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	.trial-tile {
		padding: 0.6rem 0.75rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 3px 0 var(--tile5);
	}
	@media (min-width: 640px) {
		.trial-tile {
			padding: 0.8rem 0.9rem;
		}
	}

	.trial-tile-name {
		display: block;
		font-size: 0.84rem;
		font-weight: 700;
		line-height: 1.25;
		color: var(--text1);
	}

	/* Phones get name-only tiles so the price stays near the fold. */
	.trial-tile-blurb {
		display: none;
	}
	@media (min-width: 640px) {
		.trial-tile-blurb {
			display: block;
			margin-top: 0.2rem;
			font-size: 0.74rem;
			line-height: 1.4;
			color: var(--text2);
		}
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
