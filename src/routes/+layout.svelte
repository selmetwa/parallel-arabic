<script>
	import '../app.css';
	import Navigation from '../components/Navigation.svelte';
	export let data;
</script>

<svelte:head>
	<title>Parallel Arabic</title>
</svelte:head>

<div class="max-w-6xl h-full m-auto bg-blue-200 border-x border-raison">
	<Navigation session={!!data.session}/>
	<slot />
</div>
