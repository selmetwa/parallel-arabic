<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import AudioClip from '$lib/components/AudioClip.svelte';
	import { TRANSLATOR_MAX_CHARS } from '$lib/constants/translator';
	import { audioFor } from '$lib/games/game-audio';

	let { data } = $props();

	type Result = { arabic: string; transliteration: string; remaining: number | null };

	let text = $state('');
	let loading = $state(false);
	let result = $state<Result | null>(null);
	let error = $state('');
	let limitReached = $state(false);
	let copied = $state(false);

	const signedIn = $derived(Boolean(page.data.user));
	const here = $derived(page.url.pathname);
	const nextQuery = $derived(`?next=${encodeURIComponent(here)}`);
	const resultAudio = $derived(result ? audioFor(result.arabic, data.dialect) : null);

	async function translate(event: SubmitEvent) {
		event.preventDefault();
		if (!text.trim() || loading) return;

		loading = true;
		error = '';
		copied = false;
		try {
			const res = await fetch('/api/translate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text, dialect: data.dialect })
			});
			const body = await res.json().catch(() => ({}));
			if (res.ok) {
				result = body;
			} else if (body.limitReached) {
				limitReached = true;
			} else {
				error = body.error || 'Something went wrong. Please try again.';
			}
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function copy() {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(result.arabic);
			copied = true;
		} catch {
			copied = false;
		}
	}
</script>

<section class="min-h-screen bg-tile-200 px-4 py-8 sm:px-8">
	<div class="mx-auto max-w-3xl">
		<header class="mb-6">
			<h1 class="mb-2 text-3xl font-bold tracking-tight text-text-300 sm:text-4xl">
				{data.copy.name} Translator
			</h1>
			<p class="text-lg leading-snug text-text-200">{data.copy.intro}</p>
		</header>

		<form class="tool" onsubmit={translate}>
			<label for="translate-input" class="mb-2 block font-semibold text-text-300">English</label>
			<textarea
				id="translate-input"
				bind:value={text}
				maxlength={TRANSLATOR_MAX_CHARS}
				rows="3"
				placeholder="Where is the nearest pharmacy?"
				class="w-full rounded-lg border-2 border-tile-500 bg-tile-200 p-3 text-text-300"
			></textarea>
			<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
				<span class="text-sm text-text-200">{text.length}/{TRANSLATOR_MAX_CHARS}</span>
				<button
					type="submit"
					disabled={loading || !text.trim() || limitReached}
					class="rounded-lg border border-tile-600 bg-tile-500 px-6 py-3 font-semibold text-text-300 transition-colors hover:bg-tile-600 disabled:opacity-50"
				>
					{loading ? 'Translating…' : `Translate to ${data.copy.name}`}
				</button>
			</div>
		</form>

		<div aria-live="polite">
			{#if limitReached}
				<div class="tool mt-4">
					<p class="mb-3 font-semibold text-text-300">You've used today's free translations.</p>
					<p class="mb-4 text-text-200">
						Create a free account to keep translating, and save the phrases you look up to your review
						deck.
					</p>
					<a
						href="{resolve('/signup')}{nextQuery}"
						class="inline-block rounded-lg border border-tile-600 bg-tile-500 px-6 py-3 font-semibold text-text-300 transition-colors hover:bg-tile-600"
					>
						Sign up free
					</a>
				</div>
			{:else if error}
				<p class="mt-4 text-text-300">{error}</p>
			{:else if result}
				<div class="tool mt-4">
					<p class="ar-text text-3xl leading-relaxed text-text-300" lang="ar" dir="rtl">
						{result.arabic}
					</p>
					<p class="mt-2 text-lg text-text-200">{result.transliteration}</p>
					<div class="mt-4 flex flex-wrap items-center gap-3">
						{#if resultAudio}
							<AudioClip src={resultAudio} label={result.transliteration} text="Listen" />
						{/if}
						<button type="button" onclick={copy} class="text-sm font-semibold text-text-300 underline">
							{copied ? 'Copied' : 'Copy Arabic'}
						</button>
					</div>
					{#if !signedIn && result.remaining !== null}
						<p class="mt-4 text-sm text-text-200">
							{result.remaining} free {result.remaining === 1 ? 'translation' : 'translations'} left
							today. <a href="{resolve('/signup')}{nextQuery}" class="underline">Sign up</a> for unlimited.
						</p>
					{/if}
				</div>
			{/if}
		</div>

		{#if data.examples.length}
			<h2 class="mb-3 mt-12 text-2xl font-bold text-text-300">Common phrases in {data.copy.name}</h2>
			<ul class="grid gap-3 sm:grid-cols-2">
				{#each data.examples as ex (ex.slug)}
					<li>
						<a
							href={resolve('/[dialect=dialect]/phrases/[phrase]', {
								dialect: data.dialect,
								phrase: ex.slug
							})}
							class="tool block hover:bg-tile-400"
						>
							<span class="block text-sm text-text-200">{ex.english}</span>
							<span class="ar-text block text-xl text-text-300" lang="ar" dir="rtl">{ex.arabic}</span>
							<span class="block text-text-200">{ex.transliteration}</span>
						</a>
					</li>
				{/each}
			</ul>
			<p class="mt-4 text-text-200">
				Every phrase in the <a
					href={resolve('/[dialect=dialect]/phrases', { dialect: data.dialect })}
					class="underline">{data.copy.name} phrasebook</a
				> has audio, variants for men and women, and example sentences.
			</p>
		{/if}

		<h2 class="mb-3 mt-12 text-2xl font-bold text-text-300">Questions</h2>
		<div class="space-y-4">
			{#each data.faqs as faq (faq.question)}
				<div class="tool">
					<h3 class="mb-2 font-semibold text-text-300">{faq.question}</h3>
					<p class="text-text-200">{faq.answer}</p>
				</div>
			{/each}
		</div>

		<div class="tool mt-12 text-center">
			<p class="mb-4 text-lg font-semibold text-text-300">
				Want to speak {data.copy.name}, not just look it up?
			</p>
			<a
				href={resolve(`/${data.dialect}` as Pathname)}
				class="inline-block rounded-lg border border-tile-600 bg-tile-500 px-6 py-3 font-semibold text-text-300 transition-colors hover:bg-tile-600"
			>
				Start learning {data.copy.name} free
			</a>
		</div>
	</div>
</section>

<style>
	.tool {
		border: 2px solid var(--tile5);
		background: var(--tile3);
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
	}
</style>
