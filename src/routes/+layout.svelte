<script>
	import '../app.css';
	import Navigation from '../components/Navigation.svelte';
	export let data;
</script>

<svelte:head>
	<title>Parallel Arabic</title>
</svelte:head>

<div class="bg-tile-100">
  <div class="max-w-6xl h-full m-auto border-x border-tile-600 bg-tile-200">
    <Navigation session={!!data.session}/>
    <slot />
  </div>
</div>
