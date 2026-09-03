<script lang="ts">
	import { resolve } from '$app/paths';
	import type { VocabTopicSummary } from '$lib/types/vocab';

	interface Props {
		data: { dialect: string; topics: VocabTopicSummary[] };
	}

	let { data }: Props = $props();

	const totalWords = $derived(
		data.topics.find((t) => t.slug === 'most-common')?.count ??
			data.topics.reduce((sum, t) => sum + t.count, 0)
	);
</script>

<article class="mx-auto max-w-4xl px-4 py-8">
	<nav class="mb-6 text-sm text-text-200">
		<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic')}>Egyptian Arabic</a>
	</nav>

	<h1 class="mb-4 text-3xl font-bold text-text-300 sm:text-4xl">Egyptian Arabic Vocabulary</h1>

	<p class="mb-4 text-lg text-text-200">
		{totalWords} of the most frequently used words in Egyptian Arabic, grouped by topic. Every word has
		its Arabic spelling with diacritics, a transliteration, the franco spelling Egyptians type in messages,
		and real sentences taken from stories on this site rather than invented examples.
	</p>
	<p class="mb-8 text-text-200">
		Each topic ends with a short practice round — half multiple choice, half speaking out loud. It's
		free and needs no account.
	</p>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#each data.topics as topic (topic.slug)}
			<a
				href={resolve('/egyptian-arabic/vocabulary/[topic]', { topic: topic.slug })}
				class="block rounded-xl border border-tile-500 bg-tile-300 p-5 transition-all hover:border-tile-600 hover:bg-tile-400"
			>
				<div class="mb-3 flex items-baseline justify-between gap-3">
					<h2 class="text-xl font-bold text-text-300">{topic.label}</h2>
					<span class="shrink-0 text-sm text-text-200">{topic.count} words</span>
				</div>
				<p class="text-text-200" dir="rtl">
					{#each topic.preview as word, i (word.arabic)}<span class="text-lg text-text-300"
							>{word.arabic}</span
						>{#if i < topic.preview.length - 1}<span class="mx-2">·</span>{/if}{/each}
				</p>
			</a>
		{/each}
	</div>

	<aside class="mt-10 rounded-xl border border-tile-500 bg-tile-300 p-6">
		<h2 class="mb-3 text-xl font-bold text-text-300">Keep going</h2>
		<ul class="space-y-2 text-text-200">
			<li>
				<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic/word')}>
					Individual word pages
				</a> — one page per word, with every sentence we have for it.
			</li>
			<li>
				<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic/phrases')}>
					The phrasebook
				</a> — whole phrases rather than single words.
			</li>
			<li>
				<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic/conjugations')}>
					Verb conjugations
				</a> — full tables for 72 common verbs.
			</li>
			<li>
				<a class="underline hover:text-text-300" href={resolve('/egyptian-arabic/pronunciation')}>
					Pronunciation
				</a> — the sounds that make Egyptian Arabic sound Egyptian.
			</li>
		</ul>
	</aside>
</article>
