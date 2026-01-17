<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import DialectNavigation from '$lib/components/DialectNavigation.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import Onboarding from '$lib/components/Onboarding.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import BottomNavigation from '$lib/components/BottomNavigation.svelte';
  import { onMount } from 'svelte';
  import { theme, sidebarCollapsed } from '$lib/store/store';
  import { initializePreferences } from '$lib/stores/userPreferences';
  import Button from '$lib/components/Button.svelte';
  import Footer from "$lib/components/Footer.svelte";
  import RadioButton from '$lib/components/RadioButton.svelte';
  import ChatWidget from '$lib/components/ChatWidget.svelte';
  import { Toaster } from 'svelte-sonner';

  import { invalidate, goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { pwaInfo } from 'virtual:pwa-info';
  import { dev } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { getPageMeta, generateStructuredData } from '$lib/utils/seo';

  // Helper to detect if running in Capacitor native app
  const isNativeApp = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
  };


  let { data, children } = $props();
  $inspect(data)
	let isOpen = $state(false);
	
	// Use showOnboarding from server data (which already checks URL and onboarding status)
	// Update reactively when data or URL changes
	let showOnboarding = $state(data.showOnboarding || false);
	
	$effect(() => {
		// Update showOnboarding when server data changes
		// The server already checks: newSignup=true AND !onboarding_completed
		showOnboarding = data.showOnboarding || false;
	});
	
	$effect(() => {
		// Initialize user preferences from server data
		initializePreferences(data.user);
	});

	let root: HTMLElement | null;
	let doc: Element | null;
	
	// Get session and supabase client from data
	let { session, supabase } = $derived(data)
	
	onMount(async () => {
		console.log('🚀 App onMount started');
		console.log('🔍 Is native app:', isNativeApp());
		
		root = document.documentElement;
		doc = document.firstElementChild || null;
		
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
					console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error) {
					console.log('SW registration error', error);
				}
			});
		}
		
		// Hide splash screen once app is ready (Capacitor only)
		if (isNativeApp()) {
			try {
				const { SplashScreen } = await import('@capacitor/splash-screen');
				await SplashScreen.hide();
				console.log('✅ Splash screen hidden');
			} catch (e) {
				console.error('Failed to hide splash:', e);
			}
		}

		console.log('🚀 App onMount - about to setup auth listener');
		
		// Listen to auth changes and invalidate layout when session changes
		const { data: authData } = supabase.auth.onAuthStateChange((event: string, newSession: any) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth')
			}
		})
		
		console.log('✅ App fully loaded');
		
		return () => authData.subscription.unsubscribe()
	});

	function handleCloseDrawer() {
		isOpen = false;
	}

	function handleOpenDrawer() {
		isOpen = true;
	}

	function handleCloseOnboarding() {
		showOnboarding = false;
		// Remove the newSignup query parameter from URL
		const url = new URL(window.location.href);
		url.searchParams.delete('newSignup');
		goto(url.pathname + url.search, { replaceState: true, noScroll: true });
		// Invalidate to refresh the layout data
		invalidate('supabase:auth');
	}

	const onTheme = (event: Event) => {
	 const value = (event.target as HTMLInputElement).value;

		localStorage.setItem('color-scheme', value);
		doc?.setAttribute('color-scheme', value);
		theme.set(value);
	};

  let themeValue = $state('')

  theme.subscribe((value) => {
    themeValue = value;
  });

	// PWA manifest link
	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	// Determine current page for SEO
	const currentPage = $derived.by(() => {
		const path = $page.url.pathname;
		
		// Extract page identifier from path
		if (path === '/') return 'home';
		if (path.startsWith('/lessons/')) {
			// Check if it's a specific lesson or dialect lessons page
			const parts = path.split('/').filter(p => p);
			if (parts.length === 2 && parts[0] === 'lessons') {
				// /lessons/[id] - specific lesson
				return 'lesson';
			}
			// /lessons/[dialect] or /lessons/structured/[dialect]
			return 'lessons';
		}
		if (path.startsWith('/stories/')) {
			const parts = path.split('/').filter(p => p);
			if (parts.length === 2 && parts[0] === 'stories') {
				// /stories/[id] - specific story
				return 'story';
			}
			// /stories/[dialect]
			return 'stories';
		}
		if (path === '/review/import') return 'import';
		if (path === '/review' || path.startsWith('/review/')) return 'review';
		if (path === '/tutor') return 'tutor';
		if (path === '/stories') return 'stories';
		if (path === '/lessons') return 'lessons';
		if (path.startsWith('/alphabet')) return 'alphabet';
		if (path === '/videos') return 'videos';
		if (path === '/vocabulary') return 'vocabulary';
		if (path === '/about') return 'about';
		if (path === '/faq') return 'faq';
		
		return 'home';
	});

	// Get page-specific data from page store
	const pageData = $derived.by(() => {
		// Try to get data from the page store if available
		// This will be populated by individual page load functions
		try {
			return $page.data || {};
		} catch {
			return {};
		}
	});

	// Generate SEO meta tags
	const seoMeta = $derived.by(() => {
		const pageType = currentPage;
		const data = pageData;
		
		// Extract dialect from path if available
		let pathParts: string[] = [];
		try {
			pathParts = $page.url.pathname.split('/').filter(p => p);
		} catch {
			pathParts = [];
		}
		
		const dialect = pathParts.find(p => 
			['egyptian-arabic', 'levantine', 'darija', 'fusha'].includes(p)
		);
		
		// For lesson pages, try to get lesson data
		if (pageType === 'lesson' && data?.lesson) {
			return getPageMeta(pageType, {
				title: data.lesson.title || data.lesson.title_arabic,
				description: data.lesson.description,
				id: data.lesson.id,
				dialect: data.lesson.dialect || dialect
			});
		}
		
		// For story pages, try to get story data
		if (pageType === 'story' && data?.story) {
			return getPageMeta(pageType, {
				title: data.story.title,
				description: data.story.description,
				id: data.story.id,
				dialect: data.story.dialect || dialect
			});
		}
		
		return getPageMeta(pageType, { ...data, dialect });
	});

	// Generate structured data
	const structuredData = $derived.by(() => {
		const pageType = currentPage;
		const data = pageData;
		
		// For lesson pages, use lesson data
		if (pageType === 'lesson' && data?.lesson) {
			return generateStructuredData(pageType, {
				title: data.lesson.title || data.lesson.title_arabic,
				description: data.lesson.description,
				level: data.lesson.level
			});
		}
		
		// For story pages, use story data
		if (pageType === 'story' && data?.story) {
			return generateStructuredData(pageType, {
				title: data.story.title,
				description: data.story.description
			});
		}
		
		return generateStructuredData(pageType, data);
	});
