<script>
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import { sections } from '$lib/constants/sections';

	export let data;

  $: isModalOpen = false;

  function openPaywallModal() {
    isModalOpen = true;
  }

  function handleCloseModal() {
    isModalOpen = false;
  }
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>
<h1 class="mt-12 pl-8 font-semibold text-2xl text-text-300">Practice writing over 4,000 words.</h1>
{#if !data.hasActiveSubscription}
  <p class=" pl-8 text-text-300 text-lg">You are not currently subscribed and will not have access to all the vocabulary</p>
{/if}
<section class="mb-12 grid grid-cols-1 gap-3 p-8 sm:grid-cols-3">
	{#each sections as section}
		{#if section.isPaywalled && !data.hasActiveSubscription}
			<button
        on:click={openPaywallModal}
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
				href={`write/${section.path}`}
			>
				{section.name}
				<p class="text-sm font-light">{section.count} words</p>
			</a>
		{/if}
	{/each}
</section>
