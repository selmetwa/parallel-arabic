<script lang="ts">
	import '../app.css';
	import Navigation from '../components/Navigation.svelte';
	import Drawer from '../components/Drawer.svelte';
	import { onMount } from 'svelte';
	import { hue, theme } from '../store/store';
	import Svg from '../components/Svg.svelte';

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

<div class="z-10 h-full bg-tile-100">
	<Drawer {isOpen} {handleCloseDrawer}>
    <div>
      <header class="border-b-2 border-tile-600 py-4 px-3">
        <h1 class="text-3xl font-bold text-text-300">Settings</h1>
      </header>
		<div class="content input-wrapper flex flex-col gap-2 pl-3 pr-8 mt-8">
      <label for="hue" class="text-text-300 text-xl font-semibold">Brand Hue</label>
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
		<form on:input={onTheme} class="flex flex-col gap-4 mt-8 px-3">
			<div class="flex flex-row items-center gap-2 cursor-pointer">
				<input
					checked
					type="radio"
					id="light"
					name="theme"
          class="w-5 h-5"
					value="light"
					aria-label="radio-button-light-theme"
					tabindex="0"
				/>
        <label for="light" class="text-text-300 text-xl font-semibold">Light Mode</label>
			</div>
			<div class="flex flex-row items-center gap-2 cursor-pointer">
				<input
					type="radio"
					id="dim"
					name="theme"
					value="dim"
          class="w-5 h-5"
					aria-label="radio-button-dim-theme"
					tabindex="0"
				/>
        <label for="dim" class="text-text-300 text-xl font-semibold">Dim Mode </label>
			</div>
			<div class="flex flex-row items-center gap-2 cursor-pointer">
				<input
					type="radio"
					id="dark"
					name="theme"
					value="dark"
          class="w-5 h-5"
					aria-label="radio-button-dark-theme"
					tabindex="0"
				/>
        <label for="dark" class="text-text-300 text-xl font-semibold">Dark Mode</label>
			</div>
		</form>
  </div>
	</Drawer>
	<div class="flex min-h-full flex-row">
		<aside class="flex flex-1 justify-center overflow-hidden py-12">
			<div class="flex flex-col gap-5">
				<Svg />
				<Svg />
				<Svg />
				<Svg />
			</div>
		</aside>
		<main class="min-h-full w-[800px] max-w-[800px] shrink-0 border-x border-tile-600 bg-tile-200">
			<Navigation {handleOpenDrawer} />
			<slot />
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
</div>

<style>
	.text {
		padding: 10px;
		/* line-height: 100px; */
		/* font-family: Rakkas; */
		color: var(--text-300);
		font-size: 50px;
		opacity: 0.1;
	}
</style>
