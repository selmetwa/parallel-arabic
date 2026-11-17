<script lang="ts">
	// Landing page for each dialect (/egyptian-arabic, /levantine, ...), in the homepage's
	// visual style: tiles with a solid bottom edge, press buttons, section headings, and a
	// clear path to the dialect's first lesson.
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { currentDialect } from '$lib/store/store';
	import VocabPractice from '$lib/components/dialect-shared/vocab/VocabPractice.svelte';
	import { DIALECT_LANDING } from '$lib/constants/dialect-landing';
	import { DIALECT_COMPARISONS, comparisonSlug } from '$lib/constants/dialect-comparisons';
	import { SELECTABLE_DIALECTS, getDialectInfo } from '$lib/constants/dialects';
	import { dialectAccent } from '$lib/constants/dialect-accents';
	import { VARIETIES, varietiesFor } from '$lib/constants/varieties';
	import { NUR_ENABLED } from '$lib/constants/feature-flags';
	import { EGYPTIAN_TESTIMONIAL, TESTIMONIALS, type TestimonialSegment } from '$lib/constants/testimonials';
	import { getGrammarTopic, hasGrammar } from '$lib/data/grammar/topics';
	import { trackEvent } from '$lib/analytics';
	import type { Dialect } from '$lib/types/index';
	import type { PracticeWord } from '$lib/types/words';

	interface Props {
		dialect: Dialect;
		/** Whether the phrasebook has been generated for this dialect. */
		hasPhrases?: boolean;
		/** Whether word pages have been built for this dialect. */
		hasWords?: boolean;
		/** Phrases to drill on, and to list as plain links. Omit and both sections are skipped. */
		practiceWords?: (PracticeWord & { slug?: string })[];
		/** Rounded learner count for the hero's social proof. */
		learners?: number;
	}

	let { dialect, hasPhrases = false, hasWords = false, practiceWords = [], learners = 0 }: Props = $props();

	const content = $derived(DIALECT_LANDING[dialect]);
	const info = $derived(getDialectInfo(dialect));
	const short = $derived(info?.shortName ?? content.heading);
	const accent = $derived(dialectAccent(dialect));
	const LESSONS = $derived(`/lessons/structured/${dialect}`);

	const signedIn = $derived(Boolean(page.data.user));
	const startHref = $derived(signedIn ? LESSONS : `/signup?next=${encodeURIComponent(LESSONS)}`);
	const startLabel = $derived(signedIn ? `Continue your ${short} lessons` : `Start learning ${short} free`);

	// Quotes that name the dialect where we have one; otherwise ones about learning dialects.
	const QUOTES: Record<string, [TestimonialSegment[], TestimonialSegment[]]> = {
		'egyptian-arabic': [EGYPTIAN_TESTIMONIAL, TESTIMONIALS[1]],
		darija: [TESTIMONIALS[10], TESTIMONIALS[0]],
		fusha: [TESTIMONIALS[2], TESTIMONIALS[4]]
	};
	const [heroQuote, closingQuote] = $derived(QUOTES[dialect] ?? [TESTIMONIALS[0], TESTIMONIALS[11]]);

	// The phrasebook's own "how are you", so the Phrases tile quotes the dialect itself.
	const howAreYou = $derived(practiceWords.find((w) => w.slug === 'how-are-you'));
	const listedPhrases = $derived(practiceWords.filter((w) => w.slug));

	const extra = (suffix: string) => content.extraLinks?.find((l) => l.href.endsWith(suffix));
	const startHere = $derived(content.extraLinks?.find((l) => l.title === 'Start Here'));
	const pronunciation = $derived(extra('/pronunciation'));
	const vocabByTopic = $derived(extra(`/${dialect}/vocabulary`));

	type Tile = { href: string; icon: string; title: string; desc: string; accent: string; deep: string };

	const learn: Tile[] = $derived([
		...(startHere
			? [{ href: startHere.href, icon: '🧭', title: 'Start here', desc: startHere.description, accent: '#f59e0b', deep: '#b45309' }]
			: []),
		{
			href: LESSONS,
			icon: '📚',
			title: 'Lessons',
			desc: content.tiles.lessons,
			accent: '#8b5cf6',
			deep: '#6d28d9'
		},
		...(pronunciation
			? [{ href: pronunciation.href, icon: '👄', title: 'Pronunciation', desc: pronunciation.description, accent: '#0ea5e9', deep: '#0369a1' }]
			: []),
		...(hasGrammar(dialect)
			? [
					{
						href: `/grammar/${dialect}`,
						icon: '📐',
						title: 'Grammar',
						desc: content.tiles.grammar ?? 'Pronouns, plurals, numbers, tenses and verb forms, in plain English.',
						accent: '#10b981',
						deep: '#047857'
					}
				]
			: [])
	]);

	const practice: Tile[] = $derived([
		...(hasPhrases
			? [
					{
						href: `/${dialect}/phrases`,
						icon: '💬',
						title: 'Phrases',
						desc: howAreYou
							? `Everyday phrases like ${howAreYou.transliteration} (how are you?), with audio and forms for a man, a woman or a group.`
							: 'Everyday phrases with audio, and the forms for a man, a woman or a group.',
						accent: '#f43f5e',
						deep: '#9f1239'
					}
				]
			: []),
		...(hasWords
			? [
					{
						href: `/${dialect}/word`,
						icon: '🔤',
						title: 'Common words',
						desc: content.tiles.words ?? 'The words you meet most, each with audio and real example sentences.',
						accent: '#0ea5e9',
						deep: '#0369a1'
					}
				]
			: []),
		...(vocabByTopic
			? [{ href: vocabByTopic.href, icon: '🍽️', title: 'Vocabulary by topic', desc: vocabByTopic.description, accent: '#f59e0b', deep: '#b45309' }]
			: []),
		{
			href: `/stories?dialect=${dialect}`,
			icon: '📖',
			title: 'Stories',
			desc: content.tiles.stories,
			accent: '#8b5cf6',
			deep: '#6d28d9'
		},
		{
			href: `/${dialect}/conjugations`,
			icon: '🔄',
			title: 'Verb conjugations',
			desc: content.tiles.conjugations,
			accent: '#10b981',
			deep: '#047857'
		},
		{
			href: '/tutor',
			icon: '🗣️',
			title: 'AI Tutor',
			desc: content.tiles.tutor,
			accent: '#6366f1',
			deep: '#4338ca'
		},
		{
			href: `/vocabulary?dialect=${dialect}`,
			icon: '🔎',
			title: 'Word search',
			desc: content.tiles.search,
			accent: '#0ea5e9',
			deep: '#0369a1'
		}
	]);

	// Country varieties (Lebanese, Kuwaiti, ...); empty while NUR_ENABLED is off.
	const varieties = $derived(varietiesFor(dialect));
	// Every other variety page, so each dialect page links to all of them.
	const otherVarieties = $derived(NUR_ENABLED ? VARIETIES.filter((v) => v.dialect !== dialect) : []);

	const grammar = ['pronouns', 'possessive-suffixes', 'plurals', 'numbers-counting', 'present-tense', 'past-tense']
		.map((slug) => getGrammarTopic(slug))
		.filter((t) => t !== undefined);

	// Cross-links, so every dialect page and comparison page is reachable from the others.
	const comparisons = $derived(
		DIALECT_COMPARISONS.filter((p) => p.a === dialect || p.b === dialect).map((pair) => ({
			href: `/${comparisonSlug(pair)}`,
			title: `${DIALECT_LANDING[pair.a].heading} vs ${DIALECT_LANDING[pair.b].heading}`
		}))
	);

	const otherDialects = $derived(
		SELECTABLE_DIALECTS.filter((d) => d !== dialect).map((d) => ({
			href: `/${d}`,
			title: DIALECT_LANDING[d].heading
		}))
	);

	// Mobile: once the hero button scrolls away, keep a slim "start free" bar until the closing call to action shows.
	let heroCta = $state<HTMLElement | null>(null);
	let closingCta = $state<HTMLElement | null>(null);
	let heroVisible = $state(true);
	let closingVisible = $state(false);
	const showStickyBar = $derived(!signedIn && !heroVisible && !closingVisible);

	function ctaClicked(position: 'hero' | 'closing' | 'sticky') {
		trackEvent('dialect_landing_cta_clicked', { dialect, position, signed_in: signedIn });
	}

	onMount(() => {
		currentDialect.set(dialect);
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === heroCta) heroVisible = entry.isIntersecting;
				if (entry.target === closingCta) closingVisible = entry.isIntersecting;
			}
		});
		if (heroCta) observer.observe(heroCta);
		if (closingCta) observer.observe(closingCta);
		return () => observer.disconnect();
	});
