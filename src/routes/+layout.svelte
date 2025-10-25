<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import DialectNavigation from '$lib/components/DialectNavigation.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import { onMount } from 'svelte';
	import { theme } from '$lib/store/store';
	import Svg from '$lib/components/Svg.svelte';
	import Button from '$lib/components/Button.svelte';
  import Footer from "$lib/components/Footer.svelte";
  import RadioButton from '$lib/components/RadioButton.svelte';
  import ChatWidget from '$lib/components/ChatWidget.svelte';
  import { Toaster } from 'svelte-sonner';
  
  import { invalidate } from '$app/navigation'
  
  let { data, children } = $props();
  $inspect(data)
	let isOpen = $state(false);

	let root: HTMLElement | null;
	let doc: Element | null;
	
	// Get session and supabase client from data
	let { session, supabase } = $derived(data)
	
	onMount(() => {
		root = document.documentElement;
		doc = document.firstElementChild || null;
		
		// Listen to auth changes and invalidate layout when session changes
		const { data: authData } = supabase.auth.onAuthStateChange((event: string, newSession: any) => {
			if (newSession?.expires_at !== session?.expires_at) {
        console.log('session changed')
				invalidate('supabase:auth')
			}
		})
		
		return () => authData.subscription.unsubscribe()
	});

	function handleCloseDrawer() {
		isOpen = false;
	}

	function handleOpenDrawer() {
		isOpen = true;
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
</script>

<svelte:head>
	<title>Parallel Arabic</title>
</svelte:head>

	<Drawer {isOpen} {handleCloseDrawer}>
    <div>
      <header class="items-center border-b-2 border-tile-600 py-4 px-3 flex flex-row justify-between">
        <h1 class="text-xl font-bold text-text-300">Settings</h1>
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
	<div class="flex flex-row h-full">
		<aside class="flex flex-1 justify-center overflow-hidden py-12">
			<div class="flex flex-col gap-5">
				<Svg />
				<Svg />
				<Svg />
				<Svg />
			</div>
		</aside>
		<main class="relative !min-h-full shrink-0 border-x border-tile-600 bg-tile-200 pb-36 sm:pb-24 h-fit">
			<Navigation 
        {handleOpenDrawer} 
        session={data.session}
        userEmail={data?.user?.email ?? ""}
      />
			<DialectNavigation />
        {@render children()}
      <Footer />
    </main>
		<aside class="flex flex-1 justify-center overflow-hidden py-12">
			<div class="flex flex-col gap-5">
				<Svg />
				<Svg />
				<Svg />
				<Svg />
			</div>
		</aside>
	</div>

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

  <style>
    main {
      width: min(var(--layout-width), 100%);
    }
  </style>

