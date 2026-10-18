<script lang="ts">
	import { fade } from 'svelte/transition';
	import NarratedSteps from '$lib/components/NarratedSteps.svelte';

	interface Props {
		/** What's being put together, in order. */
		lines: string[];
		onDone: () => void;
	}

	let { lines, onDone }: Props = $props();
</script>

<!-- A short, narrated pause before the plan, so it reads as put together for them. -->
<div class="mx-auto max-w-md text-center" in:fade={{ duration: 250 }}>
	<p class="font-arabic text-text-300/80 mb-2 text-2xl font-bold" dir="rtl" lang="ar">لحظة</p>
	<h2 class="title">Building your plan</h2>
	<div class="mt-6">
		<NarratedSteps {lines} {onDone} />
	</div>
</div>

<style>
	.title {
		font-size: 1.6rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
	}
</style>
