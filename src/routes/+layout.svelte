<script lang="ts">
	import '../app.css';
	// Critical components - needed for initial render
	import Navigation from '$lib/components/Navigation.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import { onMount } from 'svelte';
	import { theme, sidebarCollapsed } from '$lib/store/store';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { pwaInfo } from 'virtual:pwa-info';
	import { dev, browser } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import {
		resolveBreadcrumbs,
		resolvePageMeta,
		resolveStructuredData,
		siteStructuredData
	} from '$lib/utils/seo';
	import {
		importJobStore,
		resumeImportJobIfNeeded,
		onImportComplete,
		onImportError
	} from '$lib/stores/import-job';
	import {
		showWordImportSuccessToast,
		showWordImportErrorToast,
		showWordImportToast
	} from '$lib/helpers/toast-helpers';

	// Lazy loaded components - not needed for initial paint
	// These are loaded after the page renders to improve FCP/LCP
	let Drawer: typeof import('$lib/components/Drawer.svelte').default | null = $state(null);
	let Button: typeof import('$lib/components/Button.svelte').default | null = $state(null);
	let RadioButton: typeof import('$lib/components/RadioButton.svelte').default | null =
		$state(null);
	let ChatWidget: typeof import('$lib/components/ChatWidget.svelte').default | null = $state(null);
	let Toaster: typeof import('svelte-sonner').Toaster | null = $state(null);
	let Onboarding: typeof import('$lib/components/Onboarding.svelte').default | null = $state(null);
	let AppBanner: typeof import('$lib/components/AppBanner.svelte').default | null = $state(null);
	let lazyComponentsLoaded = $state(false);

	// Helper to detect if running in Capacitor native app
	const isNativeApp = () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return !!(
			window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
		).Capacitor?.isNativePlatform?.();
	};

	let { data, children } = $props();
	$inspect(data);
	let isOpen = $state(false);

	let onboardingDismissed = $state(false);
	let showOnboarding = $state(data.showOnboarding || false);

	$effect(() => {
		if (!onboardingDismissed) {
			showOnboarding = data.showOnboarding || false;
		}
	});

	$effect(() => {
		$inspect(data);
		userXp.set(data.userXp ?? 0);
		userLevel.set(data.userLevel ?? 1);
	});

	let root: HTMLElement | null;
	let doc: Element | null;

	// Get session and supabase client from data
	let { session, supabase } = $derived(data);

	onMount(async () => {
		root = document.documentElement;
		doc = document.firstElementChild || null;

		// Lazy load non-critical components after initial paint
		// This improves FCP/LCP by ~230KB off the critical path
		if (browser) {
			const [drawerMod, buttonMod, radioMod, chatMod, toasterMod, onboardingMod, appBannerMod] =
				await Promise.all([
					import('$lib/components/Drawer.svelte'),
					import('$lib/components/Button.svelte'),
					import('$lib/components/RadioButton.svelte'),
					import('$lib/components/ChatWidget.svelte'),
					import('svelte-sonner'),
					import('$lib/components/Onboarding.svelte'),
					import('$lib/components/AppBanner.svelte')
				]);

			Drawer = drawerMod.default;
			Button = buttonMod.default;
			RadioButton = radioMod.default;
			ChatWidget = chatMod.default;
			Toaster = toasterMod.Toaster;
			Onboarding = onboardingMod.default;
			AppBanner = appBannerMod.default;
			lazyComponentsLoaded = true;
		}

		// Resume any in-progress word import job and wire up toast callbacks
		let importToastId: string | number | null = null;

		const unsubImportJob = importJobStore.subscribe((state) => {
			if (state.status === 'processing' && !importToastId && lazyComponentsLoaded) {
				importToastId = showWordImportToast();
			}
		});

		onImportComplete((state) => {
			if (importToastId) {
				showWordImportSuccessToast(importToastId, state.importedCount, state.skippedCount);
			}
			importToastId = null;
		});

		onImportError((state) => {
			if (importToastId) {
				showWordImportErrorToast(importToastId, state.error || 'Import failed');
			}
			importToastId = null;
		});

		resumeImportJobIfNeeded().catch(() => {});

		// Initialize RevenueCat in native app when user is logged in
		if (isNativeApp() && data.user?.id) {
			const { RevenueCatService } = await import('$lib/services/revenuecat.service');
			RevenueCatService.initialize(data.user.id).catch(console.error);
		}

		// Only inject Vercel analytics when NOT in native app
		if (!isNativeApp()) {
			injectAnalytics({ mode: dev ? 'development' : 'production' });
		}

		// Register PWA service worker - skip in native app
		if (pwaInfo && !isNativeApp()) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					if (dev) console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error) {
					if (dev) console.log('SW registration error', error);
				}
			});
		}

		// Hide splash screen once app is ready (Capacitor only)
		if (isNativeApp()) {
			try {
				const { SplashScreen } = await import('@capacitor/splash-screen');
				await SplashScreen.hide();
			} catch (e) {
				console.error('Failed to hide splash:', e);
			}
		}

		// Listen to auth changes and invalidate layout when session changes
		const { data: authData } = supabase.auth.onAuthStateChange((event: string, newSession: any) => {
			console.log(
				'[auth state change]',
				event,
				'session:',
				!!newSession,
				'expires_at:',
				newSession?.expires_at
			);
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => {
			authData.subscription.unsubscribe();
			unsubImportJob();
		};
	});

	function handleCloseDrawer() {
		isOpen = false;
	}

	function handleOpenDrawer() {
		isOpen = true;
	}

	function handleCloseOnboarding() {
		showOnboarding = false;
		onboardingDismissed = true;
	}

	const onTheme = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;

		localStorage.setItem('color-scheme', value);
		doc?.setAttribute('color-scheme', value);
		theme.set(value);
	};

	let themeValue = $state('');

	theme.subscribe((value) => {
		themeValue = value;
	});

	// PWA manifest link
	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	// SEO metadata. All resolution lives in $lib/utils/seo so it can be unit
	// tested; a route can override everything by returning `seo` from its load.
	const seoMeta = $derived(resolvePageMeta($page.url?.pathname ?? '/', $page.data));
	const structuredData = $derived(resolveStructuredData($page.url?.pathname ?? '/', $page.data));
	const siteGraph = siteStructuredData();
	const breadcrumbs = $derived(resolveBreadcrumbs($page.url?.pathname ?? '/', $page.data));
