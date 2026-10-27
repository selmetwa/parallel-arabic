<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import { formatDialectName } from '$lib/utils/seo';

	let { data }: { data: PageData } = $props();

	const dialectName = $derived(formatDialectName(data.dialect));

	let query = $state(untrack(() => data.q));
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Results load through the URL so a search can be shared or bookmarked.
	function search(value: string) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			const q = value.trim();
			goto(q ? `?q=${encodeURIComponent(q)}` : '?', {
				keepFocus: true,
				noScroll: true,
				replaceState: true
			});
		}, 300);
	}

	function pickCategory(category: string) {
		query = '';
		goto(category ? `?category=${encodeURIComponent(category)}` : '?', { noScroll: true });
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
	<p class="mb-2 border-l-2 border-brand pl-2 text-[0.65rem] font-bold text-text-200">Dictionary</p>
	<h1 class="text-3xl font-bold tracking-tight text-text-300">{dialectName} dictionary</h1>
	<p class="mt-2 text-text-200">Search in English, Arabic or transliteration.</p>

	<label class="mt-6 block">
		<span class="sr-only">Search the dictionary</span>
		<input
			type="search"
			bind:value={query}
			oninput={(e) => search(e.currentTarget.value)}
			placeholder="e.g. apple, تفاح, tuffaa7"
			autocomplete="off"
			class="w-full rounded-xl border-2 border-tile-600 bg-tile-300 px-4 py-3 text-lg text-text-300 placeholder:text-text-200 focus:border-tile-400 focus:outline-none"
		/>
	</label>

	{#if data.q || data.category}
		<p class="mt-4 text-sm text-text-200">
			{data.results.length}
			{data.results.length === 1 ? 'word' : 'words'}
			{#if data.category && !data.q}
				in {data.categories.find((c) => c.value === data.category)?.label ?? data.category}
				· <button type="button" class="underline hover:text-text-300" onclick={() => pickCategory('')}>all topics</button>
			{/if}
		</p>

		{#if data.results.length}
			<ul class="mt-3 divide-y divide-tile-500 overflow-hidden rounded-xl border border-tile-500 bg-tile-300">
				{#each data.results as word (word.id)}
					<li>
						<a
							href="/dictionary/{data.dialect}/{word.id}"
							class="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-tile-400"
						>
							<div class="min-w-0 flex-1">
								<p class="font-semibold text-text-300">{word.english}</p>
								<p class="text-sm italic text-text-200">{word.transliteration}</p>
							</div>
							<p class="text-2xl font-semibold text-text-300" dir="rtl" lang="ar">{word.arabic}</p>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="mt-3 rounded-xl border border-tile-500 bg-tile-300 p-5 text-text-200">
				<p>No words found for "{data.q}".</p>
				<p class="mt-2 text-sm">
					Try a shorter word, or ask the <a class="font-semibold text-text-300 underline" href="/tutor">tutor</a>
					how to say it in {dialectName}.
				</p>
			</div>
		{/if}
	{/if}

	{#if !data.q && data.categories.length}
		<section class="mt-8">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-text-200">Browse by topic</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.categories as c (c.value)}
					<button
						type="button"
						onclick={() => pickCategory(c.value)}
						aria-pressed={data.category === c.value}
						class="rounded-full border px-3 py-1 text-sm transition-colors {data.category === c.value
							? 'border-tile-400 bg-tile-500 font-semibold text-text-300'
							: 'border-tile-600 bg-tile-300 text-text-200 hover:text-text-300'}"
					>
						{c.label}
					</button>
				{/each}
			</div>
		</section>
	{/if}
</div>
