<script>
	import '../app.css';
	import Navigation from '../components/Navigation.svelte';
	export let data;
</script>

<svelte:head>
	<title>Parallel Arabic</title>
</svelte:head>

<div class="bg-tile-100 h-full">
  <div class="max-w-5xl m-auto border-x border-tile-600 bg-tile-200 h-full">
    <Navigation session={!!data.session}/>
    <slot />
  </div>
</div>
