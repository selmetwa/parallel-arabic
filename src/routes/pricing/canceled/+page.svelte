<script>
	let { data } = $props();

	const timestamp = data.user?.subscription_end_date ?? 0;
	const date = new Date(timestamp * 1000);
</script>

{#if !data?.user?.is_subscriber}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-400 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">
			Your subscription has been cancelled successfully
		</h1>
		<p class="mt-2 text-lg text-text-300">
			Your subscription will be active until {date.toLocaleString()}
		</p>
	</div>
{:else}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-400 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">You are subscribed</h1>
	</div>
{/if}
