<script lang="ts">
	import '../app.css';
	import Navigation from '../components/Navigation.svelte';
	import Drawer from '../components/Drawer.svelte';
	import { onMount } from 'svelte';
	import { hue, theme } from '../store/store';
	import Svg from '../components/Svg.svelte';
	import Button from '../components/Button.svelte';
  import Footer from "../components/Footer.svelte";

  export let data;

	let isOpen = false;

	let root: HTMLElement | null;
	let doc: Element | null;

	onMount(() => {
		root = document.documentElement;
		doc = document.firstElementChild || null;
	});

	function handleCloseDrawer() {
		isOpen = false;
	}

	function handleOpenDrawer() {
		isOpen = true;
	}

	const onHue = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;

		localStorage.setItem('--brand-hue', value);
		root?.style.setProperty('--brand-hue', value);
		hue.set(value);
	};

	const onTheme = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;

		localStorage.setItem('color-scheme', value);
		doc?.setAttribute('color-scheme', value);
		theme.set(value);
	};


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
		<div class="content input-wrapper flex flex-col pl-3 pr-8 mt-8">
      <label for="hue" class="text-text-300 text-lg font-medium">Hue</label>
			<input
				on:input={onHue}
				type="range"
				value="200"
				min="0"
				max="260"
				class="brand-hue-input"
				aria-label="hue-slider"
				tabindex="0"
			/>
		</div>
		<form on:input={onTheme} class="flex flex-col gap-2 mt-8 px-3">
			<div class="flex flex-row items-center gap-1 cursor-pointer">
				<input
					checked
					type="radio"
					id="light"
					name="theme"
          class="w-4 h-4"
					value="light"
					aria-label="radio-button-light-theme"
					tabindex="0"
				/>
        <label for="light" class="text-text-300 text-base font-medium">Light Mode</label>
			</div>
			<div class="flex flex-row items-center gap-1 cursor-pointer">
				<input
					type="radio"
					id="dim"
					name="theme"
					value="dim"
          class="w-4 h-4"
					aria-label="radio-button-dim-theme"
					tabindex="0"
				/>
        <label for="dim" class="text-text-300 text-base font-medium">Dim Mode </label>
			</div>
			<div class="flex flex-row items-center gap-1 cursor-pointer">
				<input
					type="radio"
					id="dark"
					name="theme"
					value="dark"
          class="w-4 h-4"
					aria-label="radio-button-dark-theme"
					tabindex="0"
				/>
        <label for="dark" class="text-text-300 text-base font-medium">Dark Mode</label>
			</div>
		</form>
  </div>
	</Drawer>
	<div class="flex flex-row">
		<aside class="flex flex-1 justify-center overflow-hidden py-12">
			<div class="flex flex-col gap-5">
				<Svg />
				<Svg />
				<Svg />
				<Svg />
			</div>
		</aside>
		<main class="relative min-h-full w-full md:w-[800px] max-w-[800px] shrink-0 border-x border-tile-600 bg-tile-200 pb-24">
			<Navigation {handleOpenDrawer} session={data.session} />
			<slot />
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