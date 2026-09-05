<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import VocabPractice from '$lib/components/dialect-shared/vocab/VocabPractice.svelte';
	import {
		PRONUNCIATION_FAQS,
		PRONUNCIATION_INTRO,
		SOUND_SECTIONS
	} from '$lib/constants/egyptian-pronunciation';
	import type { PracticeWord } from '$lib/types/words';

	const DIALECT = 'egyptian-arabic';

	// Every example across every sound, so the round drills the contrasts the
	// page just explained rather than unrelated vocabulary.
	const practiceWords: PracticeWord[] = SOUND_SECTIONS.flatMap((section) =>
		section.examples.map(
			(example): PracticeWord => ({
				arabic: example.arabic,
				english: example.english,
				transliteration: example.transliteration
			})
		)
	);
</script>

<article class="mx-auto max-w-3xl px-4 py-8">
	<nav class="mb-6 text-sm text-text-200">
		<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic')}>Egyptian Arabic</a>
	</nav>

	<h1 class="mb-4 text-3xl font-bold text-text-300 sm:text-4xl">Egyptian Arabic Pronunciation</h1>

	<p class="mb-8 text-lg text-text-200">{PRONUNCIATION_INTRO}</p>

	<nav class="mb-10 rounded-xl border border-tile-500 bg-tile-300 p-5">
		<h2 class="mb-3 text-sm text-text-200">On this page</h2>
		<ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">
			{#each SOUND_SECTIONS as section (section.id)}
				<li>
					<a class="text-text-300 underline hover:text-text-200" href="#{section.id}">
						<span dir="rtl" class="font-semibold">{section.letter}</span>
						— {section.heading}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#each SOUND_SECTIONS as section (section.id)}
		<section id={section.id} class="mb-10 scroll-mt-20">
			<h2 class="mb-3 text-2xl font-bold text-text-300">
				<span dir="rtl">{section.letter}</span> — {section.heading}
			</h2>
			<p class="mb-5 text-text-200">{section.body}</p>

			<div class="overflow-x-auto">
				<table class="w-full min-w-[30rem] border-collapse text-left">
					<thead>
						<tr class="border-b-2 border-tile-600 text-sm text-text-200">
							<th scope="col" class="py-2 pr-4">Arabic</th>
							<th scope="col" class="py-2 pr-4">Egyptian</th>
							<th scope="col" class="py-2 pr-4">Standard Arabic</th>
							<th scope="col" class="py-2">English</th>
						</tr>
					</thead>
					<tbody>
						{#each section.examples as example (example.arabic)}
							<tr class="border-b border-tile-500">
								<td class="py-2 pr-4">
									<div class="flex items-center gap-2">
										<span class="text-xl text-text-300" dir="rtl">{example.arabic}</span>
										<InlineAudioButton text={example.arabic} dialect={DIALECT} />
									</div>
								</td>
								<td class="py-2 pr-4 font-semibold text-text-300">{example.transliteration}</td>
								<td class="py-2 pr-4 italic text-text-200">{example.fusha ?? '—'}</td>
								<td class="py-2 text-text-200">{example.english}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/each}

	<VocabPractice
		words={practiceWords}
		dialect={DIALECT}
		topicLabel="these sounds"
		isSubscribed={page.data.isSubscribed ?? false}
		practiceHref="/speak"
	/>

	<section class="mt-10">
		<h2 class="mb-4 text-2xl font-bold text-text-300">Common questions</h2>
		<div class="space-y-5">
			{#each PRONUNCIATION_FAQS as faq (faq.question)}
				<div>
					<h3 class="mb-1 font-bold text-text-300">{faq.question}</h3>
					<p class="text-text-200">{faq.answer}</p>
				</div>
			{/each}
		</div>
	</section>

	<aside class="mt-10 rounded-xl border border-tile-500 bg-tile-300 p-6">
		<h2 class="mb-3 text-xl font-bold text-text-300">Next</h2>
		<ul class="space-y-2 text-text-200">
			<li>
				<a class="underline hover:text-text-300" href={resolve('/alphabet')}>
					The Arabic alphabet
				</a> — all 28 letters and how they join up.
			</li>
			<li>
				<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic/vocabulary')}>
					Egyptian Arabic vocabulary
				</a> — the words to practise these sounds on.
			</li>
			<li>
				<a class="underline hover:text-text-300" href={resolve('/keyboard')}>
					The Arabic keyboard
				</a> — typing Arabic, including the diacritics.
			</li>
		</ul>
	</aside>
</article>