</script>

<svelte:head>
	<title>{seoMeta.title}</title>
	<meta name="description" content={seoMeta.description} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={seoMeta.type || 'website'} />
	<meta property="og:url" content={seoMeta.url || 'https://www.parallel-arabic.com'} />
	<meta property="og:title" content={seoMeta.title} />
	<meta property="og:description" content={seoMeta.description} />
	<meta
		property="og:image"
		content={seoMeta.image || 'https://www.parallel-arabic.com/images/banner.png'}
	/>
	<meta property="og:site_name" content="Parallel Arabic" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={seoMeta.url || 'https://www.parallel-arabic.com'} />
	<meta name="twitter:title" content={seoMeta.title} />
	<meta name="twitter:description" content={seoMeta.description} />
	<meta
		name="twitter:image"
		content={seoMeta.image || 'https://www.parallel-arabic.com/images/banner.png'}
	/>

	<!-- Additional SEO -->
	<meta name="robots" content={seoMeta.noindex ? 'noindex, follow' : 'index, follow'} />
	<link rel="canonical" href={seoMeta.url || 'https://www.parallel-arabic.com'} />

	<!-- Structured Data (JSON-LD) -->
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(siteGraph)}</script>`}
	{#if breadcrumbs}
		{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`}
	{/if}

	{@html webManifest}
</svelte:head>

