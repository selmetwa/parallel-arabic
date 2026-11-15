<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import LessonPlayerV2 from '$lib/components/LessonPlayerV2.svelte';
	import { getDialectInfo } from '$lib/constants/dialects';
	import { trackEvent } from '$lib/analytics';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const BUILD_TIMEOUT_MS = 6 * 60 * 1000;
	const MIN_WORDS = 4;
	const MAX_WORDS = 80; // same limits as src/lib/server/tutor-notes/build.ts

	const note = $derived(data.note);
	const dialectInfo = $derived(getDialectInfo(note.dialect));

	// Everything starts ticked; a failed build keeps what the learner picked last time.
	const deselected = new SvelteSet<number>(
		untrack(() =>
			data.note.selection ? data.note.items.map((_, i) => i).filter((i) => !data.note.selection!.includes(i)) : []
		)
	);

	let showTashkeel = $state(true);
	let showTransliteration = $state(true);
	let showEnglish = $state(true);

	let requesting = $state(false);
	let requestError = $state<string | null>(null);
	let now = $state(Date.now());
	let startedAt = $state<number | null>(null);
	let playing = $state(false);

	const groups = $derived.by(() => {
		const map = new Map<string, number[]>();
		note.items.forEach((item, i) => {
			if (item.kind !== 'vocab') return;
			const list = map.get(item.group) ?? [];
			list.push(i);
			map.set(item.group, list);
		});
		return [...map.entries()];
	});
	const conceptIdx = $derived(note.items.flatMap((item, i) => (item.kind === 'concept' ? [i] : [])));
	const wordIdx = $derived(groups.flatMap(([, idx]) => idx));
	const selectedWords = $derived(wordIdx.filter((i) => !deselected.has(i)).length);
	const selectedConcepts = $derived(conceptIdx.filter((i) => !deselected.has(i)).length);
	const canBuild = $derived(selectedWords >= MIN_WORDS && selectedWords <= MAX_WORDS);

	const stale = $derived(
		note.status === 'building' && !!note.buildStartedAt && now - note.buildStartedAt > BUILD_TIMEOUT_MS
	);
	const isBuilding = $derived(requesting || (note.status === 'building' && !stale));
	const showChecklist = $derived(!isBuilding && (note.status === 'extracted' || note.status === 'failed' || stale));
	const buildError = $derived(requestError ?? (stale ? 'Building stopped before it finished. Try again.' : note.error));

	const elapsed = $derived(Math.round((now - (startedAt ?? note.buildStartedAt ?? now)) / 1000));
	const stage = $derived(
		elapsed < 25
			? 'Writing practice sentences with your words'
			: elapsed < 60
				? 'Writing more, so every word comes back a few times'
				: elapsed < 90
					? 'Writing a short reading and a roleplay'
					: 'Putting your lesson together'
	);
	const minutes = $derived(note.stepCount ? Math.max(5, Math.round((note.stepCount * 13) / 60)) : null);

	// Tick while building; poll when the build was started from another tab or before a reload.
	$effect(() => {
		if (!isBuilding) return;
		const tick = setInterval(() => (now = Date.now()), 1000);
		const poll = requesting
			? null
			: setInterval(async () => {
					const res = await fetch(`/api/tutor-notes/${note.id}`).catch(() => null);
					const status = res?.ok ? (await res.json()).status : null;
					if (status && status !== 'building') invalidateAll();
				}, 4000);
		return () => {
			clearInterval(tick);
			if (poll) clearInterval(poll);
		};
	});

	function toggle(i: number) {
		if (deselected.has(i)) deselected.delete(i);
		else deselected.add(i);
	}

	function setAll(indexes: number[], on: boolean) {
		for (const i of indexes) {
			if (on) deselected.delete(i);
			else deselected.add(i);
		}
	}

	function arabicOf(item: { arabic: string; arabicTashkeel?: string }) {
		return (showTashkeel && item.arabicTashkeel) || item.arabic;
	}

	async function build() {
		if (!canBuild || requesting) return;
		requesting = true;
		requestError = null;
		startedAt = Date.now();
		now = startedAt;
		const selection = note.items.map((_, i) => i).filter((i) => !deselected.has(i));
		trackEvent('tutor_notes_build_started', { words: selectedWords, concepts: selectedConcepts });
		try {
			const res = await fetch(`/api/tutor-notes/${note.id}/build`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ selection })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok) requestError = result.error || 'Building the lesson failed. Try again.';
			else trackEvent('tutor_notes_build_finished', { words: selectedWords, steps: result.stepCount });
		} catch {
			requestError = 'Lost connection while building. Refresh in a minute to see if it finished.';
		}
		await invalidateAll();
		requesting = false;
	}

	async function remove() {
		if (!confirm('Delete these notes and their lesson? Words already in your review deck stay there.')) return;
		await fetch(`/api/tutor-notes/${note.id}`, { method: 'DELETE' });
		await goto(resolve('/notes'));
	}
