<script lang="ts">
	import { TUTOR_FAQS } from '$lib/constants/tutor-faqs';

	const steps = [
		{
			title: 'Pick a dialect and a situation',
			body: 'Egyptian, Levantine, Iraqi, Gulf, Saudi or Modern Standard Arabic. Start from a scenario like ordering coffee, or describe your own.'
		},
		{
			title: 'Learn the key sentences first',
			body: 'The tutor teaches the words and sentences the conversation needs, and you say each one back.'
		},
		{
			title: 'Hold the conversation out loud',
			body: 'Speak into your microphone. The tutor replies in spoken Arabic, with a translation and a correction after every turn.'
		}
	];
</script>

<!-- Indexable copy for visitors who have not subscribed; the app above is all controls. -->
<section class="border-t border-tile-600 bg-tile-200 py-12 sm:py-16">
	<div class="mx-auto max-w-4xl px-3 sm:px-8">
		<h2 class="mb-3 text-left text-2xl font-bold text-text-300 sm:text-3xl">
			How the AI Arabic tutor works
		</h2>
		<p class="mb-8 text-lg leading-relaxed text-text-200">
			Speak Arabic with a tutor that listens, answers out loud and corrects you as you go, at any
			hour and with no lesson to book.
		</p>
		<ol class="mb-12 grid gap-4 sm:grid-cols-3">
			{#each steps as step, i (step.title)}
				<li class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
					<p class="mb-2 text-sm font-bold text-text-200">Step {i + 1}</p>
					<h3 class="mb-2 text-lg font-bold text-text-300">{step.title}</h3>
					<p class="leading-relaxed text-text-200">{step.body}</p>
				</li>
			{/each}
		</ol>

		<h2 class="mb-8 text-left text-2xl font-bold text-text-300 sm:text-3xl">Common questions</h2>
		<div class="space-y-4">
			{#each TUTOR_FAQS as faq (faq.question)}
				<div class="rounded-lg border-2 border-tile-600 bg-tile-400 p-6 shadow-lg">
					<h3 class="mb-2 text-lg font-bold text-text-300">{faq.question}</h3>
					<p class="leading-relaxed text-text-200">{faq.answer}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