</script>

<svelte:head>
	<title>{seoMeta.title}</title>
	<meta name="description" content={seoMeta.description} />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={seoMeta.type || 'website'} />
	<meta property="og:url" content={seoMeta.url || 'https://www.parallel-arabic.com'} />
	<meta property="og:title" content={seoMeta.title} />
	<meta property="og:description" content={seoMeta.description} />
	<meta property="og:image" content={seoMeta.image || 'https://www.parallel-arabic.com/images/banner.png'} />
	<meta property="og:site_name" content="Parallel Arabic" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={seoMeta.url || 'https://www.parallel-arabic.com'} />
	<meta name="twitter:title" content={seoMeta.title} />
	<meta name="twitter:description" content={seoMeta.description} />
	<meta name="twitter:image" content={seoMeta.image || 'https://www.parallel-arabic.com/images/banner.png'} />
	
	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={seoMeta.url || 'https://www.parallel-arabic.com'} />
	
	<!-- Structured Data (JSON-LD) -->
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	
	{@html webManifest}
</svelte:head>

	<Drawer {isOpen} {handleCloseDrawer}>
    <div>
      <header class="items-center border-b-2 border-tile-600 py-4 px-3 flex flex-row justify-between">
        <h1 class="text-xl font-bold text-text-300">Color theme</h1>
        <div class="w-fit">
          <Button onClick={handleCloseDrawer} type="button">
            Close
          </Button>
        </div>
      </header>

		<form oninput={onTheme} class="flex flex-col gap-2 mt-8 px-3">
      <RadioButton
        selectableFor="light"
        onClick={onTheme}
        value="light"
        isSelected={themeValue === 'light'}
        text="Light"
        className="text-lg"
        />
        <RadioButton
        selectableFor="dim"
        onClick={onTheme}
        value="dim"
        isSelected={themeValue === 'dim'}
        text="Dim"
        className="text-lg"
        />
        <RadioButton
        onClick={onTheme}
        className="text-lg"
        selectableFor="dark"
        value="dark"
        isSelected={themeValue === 'Dark'}
        text="Dark"
        />
		</form>
  </div>
	</Drawer>

	<!-- Desktop Sidebar -->
	<Sidebar session={session} {handleOpenDrawer} />

	<!-- Expand Sidebar Button (shown when collapsed) -->
	{#if $sidebarCollapsed}
		<button
			type="button"
			onclick={() => sidebarCollapsed.set(false)}
			class="hidden lg:flex fixed top-4 left-4 z-50 p-3 bg-tile-500 hover:bg-tile-600 border-2 border-tile-600 rounded-lg shadow-lg transition-all duration-300 text-text-300"
			aria-label="Expand sidebar"
			title="Expand sidebar"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
			</svg>
		</button>
	{/if}

	<!-- Main Content Area -->
	<main class="flex flex-col bg-tile-200 pb-20 lg:pb-0 min-h-screen transition-all duration-300 {$sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'}">
		<!-- Top Navigation - Only visible on mobile -->
		<div class="lg:hidden">
			<Navigation
				user={data.user}
				{handleOpenDrawer}
				session={data.session}
				userEmail={data?.user?.email ?? ""}
				targetDialect={data.targetDialect}
			/>
		</div>

		<!-- Dialect Navigation - Visible on all screen sizes -->
		<DialectNavigation />

		<!-- Page Content -->
		<div class="flex-1 pb-10">
			{@render children()}
		</div>

		<!-- Footer -->
		<Footer />
	</main>

	<!-- Bottom Navigation - Mobile only -->
	<BottomNavigation />

  <!-- Chat Widget - only shows on desktop -->
  <ChatWidget />

  <!-- Toast notifications -->
  <Toaster 
    position="bottom-right" 
    richColors={true}
    closeButton={true}
    visibleToasts={5}
    expand={false}
  />

  <!-- Onboarding Modal - Shows automatically for new users -->
  <Onboarding isOpen={showOnboarding} handleCloseModal={handleCloseOnboarding} />