</script>

{#snippet toggles()}
	<div class="toggles" role="group" aria-label="Show">
		<button type="button" class="tog" class:on={showTashkeel} onclick={() => (showTashkeel = !showTashkeel)} aria-pressed={showTashkeel}>
			<span dir="rtl">حَ</span> Tashkeel
		</button>
		<button type="button" class="tog" class:on={showTransliteration} onclick={() => (showTransliteration = !showTransliteration)} aria-pressed={showTransliteration}>
			Aa Transliteration
		</button>
		<button type="button" class="tog" class:on={showEnglish} onclick={() => (showEnglish = !showEnglish)} aria-pressed={showEnglish}>
			EN English
		</button>
	</div>
{/snippet}

{#snippet entry(item: (typeof note.items)[number])}
	<span class="entry">
		<span class="entry-ar" dir="rtl">{arabicOf(item)}</span>
		{#if showTransliteration}<span class="entry-tr">{item.transliteration}</span>{/if}
		{#if showEnglish}<span class="entry-en">{item.english}</span>{/if}
		{#if item.explanation}<span class="entry-note">{item.explanation}</span>{/if}
	</span>
{/snippet}

<div class="page">
	<a class="back" href={resolve('/notes')}>← Tutor notes</a>

	<header class="head">
		<p class="eyebrow">{dialectInfo?.flag} {dialectInfo?.name ?? note.dialect}</p>
		<h1>{note.title}</h1>
	</header>

	{#if isBuilding}
		<section class="card building" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<h2>Building your lesson</h2>
			<p class="stage">{stage}…</p>
			<p class="hint">This takes a minute or two. You can leave this page; it keeps going.</p>
		</section>
	{:else if note.status === 'ready' && data.lesson && !stale}
		<section class="card ready">
			<p class="ready-meta">{note.wordCount} words · {note.stepCount} steps · about {minutes} min</p>
			<button type="button" class="primary" onclick={() => { playing = true; trackEvent('tutor_notes_lesson_opened', { resumed: data.resumeStep > 0 }); }}>
				{data.resumeStep > 0 ? `Resume at step ${data.resumeStep + 1}` : 'Start lesson'}
			</button>
			<p class="hint">Every word is also in your <a href={resolve('/review')}>review deck</a>.</p>
		</section>

		<div class="list-head">
			<h2>Words in this lesson</h2>
			{@render toggles()}
		</div>
		<ul class="words">
			{#each data.lesson.vocab as v (v.english)}
				<li>{@render entry({ ...v, kind: 'vocab', explanation: '', sourceLine: '', group: '', partOfSpeech: v.partOfSpeech })}</li>
			{/each}
		</ul>

		<button type="button" class="link danger" onclick={remove}>Delete these notes</button>
	{:else if showChecklist}
		{#if buildError}
			<p class="error" role="alert">{buildError}</p>
		{/if}

		<p class="lede">
			We found <strong>{wordIdx.length} words</strong>{#if conceptIdx.length} and <strong>{conceptIdx.length} grammar points</strong>{/if}.
			Untick anything you don't want to practise. The words you keep go into one lesson and your review deck.
		</p>

		<div class="list-head">
			<div class="bulk">
				<button type="button" class="link" onclick={() => setAll([...wordIdx, ...conceptIdx], true)}>Select all</button>
				<button type="button" class="link" onclick={() => setAll([...wordIdx, ...conceptIdx], false)}>Select none</button>
			</div>
			{@render toggles()}
		</div>

		{#each groups as [group, indexes] (group)}
			{@const allOn = indexes.every((i) => !deselected.has(i))}
			<section class="group">
				<div class="group-head">
					<h2>{group || 'Words'}</h2>
					<button type="button" class="link" onclick={() => setAll(indexes, !allOn)}>{allOn ? 'Untick group' : 'Tick group'}</button>
				</div>
				<ul class="checklist">
					{#each indexes as i (i)}
						<li>
							<label class="check" class:off={deselected.has(i)}>
								<input type="checkbox" checked={!deselected.has(i)} onchange={() => toggle(i)} />
								{@render entry(note.items[i])}
							</label>
						</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if conceptIdx.length}
			<section class="group">
				<div class="group-head">
					<h2>Grammar points</h2>
				</div>
				<p class="group-sub">Each one gets a short explanation in the lesson, then sentences that use it.</p>
				<ul class="checklist">
					{#each conceptIdx as i (i)}
						<li>
							<label class="check" class:off={deselected.has(i)}>
								<input type="checkbox" checked={!deselected.has(i)} onchange={() => toggle(i)} />
								{@render entry(note.items[i])}
							</label>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if note.uncovered.length}
			<p class="uncovered">
				Not picked up: <span dir="rtl">{note.uncovered.join('، ')}</span>
			</p>
		{/if}

		<button type="button" class="link danger" onclick={remove}>Delete these notes</button>

		<div class="footer">
			<p class="footer-count">
				{selectedWords} words{#if selectedConcepts} · {selectedConcepts} grammar{/if}
				{#if selectedWords < MIN_WORDS}<span class="footer-hint">Pick at least {MIN_WORDS} words</span>{:else if selectedWords > MAX_WORDS}<span class="footer-hint">Pick at most {MAX_WORDS} for one lesson</span>{/if}
			</p>
			<button type="button" class="primary" disabled={!canBuild} onclick={build}>Build lesson</button>
		</div>
	{/if}
</div>

{#if playing && data.lesson}
	<LessonPlayerV2
		lesson={data.lesson}
		user={data.user}
		initialStep={data.resumeStep}
		onClose={async () => {
			playing = false;
			await invalidateAll();
		}}
		onLessonComplete={async () => {
			trackEvent('tutor_notes_lesson_completed', { words: note.wordCount });
			playing = false;
			await invalidateAll();
		}}
	/>
{/if}

<style>
	.page {
		max-width: 46rem;
		margin: 0 auto;
		padding: 2.5rem 1rem 8rem;
		color: var(--text1);
	}
	.back {
		font-size: 0.85rem;
		color: var(--text2);
	}
	.back:hover {
		color: var(--text1);
	}
	.head {
		margin: 0.75rem 0 1.25rem;
	}
	.eyebrow {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
	}
	h1 {
		margin-top: 0.25rem;
		font-size: clamp(1.5rem, 4vw, 1.9rem);
		font-weight: 700;
		line-height: 1.2;
	}
	h2 {
		font-size: 1rem;
		font-weight: 700;
	}
	.lede {
		color: var(--text2);
		line-height: 1.55;
		margin-bottom: 1rem;
	}
	.lede strong {
		color: var(--text1);
	}

	.card {
		padding: 1.75rem 1.5rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		border-bottom-width: 4px;
		background: var(--tile3);
		text-align: center;
		margin-bottom: 1.5rem;
	}
	.hint {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--text2);
	}
	.hint a {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.building h2 {
		margin-top: 1rem;
		font-size: 1.15rem;
	}
	.stage {
		margin-top: 0.4rem;
		color: var(--text1);
	}
	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		margin: 0 auto;
		border-radius: 50%;
		border: 3px solid var(--tile5);
		border-top-color: #22c55e;
		animation: spin 0.9s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}

	.ready-meta {
		color: var(--text2);
		margin-bottom: 1rem;
	}

	.list-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.bulk {
		display: flex;
		gap: 1rem;
	}
	.toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.tog {
		padding: 0.3rem 0.75rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
		transition: background 0.15s ease, color 0.15s ease;
	}
	.tog.on {
		background: var(--text1);
		border-color: var(--text1);
		color: var(--tile2);
	}

	.group {
		margin-top: 1.5rem;
	}
	.group-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.group-sub {
		margin: -0.25rem 0 0.5rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.checklist,
	.words {
		display: flex;
		flex-direction: column;
		border: 2px solid var(--tile5);
		border-radius: 1rem;
		overflow: hidden;
		background: var(--tile2);
	}
	.checklist li + li,
	.words li + li {
		border-top: 1px solid var(--tile5);
	}
	.words li {
		padding: 0.8rem 1rem;
	}
	.check {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
		padding: 0.8rem 1rem;
		cursor: pointer;
		transition: background 0.12s ease, opacity 0.12s ease;
	}
	.check:hover {
		background: var(--tile3);
	}
	.check.off {
		opacity: 0.5;
	}
	.check input {
		margin-top: 0.45rem;
		width: 1.15rem;
		height: 1.15rem;
		flex-shrink: 0;
		accent-color: #22c55e;
	}

	.entry {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 0.75rem;
		row-gap: 0.1rem;
		min-width: 0;
	}
	.entry-ar {
		font-size: 1.35rem;
		font-weight: 600;
		line-height: 1.6;
	}
	.entry-tr {
		font-style: italic;
		color: var(--text2);
	}
	.entry-en {
		color: var(--text1);
	}
	.entry-note {
		flex-basis: 100%;
		font-size: 0.8rem;
		color: var(--text2);
	}

	.uncovered {
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	.error {
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.8rem;
		border: 2px solid #d65745;
		color: #d65745;
		background: color-mix(in srgb, #d65745 10%, transparent);
	}

	.link {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.link:hover {
		color: var(--text1);
	}
	.link.danger {
		display: block;
		margin-top: 2rem;
	}
	.link.danger:hover {
		color: #d65745;
	}

	.footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		padding: 0.9rem 1rem calc(0.9rem + env(safe-area-inset-bottom));
		border-top: 2px solid var(--tile5);
		background: var(--tile2);
	}
	.footer-count {
		font-weight: 600;
		display: flex;
		flex-direction: column;
	}
	.footer-hint {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text2);
	}

	.primary {
		padding: 0.85rem 1.4rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
		transition: transform 0.14s ease, box-shadow 0.14s ease;
	}
	.primary:not(:disabled):active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
