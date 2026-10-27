<script lang="ts">
	import type { PageData } from './$types';
	import type { Dialect } from '$lib/types/index';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
	import { formatDialectName } from '$lib/utils/seo';
	import { categoryLabel, type DictionaryDetails } from '$lib/data/dictionary';

	let { data }: { data: PageData } = $props();

	const dialectName = $derived(formatDialectName(data.dialect));

	// Details are generated the first time anyone opens a word, so they load
	// after the page rather than holding it up.
	let details = $state<DictionaryDetails | null>(null);
	let failed = $state(false);

	$effect(() => {
		const url = `/api/dictionary/${data.dialect}/${data.word.id}`;
		let cancelled = false;
		details = null;
		failed = false;
		fetch(url)
			.then((res) => (res.ok ? res.json() : Promise.reject()))
			.then((d: DictionaryDetails) => {
				if (!cancelled) details = d;
			})
			.catch(() => {
				if (!cancelled) failed = true;
			});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a
		href="/dictionary/{data.dialect}"
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-200 transition-colors hover:text-text-300"
	>
		← {dialectName} dictionary
	</a>

	<section class="rounded-2xl border border-tile-500 bg-tile-300 p-6 text-center">
		<p class="text-5xl font-bold text-text-300" dir="rtl" lang="ar">{data.word.arabic}</p>
		<p class="mt-2 text-lg italic text-text-200">{data.word.transliteration}</p>
		<p class="mt-1 text-xl font-semibold text-text-300">{data.word.english}</p>
		{#if data.word.category}
			<p class="mt-2 text-xs text-text-200">{categoryLabel(data.word.category)}</p>
		{/if}

		<div class="mx-auto mt-5 flex max-w-sm flex-col gap-2 sm:flex-row">
			<div class="flex-1">
				<AudioButton
					text={data.word.arabic}
					dialect={data.dialect as Dialect}
					audioUrl={data.word.audioUrl ?? undefined}
					className="w-full"
				>
					Listen
				</AudioButton>
			</div>
			<div class="flex-1">
				<SaveButton
					className=""
					objectToSave={{
						arabic: data.word.arabic,
						english: data.word.english,
						transliterated: data.word.transliteration
					}}
					type="Word"
				/>
			</div>
		</div>
	</section>

	<section class="mt-6" aria-live="polite">
		{#if failed}
			<p class="rounded-xl border border-tile-500 bg-tile-300 p-4 text-text-200">
				Couldn't load the grammar details for this word. Try again in a moment.
			</p>
		{:else if !details}
			<p class="rounded-xl border border-tile-500 bg-tile-300 p-4 text-text-200" role="status">
				Looking up gender, plural, root and examples…
			</p>
		{:else}
			<dl class="grid gap-3 sm:grid-cols-2">
				{#if details.pos}
					<div class="rounded-xl border border-tile-500 bg-tile-300 p-4">
						<dt class="text-xs font-bold uppercase tracking-[0.1em] text-text-200">Part of speech</dt>
						<dd class="mt-1 font-semibold capitalize text-text-300">{details.pos}</dd>
					</div>
				{/if}
				{#if details.gender}
					<div class="rounded-xl border border-tile-500 bg-tile-300 p-4">
						<dt class="text-xs font-bold uppercase tracking-[0.1em] text-text-200">Gender</dt>
						<dd class="mt-1 font-semibold capitalize text-text-300">{details.gender}</dd>
					</div>
				{/if}
				{#if details.pluralArabic}
					<div class="rounded-xl border border-tile-500 bg-tile-300 p-4">
						<dt class="text-xs font-bold uppercase tracking-[0.1em] text-text-200">Plural</dt>
						<dd class="mt-1 text-2xl font-semibold text-text-300" dir="rtl" lang="ar">{details.pluralArabic}</dd>
						{#if details.pluralTransliteration}
							<dd class="text-sm italic text-text-200">{details.pluralTransliteration}</dd>
						{/if}
					</div>
				{/if}
				{#if details.presentArabic}
					<div class="rounded-xl border border-tile-500 bg-tile-300 p-4">
						<dt class="text-xs font-bold uppercase tracking-[0.1em] text-text-200">Present (he)</dt>
						<dd class="mt-1 text-2xl font-semibold text-text-300" dir="rtl" lang="ar">{details.presentArabic}</dd>
						{#if details.presentTransliteration}
							<dd class="text-sm italic text-text-200">{details.presentTransliteration}</dd>
						{/if}
					</div>
				{/if}
				{#if details.root}
					<div class="rounded-xl border border-tile-500 bg-tile-300 p-4">
						<dt class="text-xs font-bold uppercase tracking-[0.1em] text-text-200">Root</dt>
						<dd class="mt-1 text-2xl font-semibold text-text-300" dir="rtl" lang="ar">{details.root}</dd>
						<dd class="text-xs text-text-200">
							<a class="underline hover:text-text-300" href="/grammar/{data.dialect}/verb-forms">What's a root?</a>
						</dd>
					</div>
				{/if}
			</dl>

			{#if details.examples.length}
				<h2 class="mb-3 mt-8 text-sm font-bold uppercase tracking-[0.1em] text-text-200">Examples</h2>
				<ul class="grid gap-2">
					{#each details.examples as ex, i (i)}
						<li class="rounded-xl border border-tile-500 bg-tile-300 p-4">
							<p class="text-right text-xl font-semibold text-text-300" dir="rtl" lang="ar">{ex.arabic}</p>
							<p class="mt-1 text-sm italic text-text-200">{ex.transliteration}</p>
							<p class="text-text-300">{ex.english}</p>
						</li>
					{/each}
				</ul>
			{/if}

			{#if details.conjugationSlug || details.wordPageSlug}
				<div class="mt-8 flex flex-wrap gap-3">
					{#if details.conjugationSlug}
						<a
							href="/{data.dialect}/conjugations/{details.conjugationSlug}"
							class="rounded-xl border-2 border-tile-600 bg-tile-500 px-4 py-2 font-semibold text-text-300 hover:bg-tile-600"
						>
							Full conjugation table
						</a>
					{/if}
					{#if details.wordPageSlug}
						<a
							href="/{data.dialect}/word/{details.wordPageSlug}"
							class="rounded-xl border-2 border-tile-600 bg-tile-300 px-4 py-2 font-semibold text-text-300 hover:bg-tile-400"
						>
							More examples from stories
						</a>
					{/if}
				</div>
			{/if}
		{/if}
	</section>
</div>
