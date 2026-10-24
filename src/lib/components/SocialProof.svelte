<script lang="ts">
	import { onMount } from 'svelte';
	import Testimonial from '$lib/components/Testimonial.svelte';
	import { TESTIMONIALS, type TestimonialSegment } from '$lib/constants/testimonials';
	import { SELECTABLE_DIALECTS } from '$lib/constants/dialects';

	interface Props {
		/** How many quotes to show under the numbers, counting `lead`. */
		quotes?: number;
		/** A quote to show first, ahead of the shared ones. */
		lead?: TestimonialSegment[];
		class?: string;
	}

	let { quotes = 2, lead, class: className = '' }: Props = $props();

	const shown = $derived((lead ? [lead, ...TESTIMONIALS] : TESTIMONIALS).slice(0, quotes));

	let proof = $state<{ learners: number; wordsSavedThisMonth: number } | null>(null);

	onMount(() => {
		fetch('/api/social-proof')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => (proof = data))
			.catch(() => {});
	});

	const fmt = (n: number) => n.toLocaleString('en-US');
</script>

<div class={className}>
	<!-- Fixed height so the numbers arriving don't push the page around. -->
	<p class="numbers" aria-live="polite">
		{#if proof && proof.learners > 0}
			<span><strong>{fmt(proof.learners)}+</strong> learners</span>
			{#if proof.wordsSavedThisMonth > 0}
				<span class="dot" aria-hidden="true"></span>
				<span><strong>{fmt(proof.wordsSavedThisMonth)}+</strong> words saved this month</span>
			{/if}
			<span class="dot" aria-hidden="true"></span>
			<span><strong>{SELECTABLE_DIALECTS.length}</strong> dialects</span>
		{/if}
	</p>

	{#if shown.length > 0}
		<div class="quotes">
			{#each shown as segments, i (i)}
				<Testimonial {segments} class="text-left" />
			{/each}
		</div>
	{/if}
</div>

<style>
	.numbers {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.3rem 0.6rem;
		min-height: 1.5rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.numbers strong {
		color: var(--text1);
	}

	.dot {
		width: 0.25rem;
		height: 0.25rem;
		border-radius: 50%;
		background: var(--text2);
	}

	.quotes {
		display: grid;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	@media (min-width: 640px) {
		.quotes {
			grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		}
	}
</style>
