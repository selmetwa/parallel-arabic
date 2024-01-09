<script>
	import '../app.css';
  import Navigation from '../components/Navigation.svelte';
</script>

<svelte:head>
	<title>Parallel Arabic</title>
</svelte:head>
<div class="max-w-6xl h-full m-auto bg-blue-200 border-x border-blue-100">
  <Navigation />
	<slot />
</div>
