<script lang="ts">
	import Button from '../../../../components/Button.svelte';
	export let key = '';
	export let handleOpenDrawer = () => {};
</script>

<header
	class="flex w-full flex-col justify-between gap-4 border-t border-tile-600 bg-tile-300 p-3 sm:flex-row"
>
	<figure>
		<figcaption>Listen to the Story</figcaption>
		<audio controls src={`/src/stories/${key}.mp3`}></audio>
	</figure>
			<Button onClick={handleOpenDrawer} type="button">Open Drawer</Button>
</header>
