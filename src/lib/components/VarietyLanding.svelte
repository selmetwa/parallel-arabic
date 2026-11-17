<script lang="ts">
	// Landing page for a country variety (/lebanese-arabic, /kuwaiti-arabic, ...).
	// Same visual language as DialectLanding. The course is the parent dialect's;
	// the page says so plainly and shows what changes: voice, tutor, stories.
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { SELECTABLE_DIALECTS, getDialectInfo } from '$lib/constants/dialects';
	import { dialectAccent } from '$lib/constants/dialect-accents';
	import { VARIETIES, getVarietyInfo, varietyKeyWords, type Variety } from '$lib/constants/varieties';
	import { VARIETY_LANDING } from '$lib/constants/variety-landing';
	import { saveVarietyHint } from '$lib/helpers/variety-hint';
	import { trackEvent } from '$lib/analytics';

	interface Props {
		variety: Variety;
		faqs: { question: string; answer: string }[];
	}

	let { variety, faqs }: Props = $props();

	const info = $derived(getVarietyInfo(variety)!);
	const content = $derived(VARIETY_LANDING[variety]);
	const parent = $derived(getDialectInfo(info.dialect));
	const accent = $derived(dialectAccent(info.dialect));
	const lessons = $derived(`/lessons/structured/${info.dialect}`);
	const keyWords = $derived(varietyKeyWords(info));
	const siblings = $derived(VARIETIES.filter((v) => v.dialect === info.dialect && v.key !== variety));
	// Cross-links to every dialect page and the other family's varieties.
	const otherDialects = $derived(
		SELECTABLE_DIALECTS.filter((d) => d !== info.dialect).map((d) => getDialectInfo(d)!)
	);
	const otherVarieties = $derived(VARIETIES.filter((v) => v.dialect !== info.dialect));

	const user = $derived(page.data.user);
	const isCurrent = $derived(
		page.data.targetDialect === info.dialect && page.data.targetVariety === variety
	);

	const howItWorks = $derived([
		{
			icon: '📚',
			title: `${parent?.shortName} lessons`,
			desc: `A structured path from A1 to B2 in ${parent?.name}, the base every ${info.shortName} speaker shares.`,
			href: lessons
		},
		{
			icon: '🗣️',
			title: `A tutor from ${info.city}`,
			desc: `Talk it through with a tutor who speaks ${info.shortName}, in a ${info.shortName} voice, and points out local words as you go.`,
			href: '/tutor'
		},
		{
			icon: '📖',
			title: `Stories in ${info.shortName}`,
			desc: `Stories, sentences and word lists written for you the way people in ${info.city} talk.`,
			href: '/stories'
		}
	]);

	let playing = $state<number | null>(null);
	let audio: HTMLAudioElement | null = null;

	function play(i: number) {
		audio?.pause();
		audio = new Audio(`/audio/varieties/${variety}-${i}.mp3`);
		playing = i;
		audio.onended = () => (playing = null);
		audio.play().catch(() => (playing = null));
		trackEvent('variety_landing_audio_played', { variety, phrase: i });
	}

	let switching = $state(false);
	let switchError = $state('');

	async function switchVariety() {
		switching = true;
		switchError = '';
		trackEvent('variety_landing_cta_clicked', { variety, signed_in: true });
		try {
			const res = await fetch('/api/user-preferences/dialect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dialect: info.dialect, variety })
			});
			if (!res.ok) throw new Error('Failed');
			await goto(resolve(lessons as Pathname), { invalidateAll: true });
		} catch {
			switchError = "Couldn't switch. Try again.";
		} finally {
			switching = false;
		}
	}

	function startSignup() {
		saveVarietyHint(info.dialect, variety);
		trackEvent('variety_landing_cta_clicked', { variety, signed_in: false });
	}
</script>

