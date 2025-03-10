<script lang="ts">
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import { sections } from '$lib/constants/sections';
	let { data } = $props();

	let isModalOpen = $state(false);
	
	function openPaywallModal() {
		isModalOpen = true;
	}

	function handleCloseModal() {
		isModalOpen = false;
	}
</script>

<section class="mt-8 px-4 sm:mt-12 sm:px-16">
	<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>
	<h1 class="text-2xl font-semibold text-text-300">
		Practice over 6,000 words with fun multiple choice quizzes.
	</h1>
	{#if !data.hasActiveSubscription}
		<p class="text-lg text-text-300">
			You are not currently subscribed and will not have access to all the vocabulary
		</p>
	{/if}
	<div class="mb-12 grid grid-cols-1 gap-3 sm:grid-cols-3 mt-3">
		{#each sections as section}
			{#if section.isPaywalled && !data.hasActiveSubscription}
				<button
					onclick={openPaywallModal}
					class="transitional-all cursor-pointer border-2 border-tile-600 bg-tile-400 p-4 text-center font-semibold duration-300 hover:bg-tile-500"
				>
					{#if section.isPaywalled}
						<span class="text-red-500">🔒</span>
					{/if}
					{section.name}
					<p class="text-sm font-light">{section.count} words</p>
				</button>
			{:else}
				<a
					class="transitional-all cursor-pointer border-2 border-tile-600 bg-tile-400 p-4 text-center font-semibold duration-300 hover:bg-tile-500"
					href={`vocab/${section.path}`}
				>
					{section.name}
					<p class="text-sm font-light">{section.count} words</p>
				</a>
			{/if}
		{/each}
      </div>
</section>
