<script lang="ts">
	import { formatDialectName } from '$lib/utils/seo';
	import type { WordIndexEntry } from '$lib/types/words';

	let { data }: { data: { dialect: string; words: WordIndexEntry[] } } = $props();

	const dialectName = $derived(formatDialectName(data.dialect));
	let searchQuery = $state('');

	const filtered = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return data.words;
		return data.words.filter(
			(w) => w.english.toLowerCase().includes(query) || w.arabic.includes(query)
		);
	});
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
	<h1 class="mb-2 text-3xl font-bold text-text-300">{dialectName} Words</h1>
	<p class="mb-6 text-text-200">
		{data.words.length} common {dialectName} words, each with audio and real example sentences taken
		from our stories.
	</p>

	<input
		type="text"
		placeholder="Search words..."
		bind:value={searchQuery}
		class="mb-6 w-full rounded-lg border border-tile-500 bg-tile-300 px-4 py-2 text-text-300 placeholder:text-text-200 focus:border-tile-600 focus:outline-none"
	/>

	{#if filtered.length === 0}
		<p class="py-8 text-center text-text-200">No words match your search.</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each filtered as word (word.slug)}
				<a
					href="/{data.dialect}/word/{word.slug}"
					class="block rounded-xl border border-tile-500 bg-tile-300 p-4 text-center transition-all hover:border-tile-600 hover:bg-tile-400"
				>
					<p class="mb-1 text-2xl font-bold text-text-300" dir="rtl">{word.arabic}</p>
					<p class="text-sm text-text-200">{word.english}</p>
				</a>
			{/each}
		</div>
	{/if}

	<nav class="mt-10 border-t border-tile-600 pt-6 text-sm text-text-200">
		<a class="underline hover:text-text-300" href="/{data.dialect}">Learn {dialectName}</a>
		<span class="mx-2">·</span>
		<a class="underline hover:text-text-300" href="/{data.dialect}/phrases">Phrases</a>
		<span class="mx-2">·</span>
		<a class="underline hover:text-text-300" href="/vocabulary?dialect={data.dialect}">
			Vocabulary explorer
		</a>
	</nav>
</div>
