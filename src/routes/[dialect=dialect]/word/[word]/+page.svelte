<script lang="ts">
	import { page } from '$app/state';
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import VocabPractice from '$lib/components/dialect-shared/vocab/VocabPractice.svelte';
	import { formatDialectName } from '$lib/utils/seo';
	import type { PracticeWord, WordEntry, WordIndexEntry } from '$lib/types/words';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		data: {
			word: WordEntry;
			dialect: string;
			related: WordIndexEntry[];
			practiceWords: PracticeWord[];
		};
	}

	let { data }: Props = $props();

	const word = $derived(data.word);
	const dialectName = $derived(formatDialectName(data.dialect));
	const categoryLabel = $derived(word.category ? word.category.replace(/_+/g, ' ') : null);
</script>

<article class="mx-auto max-w-3xl px-4 py-8">
	<nav class="mb-6 text-sm text-text-200">
		<a class="underline hover:text-text-300" href="/{data.dialect}">{dialectName}</a>
		<span class="mx-2">›</span>
		<a class="underline hover:text-text-300" href="/{data.dialect}/word">Words</a>
	</nav>

	<h1 class="mb-6 text-3xl font-bold text-text-300">
		{word.arabic} — "{word.english}" in {dialectName}
	</h1>

	<section class="mb-8 rounded-xl border-2 border-tile-600 bg-tile-400 p-6 text-center sm:p-8">
		<p class="mb-4 text-6xl font-bold leading-snug text-text-300" dir="rtl">{word.arabic}</p>
		<div class="mb-4 flex items-center justify-center gap-3">
			<p class="text-xl italic text-text-200">{word.transliteration || word.franco}</p>
			<InlineAudioButton
				text={word.arabic}
				dialect={data.dialect as Dialect}
				audioUrl={word.audioUrl ?? undefined}
			/>
		</div>
		<p class="text-2xl font-semibold text-text-300">{word.english}</p>

		<dl class="mt-6 grid gap-3 border-t border-tile-600 pt-5 text-left sm:grid-cols-3">
			{#if word.franco}
				<div>
					<dt class="text-xs text-text-200">Franco / chat</dt>
					<dd class="text-lg text-text-300">{word.franco}</dd>
				</div>
			{/if}
			{#if categoryLabel}
				<div>
					<dt class="text-xs text-text-200">Topic</dt>
					<dd class="text-lg capitalize text-text-300">{categoryLabel}</dd>
				</div>
			{/if}
			<div>
				<dt class="text-xs text-text-200">Seen in</dt>
				<dd class="text-lg text-text-300">
					{word.examples.length} of our stories
				</dd>
			</div>
		</dl>
	</section>

	{#if word.conjugationSlug}
		<a
			href="/{data.dialect}/conjugations/{word.conjugationSlug}"
			class="mb-8 flex items-center justify-between rounded-xl border border-tile-500 bg-tile-300 p-5 transition-all hover:border-tile-600 hover:bg-tile-400"
		>
			<div>
				<h2 class="text-lg font-bold text-text-300">Conjugate {word.arabic}</h2>
				<p class="text-sm text-text-200">
					Past, present, future and imperative, affirmative and negative.
				</p>
			</div>
			<span aria-hidden="true" class="text-text-300">→</span>
		</a>
	{/if}

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-bold text-text-300">
			{word.arabic} in a sentence
		</h2>
		<p class="mb-4 text-text-200">
			Every sentence below is taken from a story on Parallel Arabic, so you can see how the word
			behaves in real context rather than in isolation.
		</p>
		<div class="space-y-3">
			{#each word.examples as example (example.arabic)}
				<div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
					<div class="mb-1 flex flex-wrap items-center gap-3">
						<p class="text-xl text-text-300" dir="rtl">{example.arabic}</p>
						<InlineAudioButton text={example.arabic} dialect={data.dialect as Dialect} />
					</div>
					{#if example.transliteration}
						<p class="text-sm italic text-text-200">{example.transliteration}</p>
					{/if}
					<p class="text-text-300">{example.english}</p>
					{#if example.storyTitle}
						<p class="mt-2 text-xs text-text-200">
							from
							<a class="underline hover:text-text-300" href="/generated_story/{example.storyId}">
								{example.storyTitle}
							</a>
						</p>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	{#if data.related.length}
		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-bold text-text-300">
				More {categoryLabel} vocabulary
			</h2>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each data.related as other (other.slug)}
					<a
						href="/{data.dialect}/word/{other.slug}"
						class="block rounded-lg border border-tile-500 bg-tile-300 p-3 text-center transition-all hover:border-tile-600 hover:bg-tile-400"
					>
						<p class="text-xl font-bold text-text-300" dir="rtl">{other.arabic}</p>
						<p class="text-sm text-text-200">{other.english}</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<VocabPractice
		words={data.practiceWords}
		dialect={data.dialect as Dialect}
		topicLabel={categoryLabel ?? dialectName}
		isSubscribed={page.data.isSubscribed ?? false}
		practiceHref="/vocabulary?dialect={data.dialect}&search={encodeURIComponent(word.arabic)}"
	/>

	<aside class="mt-8 text-center">
		<a href="/{data.dialect}/word" class="text-text-200 underline hover:text-text-300">
			All {dialectName} words
		</a>
	</aside>
</article>
