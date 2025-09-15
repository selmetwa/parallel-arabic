<script lang="ts">
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import { levantineSections } from '$lib/constants/levantine-sections';
	let { data } = $props();

	let isModalOpen = $state(false);
	
	function openPaywallModal() {
		isModalOpen = true;
	}

	function handleCloseModal() {
		isModalOpen = false;
	}
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
	<div class="text-left mb-6">
		<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">Vocabulary Builder</h1>
		<p class="text-text-200 text-lg sm:text-xl leading-snug">
			Practice over 2,500 words with fun multiple choice quizzes.
		</p>
		{#if !data.hasActiveSubscription}
			<p class="text-text-200 text-base mt-2 opacity-90">
				You are not currently subscribed and will not have access to all the vocabulary
			</p>
		{/if}
	</div>
	
	<ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 auto-rows-fr">
		{#each levantineSections as section}
			{#if section.isPaywalled && !data.hasActiveSubscription}
			<li class="flex">
				<button
					onclick={openPaywallModal}
					class="flex w-full"
				>
					<article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
						<div class="flex flex-col gap-1">
							<div class="flex flex-row items-center gap-2">
								{#if section.isPaywalled}
									<span class="text-lg leading-none flex-shrink-0 self-start mt-[4px]">🔒</span>
								{/if}
								<p class="text-md text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300 flex-1">
									{section.name}
								</p>
							</div>
						</div>
					</article>
				</button>
			</li>
			{:else}
			<li class="flex">
				<a
					href={`vocab/${section.path}`}
					class="flex w-full"
				>
					<article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
						<div class="flex flex-col gap-1">
							<p class="text-md text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">
								{section.name}
							</p>
						</div>
					</article>
				</a>
			</li>
			{/if}
		{/each}
	</ul>
</section>
