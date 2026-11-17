<script lang="ts">
	// The Arabic dialects side by side: the same sentences and words in each. Audio
	// is /api/game-audio in each dialect's voice (made on first play, then cached
	// on the CDN), free for every visitor.
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import AudioClip from '$lib/components/AudioClip.svelte';
	import { gameAudioUrl } from '$lib/games/game-audio';
	import { getDialectInfo } from '$lib/constants/dialects';
	import { dialectAccent } from '$lib/constants/dialect-accents';
	import { DIALECT_LANDING } from '$lib/constants/dialect-landing';
	import {
		CONTRAST_DIMENSIONS,
		DIALECT_COMPARISONS,
		DIALECT_CONTRASTS,
		comparisonSlug
	} from '$lib/constants/dialect-comparisons';
	import { varietiesFor } from '$lib/constants/varieties';
	import { NUR_ENABLED } from '$lib/constants/feature-flags';
	import {
		COMPARED_DIALECTS,
		DIALECT_SENTENCES,
		DIALECT_WORDS,
		UNIVERSAL_VOICE,
		UNIVERSAL_WORDS,
		type ComparedDialect
	} from '$lib/constants/dialect-compare';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const dialects = COMPARED_DIALECTS.map((key) => ({
		key,
		info: getDialectInfo(key)!,
		landing: DIALECT_LANDING[key],
		accent: dialectAccent(key)
	}));
	/** Short column labels; MSA reads better than Fusha in a header. */
	const shortName = (key: ComparedDialect) => (key === 'fusha' ? 'MSA' : getDialectInfo(key)!.shortName);

	// The sound and grammar rows; the word rows already have audio above.
	const contrastRows = CONTRAST_DIMENSIONS.filter((d) =>
		['qaf', 'jim', 'present', 'future', 'negation'].includes(d.key)
	);

	const pairs = DIALECT_COMPARISONS.map((pair) => ({
		href: `/${comparisonSlug(pair)}`,
		title: `${DIALECT_LANDING[pair.a].heading} vs ${DIALECT_LANDING[pair.b].heading}`,
		summary: pair.intelligibility.split('. ')[0] + '.'
	}));

	const signedIn = $derived(Boolean(page.data.user));
	const startHref = $derived(signedIn ? '/lessons/structured' : '/signup');

	// "Play all": the same sentence in every dialect, one after another.
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
			if (i >= COMPARED_DIALECTS.length || playingAll !== sentenceId) {
				if (playingAll === sentenceId) playingAll = null;
				return;
			}
			const dialect = COMPARED_DIALECTS[i];
			const sentence = DIALECT_SENTENCES.find((s) => s.id === sentenceId)!;
			chain = new Audio(gameAudioUrl(sentence.forms[dialect].arabic, dialect));
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
		<p class="hero-eyebrow">🗺️ Arabic dialects compared</p>
		<h1>The Arabic dialects, side by side</h1>
		<p class="hero-tagline">
			Egyptian, Levantine, Gulf, Iraqi, Saudi and Moroccan Arabic, with Modern Standard Arabic for
			reference. Hear the same sentences in a native voice for each, see the words that change, and
			find out who understands whom.
		</p>
		<div class="hero-actions">
			<a href={resolve(startHref as Pathname)} class="cta">
				{signedIn ? 'Go to your lessons' : 'Start learning free'} <span aria-hidden="true">→</span>
			</a>
			<a href="#same-sentence" class="cta-ghost">Hear the difference ↓</a>
		</div>
		<nav class="jump" aria-label="Dialects on this page">
			{#each dialects as d (d.key)}
				<a href="#dialect-{d.key}" class="chip">{d.info.flag} {shortName(d.key)}</a>
			{/each}
		</nav>
	</header>

	<div id="same-sentence" class="scroll-mt-6">
		{@render sectionHead('🎧', 'Same sentence, seven ways', 'tap to listen')}
		<div class="space-y-4">
			{#each DIALECT_SENTENCES as sentence (sentence.id)}
				<div class="panel">
					<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
						<h3 class="panel-title">“{sentence.english}”</h3>
						<button type="button" class="play-all" onclick={() => playAll(sentence.id)}>
							{playingAll === sentence.id ? '■ Stop' : '▶ Play all seven'}
						</button>
					</div>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
						{#each dialects as d (d.key)}
							{@const form = sentence.forms[d.key]}
							<div class="form" style="--accent:{d.accent.accent};">
								<p class="form-who">{d.info.flag} {shortName(d.key)}</p>
								<p class="form-ar" dir="rtl" lang="ar">{form.arabic}</p>
								<p class="form-tr">{form.transliteration}</p>
								<AudioClip
									src={gameAudioUrl(form.arabic, d.key)}
									label="{shortName(d.key)}: {form.transliteration}"
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
		{@render sectionHead('🔍', 'The words that change', 'scroll sideways on a phone')}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th scope="col">English</th>
						{#each dialects as d (d.key)}
							<th scope="col">{d.info.flag} {shortName(d.key)}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each DIALECT_WORDS as word (word.id)}
						<tr>
							<th scope="row">
								{word.english}
								{#if word.note}<span class="note">{word.note}</span>{/if}
							</th>
							{#each dialects as d (d.key)}
								{@const form = word.forms[d.key]}
								<td>
									<span class="cell">
										<span class="cell-ar" dir="rtl" lang="ar">{form.arabic}</span>
										<AudioClip
											src={gameAudioUrl(form.arabic, d.key)}
											label="{shortName(d.key)}: {form.transliteration}"
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
		{@render sectionHead('🗣️', 'Sounds and grammar')}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th scope="col"></th>
						{#each dialects as d (d.key)}
							<th scope="col">{d.info.flag} {shortName(d.key)}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each contrastRows as row (row.key)}
						<tr>
							<th scope="row">{row.label}</th>
							{#each dialects as d (d.key)}
								<td class="text-cell">{DIALECT_CONTRASTS[d.key]?.[row.key]}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div>
		{@render sectionHead('🤝', 'Said the same everywhere')}
		<p class="lead">For all their differences, every Arabic speaker knows these:</p>
		<ul class="shared">
			{#each UNIVERSAL_WORDS as w (w.id)}
				<li class="shared-word">
					<span class="cell-ar" dir="rtl" lang="ar">{w.arabic}</span>
					<span class="cell-tr">{w.transliteration}</span>
					<span class="shared-en">{w.english}</span>
					<AudioClip src={gameAudioUrl(w.arabic, UNIVERSAL_VOICE)} label={w.transliteration} />
				</li>
			{/each}
		</ul>
	</div>

	<div>
		{@render sectionHead('📍', 'Each dialect in brief')}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
			{#each dialects as d (d.key)}
				{@const varieties = varietiesFor(d.key)}
				<div id="dialect-{d.key}" class="panel scroll-mt-6" style="--accent:{d.accent.accent}; --deep:{d.accent.deep};">
					<h3 class="panel-title">{d.info.flag} {d.landing.heading}</h3>
					<p class="panel-body">{d.landing.tagline}</p>
					<p class="where"><strong>Spoken in:</strong> {d.landing.whereSpoken}</p>
					{#if varieties.length}
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each varieties as v (v.key)}
								<a href={resolve(`/${v.slug}` as Pathname)} class="chip chip--sm">{v.flag} {v.shortName}</a>
							{/each}
						</div>
					{/if}
					<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
						<a href={resolve(`/${d.key}` as Pathname)} class="more">Learn {d.landing.heading} →</a>
						{#if d.key === 'levantine' && NUR_ENABLED}
							<a href={resolve('/levantine-dialects')} class="more">Compare its four accents →</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div>
		{@render sectionHead('⚖️', 'Who understands whom', 'head to head')}
		<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
			{#each pairs as p (p.href)}
				<a href={resolve(p.href as Pathname)} class="pair">
					<span class="pair-title">{p.title}</span>
					<span class="pair-desc">{p.summary}</span>
				</a>
			{/each}
		</div>
	</div>

	<div class="panel panel--accent">
		{@render sectionHead('🧭', 'Which dialect should you learn?')}
		<ul class="advice">
			<li><strong>No particular country in mind:</strong> Egyptian reaches the furthest, with Levantine a close second.</li>
			<li><strong>Family, a partner or a move:</strong> learn their dialect. Nothing else feels as good in that kitchen.</li>
			<li><strong>Living in the Gulf:</strong> Khaleeji for the UAE, Kuwait, Qatar and Bahrain; Hijazi for Jeddah and Mecca.</li>
			<li><strong>Morocco:</strong> Darija. It's the only dialect that really works there.</li>
			<li><strong>Reading, news, the Quran:</strong> Modern Standard Arabic, alongside a dialect for speaking.</li>
		</ul>
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
		<h2>Pick a dialect and start speaking</h2>
		<div class="flex flex-wrap justify-center gap-2">
			{#each dialects as d (d.key)}
				<a href={resolve(`/${d.key}` as Pathname)} class="chip">{d.info.flag} {d.landing.heading}</a>
			{/each}
		</div>
		<p class="text-sm text-text-200">
			Read more: <a href={resolve('/blog/fusha-egyptian-levantine-darija')} class="link">Fusha, Egyptian, Levantine or Darija?</a>
			· <a href={resolve('/blog/is-arabic-hard-to-learn')} class="link">Is Arabic hard to learn?</a>
		</p>
	</div>
</section>

<style>
	.hero {
		border-radius: 1.4rem;
		border: 2px solid #0ea5e9;
		background: color-mix(in srgb, #0ea5e9 9%, var(--tile3));
		box-shadow: 0 5px 0 #0369a1;
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
		font-size: clamp(1.8rem, 4.5vw, 2.6rem);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
	.hero-tagline {
		margin-top: 0.75rem;
		max-width: 44rem;
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
	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 1.2rem;
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
	.link {
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 3px;
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
	.panel[style*='--deep'] {
		border-top: 4px solid var(--accent);
	}
	.panel--accent {
		border-color: #0ea5e9;
		background: color-mix(in srgb, #0ea5e9 7%, var(--tile3));
		box-shadow: 0 4px 0 #0369a1;
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
	.where {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--text2);
	}
	.where strong {
		color: var(--text1);
	}
	.advice {
		list-style: disc;
		padding-left: 1.2rem;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--text2);
	}
	.advice li + li {
		margin-top: 0.35rem;
	}
	.advice strong {
		color: var(--text1);
	}
	.play-all {
		border-radius: 100px;
		background: #0ea5e9;
		color: #fff;
		padding: 0.35rem 0.85rem;
		font-size: 0.8rem;
		font-weight: 600;
		box-shadow: 0 3px 0 #0369a1;
	}
	.form {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		border-left: 4px solid var(--accent);
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
		min-width: 56rem;
		border-collapse: collapse;
		font-size: 0.88rem;
	}
	th,
	td {
		border-bottom: 1px solid var(--tile5);
		padding: 0.6rem 0.7rem;
		text-align: left;
		vertical-align: top;
		color: var(--text1);
	}
	thead th {
		font-size: 0.78rem;
		color: var(--text2);
		white-space: nowrap;
	}
	tbody th {
		font-weight: 600;
		max-width: 10rem;
	}
	.text-cell {
		font-size: 0.8rem;
		line-height: 1.45;
		color: var(--text2);
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
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.chip {
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.35rem 0.85rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
		box-shadow: 0 3px 0 var(--tile5);
	}
	.chip:hover {
		border-color: var(--tile6);
	}
	.chip--sm {
		padding: 0.2rem 0.6rem;
		font-size: 0.75rem;
		box-shadow: none;
	}

	.pair {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.75rem 0.9rem;
		box-shadow: 0 3px 0 var(--tile5);
		transition: border-color 0.15s ease;
	}
	.pair:hover {
		border-color: #0ea5e9;
	}
	.pair-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
	}
	.pair-desc {
		font-size: 0.8rem;
		line-height: 1.45;
		color: var(--text2);
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
