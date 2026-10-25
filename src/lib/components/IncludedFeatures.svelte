<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';

	interface Props {
		/** The call to action kept in reach along the bottom of the desktop overlay. */
		bar: Snippet<[close: () => void]>;
		class?: string;
	}

	let { bar, class: className = '' }: Props = $props();

	let showAll = $state(false);
	/** Desktop only: "See everything included" opens as a full-page overlay. */
	let showAllPage = $state(false);

	function openIncluded() {
		if (window.matchMedia('(min-width: 1024px)').matches) showAllPage = true;
		else showAll = !showAll;
	}

	const close = () => (showAllPage = false);
</script>

<div class={className}>
	<button
		type="button"
		class="all-toggle"
		aria-expanded={showAll || showAllPage}
		aria-haspopup="dialog"
		onclick={openIncluded}
	>
		{#if showAll}Hide everything included{:else}See everything included <span aria-hidden="true">→</span>{/if}
	</button>
	{#if showAll}
		<div class="mt-3 text-center" in:fly={{ y: 10, duration: 250 }}>
			<FeatureGrid />
		</div>
	{/if}
</div>

<svelte:window onkeydown={(e) => showAllPage && e.key === 'Escape' && close()} />

{#if showAllPage}
	<div
		class="included-page"
		role="dialog"
		aria-modal="true"
		aria-labelledby="included-title"
		transition:fade={{ duration: 200 }}
	>
		<div class="included-body">
			<div class="included-head">
				<h2 id="included-title" class="included-title">Everything included</h2>
				<button type="button" class="included-close" aria-label="Close" onclick={close}>✕</button>
			</div>
			<div class="text-center">
				<FeatureGrid />
			</div>
		</div>
		<div class="included-bar">
			<div class="mx-auto max-w-md">
				{@render bar(close)}
			</div>
		</div>
	</div>
{/if}

<style>
	.all-toggle {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
	}
	.all-toggle:hover {
		color: var(--text1);
	}

	.included-page {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overscroll-behavior: contain;
		background: var(--tile2);
	}

	.included-body {
		flex: 1;
		width: 100%;
		max-width: 72rem;
		margin: 0 auto;
		padding: 2.5rem 2rem 0;
	}

	.included-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.included-title {
		font-size: 1.85rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.15;
		color: var(--text1);
	}

	.included-close {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		font-size: 1rem;
		color: var(--text2);
		cursor: pointer;
	}
	.included-close:hover {
		color: var(--text1);
	}

	.included-bar {
		position: sticky;
		bottom: 0;
		padding: 1rem 2rem 1.25rem;
		border-top: 2px solid var(--tile5);
		background: var(--tile2);
	}
</style>
