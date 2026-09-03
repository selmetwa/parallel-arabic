<script lang="ts">
	import { page } from '$app/state';
	import VocabPractice from '$lib/components/dialect-shared/vocab/VocabPractice.svelte';
	import { formatDialectName } from '$lib/utils/seo';
	import type { ComparisonPair } from '$lib/constants/dialect-comparisons';
	import type { PracticeWord } from '$lib/types/words';
	import type { Dialect } from '$lib/types/index';

	interface PhraseRow {
		slug: string;
		english: string;
		a: { arabic: string; transliteration: string };
		b: { arabic: string; transliteration: string };
	}

	interface Props {
		data: {
			pair: ComparisonPair;
			rows: { label: string; a: string; b: string }[];
			phrases: PhraseRow[];
		};
	}

	let { data }: Props = $props();

	const nameA = $derived(formatDialectName(data.pair.a));
	const nameB = $derived(formatDialectName(data.pair.b));

	// Drill the first dialect of the pair. Mixing both into one round would ask
	// the learner to produce two answers for the same English prompt.
	const practiceWords = $derived<PracticeWord[]>(
		data.phrases.map((row) => ({
			arabic: row.a.arabic,
			english: row.english,
			transliteration: row.a.transliteration
		}))
	);
</script>

<article class="mx-auto max-w-4xl px-4 py-8">
	<h1 class="mb-4 text-3xl font-bold text-text-300 sm:text-4xl">
		{nameA} vs {nameB}
	</h1>
	<p class="mb-8 text-lg leading-relaxed text-text-200">
		{data.pair.intelligibility}
	</p>

	<section class="mb-10">
		<h2 class="mb-4 text-2xl font-bold text-text-300">The differences, side by side</h2>
		<div class="overflow-x-auto rounded-xl border border-tile-500">
			<table class="w-full min-w-[36rem] border-collapse text-left">
				<thead>
					<tr class="bg-tile-400">
						<th class="border-b border-tile-500 px-4 py-3 text-sm font-bold text-text-300"></th>
						<th class="border-b border-tile-500 px-4 py-3 text-sm font-bold text-text-300">
							{nameA}
						</th>
						<th class="border-b border-tile-500 px-4 py-3 text-sm font-bold text-text-300">
							{nameB}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row, i (row.label)}
						<tr class={i % 2 ? 'bg-tile-300' : 'bg-tile-200'}>
							<th
								class="border-b border-tile-500 px-4 py-3 align-top text-sm font-semibold text-text-300"
							>
								{row.label}
							</th>
							<td class="border-b border-tile-500 px-4 py-3 align-top text-text-200">{row.a}</td>
							<td class="border-b border-tile-500 px-4 py-3 align-top text-text-200">{row.b}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	{#if data.phrases.length}
		<section class="mb-10">
			<h2 class="mb-4 text-2xl font-bold text-text-300">The same phrases in both</h2>
			<div class="overflow-x-auto rounded-xl border border-tile-500">
				<table class="w-full min-w-[36rem] border-collapse text-left">
					<thead>
						<tr class="bg-tile-400">
							<th class="border-b border-tile-500 px-4 py-3 text-sm font-bold text-text-300">
								English
							</th>
							<th class="border-b border-tile-500 px-4 py-3 text-sm font-bold text-text-300">
								{nameA}
							</th>
							<th class="border-b border-tile-500 px-4 py-3 text-sm font-bold text-text-300">
								{nameB}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each data.phrases as row, i (row.slug)}
							<tr class={i % 2 ? 'bg-tile-300' : 'bg-tile-200'}>
								<td class="border-b border-tile-500 px-4 py-3 align-top">
									<a
										class="text-text-300 underline hover:text-text-200"
										href="/{data.pair.a}/phrases/{row.slug}"
									>
										{row.english}
									</a>
								</td>
								<td class="border-b border-tile-500 px-4 py-3 align-top">
									<span class="block text-xl text-text-300" dir="rtl">{row.a.arabic}</span>
									<span class="text-sm italic text-text-200">{row.a.transliteration}</span>
								</td>
								<td class="border-b border-tile-500 px-4 py-3 align-top">
									<span class="block text-xl text-text-300" dir="rtl">{row.b.arabic}</span>
									<span class="text-sm italic text-text-200">{row.b.transliteration}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<section class="mb-10">
		<h2 class="mb-3 text-2xl font-bold text-text-300">Which one should you learn?</h2>
		<p class="text-lg leading-relaxed text-text-200">{data.pair.whichToLearn}</p>
	</section>

	{#if practiceWords.length}
		<div class="mb-8">
			<VocabPractice
				words={practiceWords}
				dialect={data.pair.a as Dialect}
				topicLabel="{nameA} phrases"
				isSubscribed={page.data.isSubscribed ?? false}
				practiceHref="/{data.pair.a}/phrases"
			/>
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<a
			href="/{data.pair.a}"
			class="rounded-xl border border-tile-500 bg-tile-300 p-5 transition-all hover:border-tile-600 hover:bg-tile-400"
		>
			<h2 class="mb-1 text-lg font-bold text-text-300">Learn {nameA}</h2>
			<p class="text-sm text-text-200">Lessons, stories, phrases and vocabulary.</p>
		</a>
		<a
			href="/{data.pair.b}"
			class="rounded-xl border border-tile-500 bg-tile-300 p-5 transition-all hover:border-tile-600 hover:bg-tile-400"
		>
			<h2 class="mb-1 text-lg font-bold text-text-300">Learn {nameB}</h2>
			<p class="text-sm text-text-200">Lessons, stories, phrases and vocabulary.</p>
		</a>
	</div>
</article>
