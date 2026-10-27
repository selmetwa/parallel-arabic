<script lang="ts">
	import type { PageData } from './$types';
	import { formatDialectName } from '$lib/utils/seo';
	import { getDialectInfo } from '$lib/constants/dialects';

	let { data }: { data: PageData } = $props();

	const dialectName = $derived(formatDialectName(data.dialect));
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<p class="mb-2 border-l-2 border-brand pl-2 text-[0.65rem] font-bold text-text-200">Grammar</p>
	<h1 class="text-3xl font-bold tracking-tight text-text-300">{dialectName} grammar</h1>

	{#if data.available}
		<p class="mt-2 max-w-2xl text-text-200">
			The rules behind the lessons, explained in plain English. Each topic has examples with transliteration,
			and you can compare how other dialects do the same thing.
		</p>

		{#each data.levels as group (group.level)}
			<section class="mt-8">
				<h2 class="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-text-200">
					{group.level} · {group.label}
				</h2>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each group.topics as topic (topic.slug)}
						<a
							href="/grammar/{data.dialect}/{topic.slug}"
							class="block rounded-xl border border-tile-500 bg-tile-300 p-4 transition-colors duration-150 hover:border-tile-600 hover:bg-tile-400"
						>
							<p class="font-semibold text-text-300">{topic.title}</p>
							<p class="mt-1 text-sm text-text-200">{topic.summary}</p>
						</a>
					{/each}
				</div>
			</section>
		{/each}

		<p class="mt-10 text-sm text-text-200">
			Looking for full verb tables? See the <a class="font-semibold text-text-300 underline" href="/{data.dialect}/conjugations">{dialectName} verb tables</a>.
		</p>
	{:else}
		<div class="mt-6 rounded-xl border border-tile-500 bg-tile-300 p-6">
			<p class="text-lg font-semibold text-text-300">
				{getDialectInfo(data.dialect)?.flag} The {dialectName} grammar guide is coming soon.
			</p>
			<p class="mt-2 text-text-200">
				In the meantime, the <a class="font-semibold text-text-300 underline" href="/{data.dialect}/conjugations">{dialectName} verb tables</a>
				show every tense, and the grammar is close to these guides:
			</p>
			<ul class="mt-3 flex flex-wrap gap-2">
				{#each data.otherDialects as d (d)}
					<li>
						<a
							href="/grammar/{d}"
							class="inline-flex items-center gap-1.5 rounded-full border border-tile-600 bg-tile-400 px-3 py-1 text-sm font-semibold text-text-300 hover:bg-tile-500"
						>
							{getDialectInfo(d)?.flag}
							{formatDialectName(d)}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
