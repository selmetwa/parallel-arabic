<script lang="ts">
	import type { PageData } from './$types';
	import { formatDialectName } from '$lib/utils/seo';
	import { getDialectInfo } from '$lib/constants/dialects';
	import GrammarArticle from '$lib/components/grammar/GrammarArticle.svelte';

	let { data }: { data: PageData } = $props();

	const dialectName = $derived(formatDialectName(data.dialect));

	// Which other dialect is shown alongside, if any. Tied to the article, so
	// following a related link starts without a comparison.
	let comparing = $state<{ slug: string; dialect: string } | null>(null);
	const compareWith = $derived(comparing?.slug === data.topic.slug ? comparing.dialect : null);
	const compared = $derived(data.compare.find((c) => c.dialect === compareWith));

	function toggleCompare(dialect: string) {
		comparing = compareWith === dialect ? null : { slug: data.topic.slug, dialect };
	}
</script>

<div class="mx-auto px-4 py-8 {compared ? 'max-w-6xl' : 'max-w-3xl'}">
	<a
		href="/grammar/{data.dialect}"
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-200 transition-colors hover:text-text-300"
	>
		← All {dialectName} grammar
	</a>

	<p class="mb-2 border-l-2 border-brand pl-2 text-[0.65rem] font-bold text-text-200">
		{data.topic.level} · {dialectName} grammar
	</p>
	<h1 class="text-3xl font-bold tracking-tight text-text-300">{data.heading}</h1>

	{#if data.compare.length}
		<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
			<span class="text-xs font-bold text-text-200">Compare with</span>
			{#each data.compare as c (c.dialect)}
				<button
					type="button"
					onclick={() => toggleCompare(c.dialect)}
					aria-pressed={compareWith === c.dialect}
					class="rounded-full border px-3 py-1 transition-colors duration-150 {compareWith === c.dialect
						? 'border-tile-400 bg-tile-500 font-semibold text-text-300'
						: 'border-tile-600 bg-tile-300 text-text-200 hover:text-text-300'}"
				>
					{getDialectInfo(c.dialect)?.flag}
					{getDialectInfo(c.dialect)?.shortName}
				</button>
			{/each}
		</div>
	{/if}

	<div class="mt-6 grid gap-8 {compared ? 'lg:grid-cols-2' : ''}">
		<div class="min-w-0">
			{#if compared}
				<p class="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-text-200">
					{getDialectInfo(data.dialect)?.flag} {dialectName}
				</p>
			{/if}
			<GrammarArticle html={data.html} />
		</div>

		{#if compared}
			<div class="min-w-0 rounded-xl border border-tile-500 bg-tile-300 p-4">
				<p class="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-text-200">
					{getDialectInfo(compared.dialect)?.flag} {formatDialectName(compared.dialect)}
				</p>
				<GrammarArticle html={compared.html} />
			</div>
		{/if}
	</div>

	<div class="mt-10 flex flex-wrap gap-3">
		{#if data.topic.practiceTopic}
			<a
				href="/lessons/custom?focus={encodeURIComponent(data.topic.practiceTopic)}&dialect={data.dialect}"
				class="rounded-xl border-2 border-tile-600 bg-tile-500 px-4 py-2 font-semibold text-text-300 transition-colors hover:bg-tile-600"
			>
				Practise this in a custom lesson
			</a>
		{/if}
		{#if data.topic.slug === 'verb-forms' || data.topic.slug === 'verb-classes' || data.topic.slug.endsWith('-tense')}
			<a
				href="/{data.dialect}/conjugations"
				class="rounded-xl border-2 border-tile-600 bg-tile-300 px-4 py-2 font-semibold text-text-300 transition-colors hover:bg-tile-400"
			>
				Browse the verb tables
			</a>
		{/if}
	</div>

	{#if data.related.length}
		<section class="mt-10">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-text-200">Related</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.related as topic (topic.slug)}
					<a
						href="/grammar/{data.dialect}/{topic.slug}"
						class="block rounded-xl border border-tile-500 bg-tile-300 p-4 transition-colors hover:border-tile-600 hover:bg-tile-400"
					>
						<p class="font-semibold text-text-300">{topic.title}</p>
						<p class="mt-1 text-sm text-text-200">{topic.summary}</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