{#snippet sectionHead(emoji: string, label: string)}
	<div class="sec-head">
		<span class="sec-emoji" aria-hidden="true">{emoji}</span>
		<h2>{label}</h2>
	</div>
{/snippet}

{#snippet cta()}
	{#if !user}
		<a href={resolve(`/signup?next=${encodeURIComponent(lessons)}` as Pathname)} class="cta" onclick={startSignup}>
			Start learning {info.shortName} free <span aria-hidden="true">→</span>
		</a>
	{:else if isCurrent}
		<a href={resolve('/tutor')} class="cta">Talk to your {info.shortName} tutor <span aria-hidden="true">→</span></a>
	{:else}
		<button type="button" class="cta" disabled={switching} onclick={switchVariety}>
			{switching ? 'Switching…' : `Switch to ${info.shortName}`} <span aria-hidden="true">→</span>
		</button>
	{/if}
	{#if switchError}<p class="error" role="alert">{switchError}</p>{/if}
{/snippet}

<section class="mx-auto max-w-6xl space-y-9 px-3 pb-16 pt-6 sm:px-8">
	<header class="hero" style="--accent:{accent.accent}; --deep:{accent.deep};">
		<nav class="hero-eyebrow" aria-label="Breadcrumb">
			<a href={resolve(`/${info.dialect}` as Pathname)} class="crumb">{parent?.flag} {parent?.name}</a>
			<span aria-hidden="true">›</span>
			{info.flag} {info.shortName} · <span dir="rtl" lang="ar">{content.nativeName}</span>
		</nav>
		<h1>Learn {info.name}</h1>
		<p class="hero-tagline">{content.tagline}</p>
		<div class="hero-actions">
			{@render cta()}
			<a href="#hear" class="cta-ghost">Hear it first ↓</a>
		</div>
		<ul class="proof">
			<li>Free to start</li>
			<li>A native {info.shortName} voice</li>
			<li>A tutor who speaks {info.shortName}</li>
		</ul>
	</header>

	<div id="hear" class="scroll-mt-6">
		{@render sectionHead('🔊', `Hear ${info.shortName}`)}
		<ul class="phrase-list">
			{#each content.phrases as phrase, i (phrase.arabic)}
				<li>
					<button
						type="button"
						class="phrase"
						class:is-playing={playing === i}
						onclick={() => play(i)}
						aria-label="Play “{phrase.english}”"
					>
						<span class="phrase-en">{phrase.english}</span>
						<span class="phrase-ar" dir="rtl" lang="ar">{phrase.arabic}</span>
						<span class="phrase-tr">{phrase.transliteration}</span>
						<span class="phrase-play" aria-hidden="true">{playing === i ? '■' : '▶'}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>

	{#if keyWords.length}
		<div>
			{@render sectionHead('📝', `Everyday ${info.shortName} words`)}
			<dl class="words">
				{#each keyWords as w (w.english)}
					<div class="word">
						<dt>{w.english}</dt>
						<dd dir="rtl" lang="ar">{w.arabic}</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/if}

	<div>
		{@render sectionHead('💡', `What makes ${info.shortName} different`)}
		<div class="grid gap-3 sm:grid-cols-3">
			{#each content.features as feature (feature.title)}
				<div class="panel">
					<h3 class="panel-title">{feature.title}</h3>
					<p class="panel-body">{feature.body}</p>
				</div>
			{/each}
		</div>
	</div>

	<div>
		{@render sectionHead('🧭', `How you learn ${info.shortName} here`)}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{#each howItWorks as t (t.href)}
				<a href={resolve(t.href as Pathname)} class="tile" style="--accent:{accent.accent}; --deep:{accent.deep};">
					<span class="tile-icon" aria-hidden="true">{t.icon}</span>
					<span class="min-w-0">
						<span class="tile-title">{t.title}</span>
						<span class="tile-desc">{t.desc}</span>
					</span>
				</a>
			{/each}
		</div>
	</div>

	<div class="panel panel--accent" style="--accent:{accent.accent}; --deep:{accent.deep};">
		{@render sectionHead('🌍', `Where ${info.name} is spoken`)}
		<p class="panel-body">{content.whereSpoken}</p>
	</div>

	<div>
		{@render sectionHead('❓', 'Common questions')}
		<div class="space-y-2.5">
			{#each faqs as faq, i (faq.question)}
				<details class="faq" open={i === 0}>
					<summary>{faq.question}</summary>
					<p class="panel-body">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</div>

	<div class="closing">
		<h2>Start speaking {info.shortName} today</h2>
		{@render cta()}
	</div>

	<div>
		{@render sectionHead('🗺️', `Other ${parent?.shortName} varieties`)}
		<div class="flex flex-wrap gap-2">
			<a href={resolve(`/${info.dialect}` as Pathname)} class="chip">{parent?.flag} {parent?.name}</a>
			{#each siblings as s (s.key)}
				<a href={resolve(`/${s.slug}` as Pathname)} class="chip">{s.flag} {s.name}</a>
			{/each}
		</div>
	</div>

	<div>
		{@render sectionHead('🌍', 'Other dialects')}
		<div class="flex flex-wrap gap-2">
			{#each otherDialects as d (d.key)}
				<a href={resolve(`/${d.key}` as Pathname)} class="chip">{d.flag} {d.name}</a>
			{/each}
			{#each otherVarieties as v (v.key)}
				<a href={resolve(`/${v.slug}` as Pathname)} class="chip">{v.flag} {v.name}</a>
			{/each}
		</div>
	</div>
</section>

<style>
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
		cursor: pointer;
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
	.cta:disabled {
		opacity: 0.7;
		cursor: wait;
	}
	.crumb {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: var(--tile6);
	}
	.crumb:hover {
		text-decoration-color: var(--text1);
	}
	.cta-ghost {
		font-weight: 600;
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: var(--tile6);
	}
	.error {
		font-size: 0.85rem;
		color: #dc2626;
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

	.phrase-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.5rem;
	}
	.phrase {
		display: grid;
		grid-template-columns: 1fr auto auto;
		column-gap: 0.75rem;
		align-items: baseline;
		width: 100%;
		height: 100%;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.6rem 0.8rem;
		box-shadow: 0 3px 0 var(--tile5);
		text-align: left;
		cursor: pointer;
		transition: border-color 0.18s ease;
	}
	.phrase:hover,
	.phrase.is-playing {
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
	.phrase-play {
		grid-column: 3;
		grid-row: 1 / span 2;
		align-self: center;
		font-size: 0.8rem;
		color: var(--text2);
	}

	.words {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0.5rem;
	}
	.word {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		border-radius: 0.9rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.55rem 0.8rem;
	}
	.word dt {
		font-size: 0.8rem;
		color: var(--text2);
	}
	.word dd {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text1);
	}

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
	.tile-icon {
		font-size: 1.5rem;
		line-height: 1;
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

	@media (prefers-reduced-motion: reduce) {
		.tile,
		.cta {
			transition: none;
		}
		.tile:hover {
			transform: none;
		}
	}
</style>
