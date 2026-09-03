<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		BEGINNERS_FAQS,
		BEGINNERS_INTRO,
		LEARNING_STEPS
	} from '$lib/constants/egyptian-beginners';
</script>

<article class="mx-auto max-w-3xl px-4 py-8">
	<nav class="mb-6 text-sm text-text-200">
		<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic')}>Egyptian Arabic</a>
	</nav>

	<h1 class="mb-4 text-3xl font-bold text-text-300 sm:text-4xl">Egyptian Arabic for Beginners</h1>

	<p class="mb-10 text-lg text-text-200">{BEGINNERS_INTRO}</p>

	<ol class="mb-10 space-y-6">
		{#each LEARNING_STEPS as step, i (step.href)}
			<li class="rounded-xl border border-tile-500 bg-tile-300 p-6">
				<div class="mb-2 flex flex-wrap items-baseline gap-3">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tile-500 font-bold text-text-300"
					>
						{i + 1}
					</span>
					<h2 class="text-xl font-bold text-text-300">{step.title}</h2>
					<span class="text-sm text-text-200">{step.weeks}</span>
				</div>
				<p class="mb-4 text-text-200">{step.body}</p>
				<a
					href={step.href}
					class="inline-block font-semibold text-text-300 underline hover:text-text-200"
				>
					{step.linkLabel} →
				</a>
			</li>
		{/each}
	</ol>

	<section class="mb-10 rounded-xl border-2 border-tile-600 bg-tile-400 p-6 sm:p-8">
		<h2 class="mb-3 text-2xl font-bold text-text-300">Start with step one</h2>
		<p class="mb-5 text-text-200">
			The alphabet is two weeks of work and everything else depends on it. The interactive version
			drills the letter shapes and the sounds together, which is faster than a chart.
		</p>
		<div class="flex flex-wrap gap-3">
			<a
				href={resolve('/alphabet')}
				class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Learn the alphabet
			</a>
			<a
				href={resolve('/egyptian-arabic/vocabulary')}
				class="rounded-lg border border-tile-600 bg-tile-500 px-6 py-3 font-semibold text-text-300 transition-colors hover:bg-tile-600"
			>
				Or jump to the vocabulary
			</a>
		</div>
	</section>

	<section>
		<h2 class="mb-4 text-2xl font-bold text-text-300">Common questions</h2>
		<div class="space-y-5">
			{#each BEGINNERS_FAQS as faq (faq.question)}
				<div>
					<h3 class="mb-1 font-bold text-text-300">{faq.question}</h3>
					<p class="text-text-200">{faq.answer}</p>
				</div>
			{/each}
		</div>
	</section>
</article>
