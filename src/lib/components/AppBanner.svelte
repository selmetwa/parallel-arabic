<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import AppStoreBadge from '$lib/components/AppStoreBadge.svelte';
	import { isIosWeb, isNativeApp, isStandalone } from '$lib/helpers/is-native-app';

	const STORAGE_KEY = 'appBannerDismissed';

	/**
	 * null until the platform checks have run. They read window/navigator, so
	 * they cannot run during SSR, and rendering optimistically would flash the
	 * banner inside the native app before hydration corrects it.
	 */
	let eligible = $state<boolean | null>(null);

	// /mobile-app already leads with the App Store button.
	const onMobileAppPage = $derived($page.url?.pathname === '/mobile-app');
	const visible = $derived(eligible === true && !onMobileAppPage);

	function dismiss() {
		eligible = false;
		try {
			sessionStorage.setItem(STORAGE_KEY, 'true');
		} catch {
			// Safari private mode throws on write; hiding for this render is enough.
		}
	}

	onMount(() => {
		let dismissed = false;
		try {
			dismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
		} catch {
			// Storage unavailable — treat as not dismissed.
		}

		eligible = !dismissed && !isNativeApp() && isIosWeb() && !isStandalone();
	});
</script>

{#if visible}
	<div
		transition:fly={{ y: 80, duration: 250 }}
		class="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-tile-600 bg-tile-300 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
		role="region"
		aria-label="Get the Parallel Arabic iOS app"
	>
		<div class="mx-auto flex max-w-3xl items-center gap-3">
	

			<div class="min-w-0 flex-1">
				<p class="font-bold leading-tight text-text-300">Parallel Arabic is better in the app</p>
			</div>

			<AppStoreBadge
				className="rounded-xl border-2 border-tile-600 px-3 py-2"
				onNavigate={dismiss}
			/>

			<button
				type="button"
				onclick={dismiss}
				aria-label="Dismiss"
				class="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full border border-tile-600 bg-tile-500 text-text-200 transition-all duration-150 hover:bg-tile-600 hover:text-text-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 active:scale-95"
			>
				<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}
