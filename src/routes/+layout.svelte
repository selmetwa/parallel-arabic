<script lang="ts">
	import '../app.css';
	import Navigation from '../components/Navigation.svelte';
	import Drawer from '../components/Drawer.svelte';
	import { onMount } from 'svelte';
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
	};

	const onTheme = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;

		localStorage.setItem('color-scheme', value);
		doc?.setAttribute('color-scheme', value);
	};
</script>

<svelte:head>
	<title>Parallel Arabic</title>
</svelte:head>

<div class="h-full bg-tile-100">
	<Drawer {isOpen} {handleCloseDrawer}>
		<div class="content input-wrapper">
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
		<form on:input={onTheme}>
			<div>
				<input
					checked
					type="radio"
					id="light"
					name="theme"
					value="light"
					aria-label="radio-button-light-theme"
					tabindex="0"
				/>
			</div>
			<div>
				<input
					type="radio"
					id="dim"
					name="theme"
					value="dim"
					aria-label="radio-button-dim-theme"
					tabindex="0"
				/>
			</div>
			<div>
				<input
					type="radio"
					id="dark"
					name="theme"
					value="dark"
					aria-label="radio-button-dark-theme"
					tabindex="0"
				/>
			</div>
		</form>
	</Drawer>
	<div class="m-auto h-full max-w-5xl border-x border-tile-600 bg-tile-200">
		<Navigation {handleOpenDrawer} />
		<slot />
	</div>
</div>
