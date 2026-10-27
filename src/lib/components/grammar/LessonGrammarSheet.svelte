<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { GrammarTopic } from '$lib/data/grammar/topics';
	import GrammarArticle from './GrammarArticle.svelte';

	// The grammar behind a lesson, in a sheet over the lesson. It opens before
	// step 1 as the lesson's introduction and stays a tap away after that.
	interface Props {
		topics: GrammarTopic[];
		dialect: string;
		open: boolean;
		/** Shown as the lesson intro rather than a mid-lesson lookup. */
		intro?: boolean;
		onClose: () => void;
	}

	let { topics, dialect, open, intro = false, onClose }: Props = $props();

	let selected = $state(0);
	let articles = $state<Record<string, { html: string } | 'error'>>({});

	const topic = $derived(topics[selected] ?? topics[0]);
	const article = $derived(topic ? articles[topic.slug] : undefined);

	$effect(() => {
		if (!open || !topic || articles[topic.slug]) return;
		const slug = topic.slug;
		fetch(`/api/grammar/${dialect}/${slug}`)
			.then((res) => (res.ok ? res.json() : Promise.reject()))
			.then((data: { html: string }) => (articles = { ...articles, [slug]: { html: data.html } }))
			.catch(() => (articles = { ...articles, [slug]: 'error' }));
	});

	function onKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open && topic}
	<div class="fixed inset-0 z-[120] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Grammar: {topic.title}">
		<button
			type="button"
			class="absolute inset-0 bg-black/50"
			aria-label="Close grammar"
			onclick={onClose}
			transition:fade={{ duration: 150 }}
		></button>

		<div
			class="sheet relative flex w-full max-w-2xl flex-col rounded-t-2xl border border-tile-500 bg-tile-200 shadow-2xl sm:rounded-2xl"
			transition:fly={{ y: 40, duration: 220 }}
		>
			<header class="flex items-start gap-3 border-b border-tile-500 px-5 pb-3 pt-4">
				<div class="min-w-0 flex-1">
					<p class="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-text-200">
						{intro ? 'Before you start' : 'Grammar'}
					</p>
					<h2 class="text-xl font-bold text-text-300">{topic.title}</h2>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-text-200 hover:bg-tile-400 hover:text-text-300"
					aria-label="Close"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</header>

			{#if topics.length > 1}
				<div class="flex flex-wrap gap-2 border-b border-tile-500 px-5 py-2">
					{#each topics as t, i (t.slug)}
						<button
							type="button"
							onclick={() => (selected = i)}
							aria-pressed={selected === i}
							class="rounded-full border px-3 py-1 text-xs transition-colors {selected === i
								? 'border-tile-400 bg-tile-500 font-semibold text-text-300'
								: 'border-tile-600 bg-tile-300 text-text-200 hover:text-text-300'}"
						>
							{t.title}
						</button>
					{/each}
				</div>
			{/if}

			<div class="body flex-1 overflow-y-auto px-5 py-4">
				{#if article === 'error'}
					<p class="text-text-200">Couldn't load this explanation. Check your connection and try again.</p>
				{:else if article}
					<GrammarArticle html={article.html} />
				{:else}
					<p class="text-text-200" role="status">Loading…</p>
				{/if}
			</div>

			<footer class="flex flex-wrap items-center justify-between gap-3 border-t border-tile-500 px-5 py-3">
				<a href="/grammar/{dialect}/{topic.slug}" class="text-sm font-semibold text-text-200 underline hover:text-text-300">
					Open in the grammar guide
				</a>
				<button
					type="button"
					onclick={onClose}
					class="rounded-xl border-2 border-tile-600 bg-tile-500 px-4 py-2 font-semibold text-text-300 hover:bg-tile-600"
				>
					{intro ? 'Start the lesson' : 'Back to the lesson'}
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.sheet {
		max-height: min(85dvh, 760px);
		padding-bottom: env(safe-area-inset-bottom);
	}
	.body {
		overscroll-behavior: contain;
	}
</style>
