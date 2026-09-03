<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import VocabPractice from '$lib/components/dialect-shared/vocab/VocabPractice.svelte';
	import type { VocabTopic, VocabTopicSummary } from '$lib/types/vocab';
	import type { PracticeWord } from '$lib/types/words';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		data: {
			dialect: string;
			topic: VocabTopic;
			wordPageSlugs: string[];
			related: VocabTopicSummary[];
		};
	}

	let { data }: Props = $props();

	const topic = $derived(data.topic);
	const hasWordPage = $derived(new Set(data.wordPageSlugs));

	const practiceWords = $derived<PracticeWord[]>(
		topic.words.map((word) => ({
			arabic: word.arabicPlain,
			english: word.english,
			transliteration: word.transliteration
		}))
	);

	/** The clearest sentence we have for each of the first few words. */
	const showcase = $derived(topic.words.filter((word) => word.examples.length).slice(0, 5));
</script>

<article class="mx-auto max-w-4xl px-4 py-8">
	<nav class="mb-6 text-sm text-text-200">
		<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic')}>Egyptian Arabic</a>
		<span class="mx-2">›</span>
		<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic/vocabulary')}>
			Vocabulary
		</a>
	</nav>

	<h1 class="mb-4 text-3xl font-bold text-text-300 sm:text-4xl">
		{topic.heading}
	</h1>

	<p class="mb-8 text-lg text-text-200">
		{topic.words.length} Egyptian Arabic words for {topic.label.toLowerCase()}, ordered by how often
		they actually come up. Each one shows the Arabic with diacritics, how to say it, and the franco
		spelling used in text messages.
	</p>

	<section class="mb-10 overflow-x-auto">
		<table class="w-full min-w-[36rem] border-collapse text-left">
			<thead>
				<tr class="border-b-2 border-tile-600 text-sm uppercase tracking-wide text-text-200">
					<th scope="col" class="py-3 pr-4">Arabic</th>
					<th scope="col" class="py-3 pr-4">Pronunciation</th>
					<th scope="col" class="py-3 pr-4">Franco</th>
					<th scope="col" class="py-3">English</th>
				</tr>
			</thead>
			<tbody>
				{#each topic.words as word (word.slug)}
					<tr class="border-b border-tile-500">
						<td class="py-3 pr-4">
							<div class="flex items-center gap-2">
								<span class="text-2xl text-text-300" dir="rtl">{word.arabic}</span>
								<InlineAudioButton text={word.arabicPlain} dialect={data.dialect as Dialect} />
							</div>
						</td>
						<td class="py-3 pr-4 italic text-text-200">{word.transliteration}</td>
						<td class="py-3 pr-4 text-text-200">{word.franco}</td>
						<td class="py-3 text-text-300">
							{#if hasWordPage.has(word.slug)}
								<a
									class="underline hover:text-text-200"
									href={resolve('/[dialect=dialect]/word/[word]', {
										dialect: data.dialect,
										word: word.slug
									})}
								>
									{word.english}
								</a>
							{:else}
								{word.english}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	{#if showcase.length}
		<section class="mb-10">
			<h2 class="mb-4 text-2xl font-bold text-text-300">
				{topic.label} in a sentence
			</h2>
			<p class="mb-4 text-text-200">
				Every sentence below is taken from a story on this site, so you see the word behaving
				normally rather than sitting on a flashcard.
			</p>
			<div class="space-y-3">
				{#each showcase as word (word.slug)}
					{@const example = word.examples[0]}
					<div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
						<div class="mb-1 flex flex-wrap items-center gap-3">
							<p class="text-xl text-text-300" dir="rtl">{example.arabic}</p>
							<InlineAudioButton text={example.arabic} dialect={data.dialect as Dialect} />
						</div>
						{#if example.transliteration}
							<p class="text-sm italic text-text-200">{example.transliteration}</p>
						{/if}
						<p class="text-text-300">{example.english}</p>
						<p class="mt-2 text-xs text-text-200">
							showing <span dir="rtl" class="font-semibold">{word.arabic}</span> — {word.english}
						</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<VocabPractice
		words={practiceWords}
		dialect={data.dialect as Dialect}
		topicLabel={topic.label}
		isSubscribed={page.data.isSubscribed ?? false}
		practiceHref="/learn/game?dialect={data.dialect}"
	/>

	{#if data.related.length}
		<section class="mt-10">
			<h2 class="mb-4 text-2xl font-bold text-text-300">More Egyptian Arabic vocabulary</h2>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each data.related as other (other.slug)}
					<a
						href={resolve('/egyptian-arabic/vocabulary/[topic]', { topic: other.slug })}
						class="block rounded-lg border border-tile-500 bg-tile-300 p-3 transition-all hover:border-tile-600 hover:bg-tile-400"
					>
						<p class="font-semibold text-text-300">{other.label}</p>
						<p class="text-sm text-text-200">{other.count} words</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</article>