<!-- Drawer - lazy loaded -->
{#if Drawer && Button && RadioButton}
	<svelte:component this={Drawer} {isOpen} {handleCloseDrawer}>
		<div>
			<header
				class="flex flex-row items-center justify-between border-b-2 border-tile-600 px-3 py-4"
			>
				<h1 class="text-xl font-bold text-text-300">Color theme</h1>
				<div class="w-fit">
					<svelte:component this={Button} onClick={handleCloseDrawer} type="button">
						Close
					</svelte:component>
				</div>
			</header>

			<form oninput={onTheme} class="mt-8 flex flex-col gap-2 px-3">
				<svelte:component
					this={RadioButton}
					selectableFor="light"
					onClick={onTheme}
					value="light"
					isSelected={themeValue === 'light'}
					text="Light"
					className="text-lg"
				/>
				<svelte:component
					this={RadioButton}
					selectableFor="dim"
					onClick={onTheme}
					value="dim"
					isSelected={themeValue === 'dim'}
					text="Dim"
					className="text-lg"
				/>
				<svelte:component
					this={RadioButton}
					onClick={onTheme}
					className="text-lg"
					selectableFor="dark"
					value="dark"
					isSelected={themeValue === 'Dark'}
					text="Dark"
				/>
			</form>
		</div>
	</svelte:component>
{/if}

<!-- Desktop Sidebar -->
<Sidebar {session} {handleOpenDrawer} />

<!-- Expand Sidebar Button (shown when collapsed) -->
{#if $sidebarCollapsed}
	<button
		type="button"
		onclick={() => sidebarCollapsed.set(false)}
		class="fixed left-4 z-50 hidden rounded-lg border-2 border-tile-600 bg-tile-500 p-3 text-text-300 shadow-lg transition-all duration-300 hover:bg-tile-600 lg:flex top-4"
		aria-label="Expand sidebar"
		title="Expand sidebar"
	>
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 12h16M4 18h16"
			></path>
		</svg>
	</button>
{/if}

<!-- Main Content Area -->
<main
	class="flex min-h-screen flex-col bg-tile-200 transition-all duration-300 {$sidebarCollapsed
		? 'lg:ml-0'
		: 'lg:ml-64'}"
>
	<!-- Top Navigation - Only visible on mobile -->
	<div class="lg:hidden">
		<Navigation
			user={data.user}
			{handleOpenDrawer}
			session={data.session}
			userEmail={data?.user?.email ?? ''}
			targetDialect={data.targetDialect}
		/>
	</div>

	<!--
		Icon sprite. Definitions only, never painted. InlineAudioButton appears once
		per row in the vocabulary tables, so its path data lives here once instead
		of being repeated a thousand times in the HTML.
	-->
	<svg aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0">
		<symbol id="pa-speaker" viewBox="0 0 20 20">
			<path
				fill-rule="evenodd"
				d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
				clip-rule="evenodd"
			/>
		</symbol>
	</svg>

	<!-- Page Content -->
	<div class="flex-1 pb-10">
		{@render children()}
	</div>

	<!-- Footer -->
	<Footer />
</main>

<!-- Chat Widget - lazy loaded, only shows on desktop -->
{#if ChatWidget}
	<svelte:component this={ChatWidget} />
{/if}

<!-- Toast notifications - lazy loaded -->
{#if Toaster}
	<svelte:component
		this={Toaster}
		position="bottom-right"
		richColors={true}
		closeButton={true}
		visibleToasts={5}
		expand={false}
	/>
{/if}

<!-- Onboarding Modal - lazy loaded, shows automatically for new users -->
{#if Onboarding && showOnboarding}
	<svelte:component
		this={Onboarding}
		isOpen={showOnboarding}
		handleCloseModal={handleCloseOnboarding}
	/>
{/if}

<!-- iOS app banner - lazy loaded, decides for itself whether to show -->
{#if AppBanner && !showOnboarding}
	<AppBanner />
{/if}
