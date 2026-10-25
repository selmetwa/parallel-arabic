<script lang="ts">
	import SocialProof from '$lib/components/SocialProof.svelte';
	import Testimonial from '$lib/components/Testimonial.svelte';
	import {
		EGYPTIAN_TESTIMONIAL,
		TESTIMONIALS,
		type TestimonialSegment
	} from '$lib/constants/testimonials';

	interface Props {
		/** Defaults to every testimonial, led by the Egyptian Arabic one. */
		quotes?: TestimonialSegment[][];
		class?: string;
	}

	let { quotes = [EGYPTIAN_TESTIMONIAL, ...TESTIMONIALS], class: className = '' }: Props =
		$props();
</script>

<aside class={className}>
	<SocialProof quotes={0} />
	<div class="quote-cols">
		{#each quotes as segments, i (i)}
			<Testimonial {segments} class="text-left" />
		{/each}
	</div>
</aside>

<style>
	.quote-cols {
		display: grid;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	@media (min-width: 1024px) {
		/* Two masonry columns, so quotes of different lengths pack without gaps. */
		.quote-cols {
			display: block;
			columns: 2;
			column-gap: 0.75rem;
		}

		.quote-cols :global(figure) {
			break-inside: avoid;
			margin-bottom: 0.75rem;
		}
	}
</style>
