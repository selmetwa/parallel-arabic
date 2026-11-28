<script lang="ts">
	import { resolve } from '$app/paths';
	import TestimonialWall from '$lib/components/TestimonialWall.svelte';
	import {
		BEGINNER_TESTIMONIAL,
		EGYPTIAN_TESTIMONIAL,
		TESTIMONIALS
	} from '$lib/constants/testimonials';

	const quotes = [EGYPTIAN_TESTIMONIAL, ...TESTIMONIALS, BEGINNER_TESTIMONIAL];
</script>

<div class="min-h-screen bg-tile-200 py-8 px-4 sm:px-8">
	<div class="max-w-4xl mx-auto">
		<header class="text-left mb-8">
			<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">
				What learners say
			</h1>
			<p class="text-text-200 text-lg sm:text-xl leading-snug">
				Messages from people learning Arabic with Parallel Arabic, quoted as they wrote them.
			</p>
		</header>

		<TestimonialWall {quotes} />

		<div class="mt-10 text-center">
			<a
				href={resolve('/signup')}
				class="inline-block rounded-lg border border-tile-600 bg-tile-500 px-6 py-3 font-semibold text-text-300 transition-colors hover:bg-tile-600"
			>
				Start learning for free
			</a>
		</div>
	</div>
</div>