</script>

{#snippet sectionHead(emoji: string, label: string, sub: string)}
	<div class="sec-head">
		<span class="sec-emoji" aria-hidden="true">{emoji}</span>
		<h2>{label}</h2>
		{#if sub}<span class="sec-sub">{sub}</span>{/if}
	</div>
{/snippet}

{#snippet quote(segments: { t: string; b?: boolean }[])}
	{#each segments as seg, i (i)}{#if seg.b}<strong>{seg.t}</strong>{:else}{seg.t}{/if}{/each}
{/snippet}

<section class="mx-auto max-w-6xl space-y-9 px-3 pb-16 pt-6 sm:px-8">
	<!-- ── Hero ────────────────────────────────────────────────────────────── -->
	<header class="hero" style="--accent:{accent.accent}; --deep:{accent.deep};">
		<p class="hero-eyebrow">{info?.flag} {content.heading}</p>
		<h1>Learn {content.heading}</h1>
		<p class="hero-tagline">{content.tagline}</p>

		<div class="hero-actions">
			<a bind:this={heroCta} href={resolve(startHref as Pathname)} class="cta" onclick={() => ctaClicked('hero')}>
				{startLabel} <span aria-hidden="true">→</span>
			</a>
			<a href="#try" class="cta-ghost">Try a quick quiz first ↓</a>
		</div>

		<ul class="proof">
			<li>Free to start</li>
			{#if learners}<li>{learners.toLocaleString()}+ learners</li>{/if}
			<li>Lessons, stories, games and audio</li>
		</ul>

		<blockquote class="hero-quote">
			“{@render quote(heroQuote)}”
		</blockquote>
	</header>

	<!-- ── Try it now ──────────────────────────────────────────────────────── -->
	{#if practiceWords.length}
		<div id="try" class="reveal scroll-mt-6" style="animation-delay: 80ms;">
			{@render sectionHead('🎯', 'Try it now', 'no account needed')}
			<VocabPractice
				words={practiceWords}
				{dialect}
				topicLabel="the basics"
				isSubscribed={page.data.isSubscribed ?? false}
				practiceHref="/{dialect}/phrases"
			/>
		</div>
	{/if}

	<!-- ── Learn ───────────────────────────────────────────────────────────── -->
	<div class="reveal" style="animation-delay: 140ms;">
		{@render sectionHead('🌱', `Learn ${short}`, 'build the foundation')}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 {learn.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}">
			{#each learn as t (t.href)}
				<a href={resolve(t.href as Pathname)} class="tile" style="--accent:{t.accent}; --deep:{t.deep};">
					<span class="tile-icon" aria-hidden="true">{t.icon}</span>
					<span class="min-w-0">
						<span class="tile-title">{t.title}</span>
						<span class="tile-desc">{t.desc}</span>
					</span>
				</a>
			{/each}
		</div>
	</div>

	<!-- ── Practice ───────────────────────────────────────────────────────── -->
	<div class="reveal" style="animation-delay: 200ms;">
		{@render sectionHead('🎮', 'Practice', 'use what you know')}
		<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
			{#each practice as t (t.href)}
				<a href={resolve(t.href as Pathname)} class="tile tile--compact" style="--accent:{t.accent}; --deep:{t.deep};">
					<span class="tile-icon" aria-hidden="true">{t.icon}</span>
					<span class="min-w-0">
						<span class="tile-title">{t.title}</span>
						<span class="tile-desc">{t.desc}</span>
					</span>
				</a>
			{/each}
		</div>
	</div>

	<!-- ── Starter phrases (plain links, so the phrasebook is crawlable from here) ── -->
	{#if listedPhrases.length}
		<div>
			{@render sectionHead('💬', `Essential ${content.heading} phrases`, 'with audio')}
			<ul class="phrase-list">
				{#each listedPhrases as p (p.slug)}
					<li>
						<a href={resolve('/[dialect=dialect]/phrases/[phrase]', { dialect, phrase: p.slug ?? '' })} class="phrase">
							<span class="phrase-en">{p.english}</span>
							<span class="phrase-ar" dir="rtl" lang="ar">{p.arabic}</span>
							<span class="phrase-tr">{p.transliteration}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- ── What makes it different ────────────────────────────────────────── -->
	<div>
		{@render sectionHead('💡', `What makes ${short} different`, '')}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each content.features as feature (feature.title)}
				<div class="panel">
					<h3 class="panel-title">{feature.title}</h3>
					<p class="panel-body">{feature.body}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- ── Where it's spoken ──────────────────────────────────────────────── -->
	<div class="panel panel--accent" style="--accent:{accent.accent}; --deep:{accent.deep};">
		{@render sectionHead('🌍', `Where ${content.heading} is spoken`, '')}
		<p class="panel-body">{content.whereSpoken}</p>
	</div>

	<!-- ── Varieties ──────────────────────────────────────────────────────── -->
	{#if varieties.length}
		<div>
			{@render sectionHead('🎙️', `Pick your ${short} accent`, 'same lessons, local voice')}
			<div class="flex flex-wrap gap-2">
				{#each varieties as v (v.key)}
					<a href={resolve(`/${v.slug}` as Pathname)} class="chip">{v.flag} {v.name}</a>
				{/each}
				{#if dialect === 'levantine'}
					<a href={resolve('/levantine-dialects')} class="chip">🎧 Hear all four side by side</a>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ── Grammar ────────────────────────────────────────────────────────── -->
	{#if hasGrammar(dialect) && grammar.length}
		<div>
			{@render sectionHead('📐', `${content.heading} grammar`, 'in plain English')}
			<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
				{#each grammar as topic (topic.slug)}
					<a href={resolve('/grammar/[dialect=dialect]/[slug]', { dialect, slug: topic.slug })} class="tile tile--compact" style="--accent:#10b981; --deep:#047857;">
						<span class="min-w-0">
							<span class="tile-title">{topic.title}</span>
							<span class="tile-desc">{topic.summary}</span>
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Comparisons ────────────────────────────────────────────────────── -->
	{#if comparisons.length}
		<div>
			{@render sectionHead('⚖️', `How ${short} compares`, '')}
			<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
				{#each comparisons as c (c.href)}
					<a href={resolve(c.href as Pathname)} class="tile tile--compact" style="--accent:#0ea5e9; --deep:#0369a1;">
						<span class="tile-title">{c.title}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── FAQ ────────────────────────────────────────────────────────────── -->
	<div>
		{@render sectionHead('❓', 'Common questions', '')}
		<div class="space-y-2.5">
			{#each content.faqs as faq, i (faq.question)}
				<details class="faq" open={i === 0}>
					<summary>{faq.question}</summary>
					<p class="panel-body">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</div>

	<!-- ── Closing call to action ─────────────────────────────────────────── -->
	<div class="closing">
		<h2>{signedIn ? 'Pick up where you left off' : `Start your first ${short} lesson today`}</h2>
		<blockquote class="closing-quote">“{@render quote(closingQuote)}”</blockquote>
		<a bind:this={closingCta} href={resolve(startHref as Pathname)} class="cta" onclick={() => ctaClicked('closing')}>
			{startLabel} <span aria-hidden="true">→</span>
		</a>
	</div>

	<!-- ── Other dialects ─────────────────────────────────────────────────── -->
	<div>
		{@render sectionHead('🗺️', 'Other dialects', '')}
		<div class="flex flex-wrap gap-2">
			{#each otherDialects as other (other.href)}
				<a href={resolve(other.href as Pathname)} class="chip">{other.title}</a>
			{/each}
			<a href={resolve('/arabic-dialects')} class="chip">🎧 All dialects compared</a>
		</div>
		{#if otherVarieties.length}
			<p class="mb-2 mt-4 text-xs font-semibold text-text-200">By country</p>
			<div class="flex flex-wrap gap-2">
				{#each otherVarieties as v (v.key)}
					<a href={resolve(`/${v.slug}` as Pathname)} class="chip">{v.flag} {v.name}</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if showStickyBar}
	<div class="sticky-bar">
		<span class="sticky-text">Learn {content.heading}, free</span>
		<a href={resolve(startHref as Pathname)} class="cta cta--sm" onclick={() => ctaClicked('sticky')}>Start <span aria-hidden="true">→</span></a>
	</div>
{/if}

<style>
	/* Visual language matches the homepage (src/routes/+page.svelte): tile cards with a
	   solid bottom edge, the green press button, pill sub-labels, the reveal animation. */

	/* Hero */
	.hero {
		border-radius: 1.4rem;
		border: 2px solid var(--accent);
		background: color-mix(in srgb, var(--accent) 9%, var(--tile3));
		box-shadow: 0 5px 0 var(--deep);
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
		font-size: clamp(1.9rem, 5vw, 2.75rem);
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
	.proof {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.1rem;
		margin-top: 1.1rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}
	.proof li::before {
		content: '✓ ';
		color: #15803d;
	}
	.hero-quote {
		margin-top: 1.1rem;
		padding-left: 0.85rem;
		border-left: 3px solid var(--accent);
		max-width: 40rem;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--text2);
	}
	.hero-quote :global(strong),
	.closing-quote :global(strong) {
		color: var(--text1);
	}

	/* Buttons */
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
		text-decoration: none;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}
	.cta:hover {
		filter: brightness(1.06);
	}
	.cta:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}
	.cta--sm {
		padding: 0.6rem 1.15rem;
		font-size: 0.9rem;
	}
	.cta-ghost {
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: var(--tile6);
	}
	.cta-ghost:hover {
		text-decoration-color: var(--text1);
	}

	/* Section headings */
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

	/* Tiles */
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem;
		text-decoration: none;
		box-shadow: 0 4px 0 var(--tile5);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}
	.tile:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		box-shadow: 0 8px 0 var(--deep);
	}
	.tile:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep);
	}
	.tile--compact {
		flex-direction: row;
		align-items: center;
		gap: 0.65rem;
		padding: 0.8rem;
	}
	.tile-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
		transition: transform 0.22s ease-out;
	}
	.tile:hover .tile-icon {
		transform: rotate(-3deg) scale(1.05);
	}
	.tile-title {
		display: block;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text1);
	}
	.tile-desc {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text2);
	}

	/* Static panels (same card, no press) */
	.panel,
	.faq {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem;
		box-shadow: 0 4px 0 var(--tile5);
	}
	.panel--accent {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 7%, var(--tile3));
		box-shadow: 0 4px 0 var(--deep);
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

	/* Closing call to action */
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
	.closing-quote {
		max-width: 36rem;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--text2);
	}

	/* Starter phrases */
	.phrase-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.5rem;
	}
	.phrase {
		display: grid;
		grid-template-columns: 1fr auto;
		column-gap: 0.75rem;
		align-items: baseline;
		height: 100%;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.6rem 0.8rem;
		box-shadow: 0 3px 0 var(--tile5);
		transition: border-color 0.18s ease;
	}
	.phrase:hover {
		border-color: var(--tile6);
	}
	.phrase-en {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
	}
	.phrase-ar {
		grid-row: span 2;
		align-self: center;
		font-size: 1.15rem;
		color: var(--text1);
	}
	.phrase-tr {
		font-size: 0.75rem;
		color: var(--text2);
	}

	.chip {
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.4rem 0.95rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text1);
		box-shadow: 0 3px 0 var(--tile5);
		transition: border-color 0.18s ease;
	}
	.chip:hover {
		border-color: var(--tile6);
	}

	/* Mobile sticky bar */
	.sticky-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom));
		border-top: 2px solid var(--tile5);
		background: var(--tile2);
		animation: slide-up 0.25s ease-out;
	}
	.sticky-text {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
	}
	@media (min-width: 768px) {
		.sticky-bar {
			display: none;
		}
	}
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
	}

	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.reveal {
		animation: reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal,
		.sticky-bar {
			animation: none;
		}
		.tile,
		.tile-icon,
		.cta {
			transition: none;
		}
		.tile:hover,
		.tile:hover .tile-icon {
			transform: none;
		}
	}
</style>
