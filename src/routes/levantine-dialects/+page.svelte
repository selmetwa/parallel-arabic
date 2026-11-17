<script lang="ts">
	// Syrian, Lebanese, Jordanian and Palestinian Arabic side by side, with every
	// line recorded in its own Nur voice (scripts/generate-variety-audio.ts).
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import AudioClip from '$lib/components/AudioClip.svelte';
	import { getVarietyInfo } from '$lib/constants/varieties';
	import { VARIETY_LANDING } from '$lib/constants/variety-landing';
	import {
		COMPARE_SENTENCES,
		COMPARE_WORDS,
		LEVANTINE_VARIETIES,
		SHARED_VOICE,
		SHARED_WORDS,
		clipPath
	} from '$lib/constants/levantine-compare';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const varieties = LEVANTINE_VARIETIES.map((key) => getVarietyInfo(key)!);
	const LESSONS = '/lessons/structured/levantine';
	const signedIn = $derived(Boolean(page.data.user));
	const startHref = $derived(signedIn ? LESSONS : `/signup?next=${encodeURIComponent(LESSONS)}`);

	// "Play all four": the same sentence in each accent, one after another.
	let playingAll = $state<string | null>(null);
	let chain: HTMLAudioElement | null = null;

	function playAll(sentenceId: string) {
		chain?.pause();
		if (playingAll === sentenceId) {
			playingAll = null;
			return;
		}
		playingAll = sentenceId;
		const next = (i: number) => {
			if (i >= LEVANTINE_VARIETIES.length || playingAll !== sentenceId) {
				if (playingAll === sentenceId) playingAll = null;
				return;
			}
			chain = new Audio(clipPath('sentence', sentenceId, LEVANTINE_VARIETIES[i]));
			chain.onended = () => setTimeout(() => next(i + 1), 350);
			chain.play().catch(() => (playingAll = null));
		};
		next(0);
	}
</script>

{#snippet sectionHead(emoji: string, label: string, sub = '')}
	<div class="sec-head">
		<span class="sec-emoji" aria-hidden="true">{emoji}</span>
		<h2>{label}</h2>
		{#if sub}<span class="sec-sub">{sub}</span>{/if}
	</div>
{/snippet}

<section class="mx-auto max-w-6xl space-y-10 px-3 pb-16 pt-6 sm:px-8">
	<header class="hero">
		<nav class="hero-eyebrow" aria-label="Breadcrumb">
			<a href={resolve('/levantine')} class="crumb">🇱🇧 Levantine Arabic</a>
			<span aria-hidden="true">›</span> Dialects compared
		</nav>
		<h1>Syrian, Lebanese, Jordanian and Palestinian Arabic</h1>
		<p class="hero-tagline">
			One dialect, four accents. Hear the same sentences said by a native voice from each country,
			and the handful of words that tell them apart.
		</p>
		<div class="hero-actions">
			<a href={resolve(startHref as Pathname)} class="cta">
				{signedIn ? 'Continue your Levantine lessons' : 'Start learning Levantine free'} <span aria-hidden="true">→</span>
			</a>
			<a href="#same-sentence" class="cta-ghost">Hear the difference ↓</a>
		</div>
	</header>

	<div id="same-sentence" class="scroll-mt-6">
		{@render sectionHead('🎧', 'Same sentence, four accents', 'tap to listen')}
		<div class="space-y-4">
			{#each COMPARE_SENTENCES as sentence (sentence.id)}
				<div class="panel">
					<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
						<h3 class="panel-title">“{sentence.english}”</h3>
						<button type="button" class="play-all" onclick={() => playAll(sentence.id)}>
							{playingAll === sentence.id ? '■ Stop' : '▶ Play all four'}
						</button>
					</div>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
						{#each varieties as v (v.key)}
							{@const form = sentence.forms[v.key as keyof typeof sentence.forms]}
							<div class="form">
								<p class="form-who">{v.flag} {v.shortName}</p>
								<p class="form-ar" dir="rtl" lang="ar">{form.arabic}</p>
								<p class="form-tr">{form.transliteration}</p>
								<AudioClip
									src={clipPath('sentence', sentence.id, v.key as (typeof LEVANTINE_VARIETIES)[number])}
									label="{v.shortName}: {form.transliteration}"
									text="Listen"
								/>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div>
		{@render sectionHead('🔍', 'The words that give it away')}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th scope="col">English</th>
						{#each varieties as v (v.key)}
							<th scope="col">{v.flag} {v.shortName}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each COMPARE_WORDS as word (word.id)}
						<tr>
							<th scope="row">
								{word.english}
								{#if word.note}<span class="note">{word.note}</span>{/if}
							</th>
							{#each varieties as v (v.key)}
								{@const form = word.forms[v.key as keyof typeof word.forms]}
								<td>
									<span class="cell">
										<span class="cell-ar" dir="rtl" lang="ar">{form.arabic}</span>
										<AudioClip
											src={clipPath('word', word.id, v.key as (typeof LEVANTINE_VARIETIES)[number])}
											label="{v.shortName}: {form.transliteration}"
										/>
									</span>
									<span class="cell-tr">{form.transliteration}</span>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div>
		{@render sectionHead('🤝', 'What all four share', 'most of it')}
		<p class="lead">
			Grammar, verbs and nearly all everyday vocabulary are the same across the Levant. These words
			work everywhere from Damascus to Ramallah:
		</p>
		<ul class="shared">
			{#each SHARED_WORDS as w (w.id)}
				<li class="shared-word">
					<span class="cell-ar" dir="rtl" lang="ar">{w.arabic}</span>
					<span class="cell-tr">{w.transliteration}</span>
					<span class="shared-en">{w.english}</span>
					<AudioClip src={clipPath('shared', w.id, SHARED_VOICE)} label={w.transliteration} />
				</li>
			{/each}
		</ul>
	</div>

	<div>
		{@render sectionHead('🗺️', 'Hear each accent on its own')}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each varieties as v (v.key)}
				{@const phrases = VARIETY_LANDING[v.key].phrases.slice(0, 2)}
				<div class="panel">
					<h3 class="panel-title">{v.flag} {v.name}</h3>
					<p class="panel-body">{VARIETY_LANDING[v.key].tagline}</p>
					<ul class="mt-3 space-y-2">
						{#each phrases as p, i (p.arabic)}
							<li class="flex flex-wrap items-center gap-2">
								<span class="cell-ar" dir="rtl" lang="ar">{p.arabic}</span>
								<span class="cell-tr">{p.transliteration} · {p.english}</span>
								<AudioClip src="/audio/varieties/{v.key}-{i}.mp3" label="{v.shortName}: {p.transliteration}" />
							</li>
						{/each}
					</ul>
					<a href={resolve(`/${v.slug}` as Pathname)} class="more">Learn {v.name} →</a>
				</div>
			{/each}
		</div>
	</div>

	<div class="panel panel--accent">
		{@render sectionHead('🧭', 'Which one should you learn?')}
		<p class="panel-body">
			Pick the accent of the people you'll talk to: family, friends, or the country you're moving to.
			With no particular country in mind, learn general Levantine. It's understood in all four, and
			switching to one accent later means learning the short list of words above, not a new grammar.
		</p>
		<p class="panel-body">
			On Parallel Arabic the lessons teach the shared Levantine core, and you choose your accent:
			your audio, <a href={resolve('/tutor')}>your tutor</a> and the stories written for you then
			sound Syrian, Lebanese, Jordanian or Palestinian.
		</p>
	</div>

	<div>
		{@render sectionHead('❓', 'Common questions')}
		<div class="space-y-2.5">
			{#each data.faqs as faq, i (faq.question)}
				<details class="faq" open={i === 0}>
					<summary>{faq.question}</summary>
					<p class="panel-body">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</div>

	<div class="closing">
		<h2>Start speaking Levantine today</h2>
		<a href={resolve(startHref as Pathname)} class="cta">
			{signedIn ? 'Continue your Levantine lessons' : 'Start learning Levantine free'} <span aria-hidden="true">→</span>
		</a>
		<p class="text-sm text-text-200">
			Read more: <a href={resolve('/blog/levantine-arabic-dialects-compared')} class="crumb">How different are the Levantine dialects?</a>
			· <a href={resolve('/blog/how-to-learn-levantine-arabic')} class="crumb">How to learn Levantine Arabic</a>
			· <a href={resolve('/arabic-dialects')} class="crumb">All Arabic dialects compared</a>
		</p>
	</div>
</section>

<style>
	.hero {
		border-radius: 1.4rem;
		border: 2px solid #10b981;
		background: color-mix(in srgb, #10b981 9%, var(--tile3));
		box-shadow: 0 5px 0 #047857;
		padding: 1.6rem 1.25rem 1.4rem;
	}
	@media (min-width: 640px) {
		.hero {
			padding: 2.25rem 2.25rem 1.9rem;
		}
	}
	.hero-eyebrow {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}
	.hero h1 {
		margin-top: 0.4rem;
		font-size: clamp(1.7rem, 4.5vw, 2.5rem);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
	.hero-tagline {
		margin-top: 0.75rem;
		max-width: 42rem;
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--text2);
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.25rem;
		margin-top: 1.4rem;
	}
	.crumb {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: var(--tile6);
	}
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border-radius: 100px;
		padding: 0.85rem 1.6rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
	}
	.cta:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}
	.cta-ghost {
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: var(--tile6);
	}

	.sec-head {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-bottom: 0.85rem;
	}
	.sec-emoji {
		font-size: 1.15rem;
		line-height: 1;
	}
	.sec-head h2 {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
	.sec-sub {
		margin-left: auto;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border-radius: 100px;
		padding: 0.2rem 0.65rem;
	}
	.lead {
		margin-bottom: 0.75rem;
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--text2);
	}

	.panel,
	.faq {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem;
		box-shadow: 0 4px 0 var(--tile5);
	}
	.panel--accent {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 7%, var(--tile3));
		box-shadow: 0 4px 0 #047857;
	}
	.panel-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
	}
	.panel-body {
		margin-top: 0.35rem;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--text2);
	}
	.panel-body a {
		color: var(--text1);
		text-decoration: underline;
	}
	.play-all {
		border-radius: 100px;
		background: #10b981;
		color: #fff;
		padding: 0.35rem 0.85rem;
		font-size: 0.8rem;
		font-weight: 600;
		box-shadow: 0 3px 0 #047857;
	}
	.form {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		padding: 0.6rem 0.75rem;
	}
	.form-who {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text2);
	}
	.form-ar {
		align-self: stretch;
		font-size: 1.2rem;
		color: var(--text1);
	}
	.form-tr {
		font-size: 0.8rem;
		color: var(--text2);
	}

	.table-wrap {
		overflow-x: auto;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
	}
	table {
		width: 100%;
		min-width: 40rem;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		border-bottom: 1px solid var(--tile5);
		padding: 0.6rem 0.75rem;
		text-align: left;
		vertical-align: top;
		color: var(--text1);
	}
	thead th {
		font-size: 0.8rem;
		color: var(--text2);
	}
	tbody th {
		font-weight: 600;
		max-width: 12rem;
	}
	.note {
		display: block;
		margin-top: 0.2rem;
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--text2);
	}
	.cell {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.cell-ar {
		font-size: 1.15rem;
		color: var(--text1);
	}
	.cell-tr {
		display: block;
		font-size: 0.75rem;
		color: var(--text2);
	}

	.shared {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 0.5rem;
	}
	.shared-word {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.1rem 0.5rem;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.55rem 0.75rem;
	}
	.shared-word :global(.clip) {
		grid-column: 2;
		grid-row: 1 / span 3;
	}
	.shared-en {
		font-size: 0.8rem;
		color: var(--text1);
	}
	.more {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.faq summary {
		cursor: pointer;
		list-style: none;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
	}
	.faq summary::-webkit-details-marker {
		display: none;
	}
	.faq summary::after {
		content: '+';
		font-weight: 700;
		color: var(--text2);
	}
	.faq[open] summary::after {
		content: '–';
	}

	.closing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		border-radius: 1.4rem;
		border: 2px solid #22c55e;
		background: color-mix(in srgb, #22c55e 8%, var(--tile3));
		box-shadow: 0 5px 0 #15803d;
		padding: 2rem 1.25rem;
		text-align: center;
	}
	.closing h2 {
		font-size: clamp(1.2rem, 3vw, 1.5rem);
		font-weight: 700;
		color: var(--text1);
	}
</style>
