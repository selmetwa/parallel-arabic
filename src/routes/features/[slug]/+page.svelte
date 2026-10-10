<script lang="ts">
	import { resolve } from '$app/paths';
	import FeatureGrid from '$lib/components/features/FeatureGrid.svelte';
	import { FEATURE_LINKS, type FeatureShot } from '$lib/constants/features';

	let { data } = $props();

	const feature = $derived(data.feature);
	// Sections with a screenshot get a row of their own; the rest sit together
	// as a row of short points.
	const shown = $derived(feature.sections.filter((s) => s.shot));
	const points = $derived(feature.sections.filter((s) => !s.shot));
	// Game pages suggest other games; everything else suggests the other tools.
	const others = $derived(
		FEATURE_LINKS.filter(
			(l) => l.href !== `/features/${feature.slug}` && l.group === feature.group
		)
	);
</script>

{#snippet screenshot(shot: FeatureShot, eager = false)}
	<figure class="frame">
		<span class="frame-bar" aria-hidden="true"><i></i><i></i><i></i></span>
		{#if shot.video}
			<!-- Silent screen recordings: muted, so browsers let them autoplay. -->
			<video
				src={shot.video}
				poster={shot.src}
				width={shot.w}
				height={shot.h}
				aria-label={shot.alt}
				autoplay
				muted
				loop
				playsinline
				preload={eager ? 'auto' : 'metadata'}
			></video>
		{:else}
			<img
				src={shot.src}
				width={shot.w}
				height={shot.h}
				alt={shot.alt}
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={eager ? 'high' : 'auto'}
				decoding="async"
			/>
		{/if}
	</figure>
{/snippet}

<article class="feature mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
	<header class="hero">
		<p class="kicker"><a href={resolve('/features')}>Features</a> · {feature.name}</p>
		<h1 class="hero-title">{feature.heading}</h1>
		<p class="lede">{feature.lede}</p>
		<div class="actions">
			<a href={resolve(feature.app.href)} class="cta">
				{feature.app.label} <span aria-hidden="true">→</span>
			</a>
			<a href={resolve('/signup')} class="btn-quiet">Create a free account</a>
		</div>
		{@render screenshot(feature.hero, true)}
	</header>

	{#if shown.length}
		<section class="rows" aria-label="How it works">
			{#each shown as section, i (section.title)}
				<div class="row" class:flip={i % 2 === 1}>
					<div class="row-text">
						<h2 class="h2">{section.title}</h2>
						<p class="body">{section.body}</p>
					</div>
					{#if section.shot}
						{@render screenshot(section.shot)}
					{/if}
				</div>
			{/each}
		</section>
	{/if}

	{#if points.length}
		<section class="points" aria-label="More about {feature.name}">
			{#each points as section (section.title)}
				<div class="point">
					<h2 class="h3">{section.title}</h2>
					<p class="body">{section.body}</p>
				</div>
			{/each}
		</section>
	{/if}

	<section class="faq">
		<h2 class="h2">Common questions</h2>
		<div class="faq-list">
			{#each feature.faqs as faq (faq.question)}
				<details>
					<summary>{faq.question}</summary>
					<p class="body">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="band">
		<h2 class="h2">Try it in your dialect</h2>
		<p class="body">
			Egyptian, Levantine, Moroccan Darija or Modern Standard Arabic. Free to start, no card
			needed.
		</p>
		<div class="actions actions--center">
			<a href={resolve(feature.app.href)} class="cta">
				{feature.app.label} <span aria-hidden="true">→</span>
			</a>
		</div>
	</section>

	<section class="more">
		<h2 class="h2">{feature.group === 'games' ? 'More games' : 'Explore more features'}</h2>
		<FeatureGrid links={others} />
	</section>
</article>

<style>
	.feature {
		padding-block: 3rem 4rem;
	}

	.kicker {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text2);
	}
	.kicker a {
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.hero-title {
		margin-top: 0.75rem;
		max-width: 22ch;
		font-size: clamp(2rem, 1.4rem + 2.6vw, 3.4rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.03em;
		color: var(--text1);
		text-wrap: balance;
	}

	.lede {
		margin-top: 1.1rem;
		max-width: 40rem;
		font-size: 1.15rem;
		line-height: 1.6;
		color: var(--text2);
		text-wrap: pretty;
	}

	.h2 {
		font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2.1rem);
		font-weight: 600;
		line-height: 1.12;
		letter-spacing: -0.02em;
		color: var(--text1);
		text-wrap: balance;
	}

	.h3 {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}

	.body {
		margin-top: 0.6rem;
		font-size: 1.0625rem;
		line-height: 1.65;
		color: var(--text2);
		text-wrap: pretty;
	}

	/* ── Buttons: same shape as /about ─────────────────────────────────── */
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}
	.actions--center {
		justify-content: center;
	}

	.cta {
		--lip: color-mix(in srgb, var(--text1) 70%, #000);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 999px;
		padding: 0.9rem 1.6rem;
		font-weight: 600;
		background: var(--text1);
		color: var(--tile1);
		box-shadow: 0 4px 0 var(--lip);
		transition: transform 0.18s ease;
	}
	.cta:hover {
		transform: translateY(-2px);
	}
	.cta:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--lip);
	}

	.btn-quiet {
		border-radius: 999px;
		border: 2px solid var(--tile6);
		padding: 0.8rem 1.4rem;
		font-weight: 600;
		color: var(--text1);
		transition: border-color 0.2s ease;
	}
	.btn-quiet:hover {
		border-color: var(--text1);
	}

	a:focus-visible,
	summary:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}

	/* ── Screenshots in a window frame ─────────────────────────────────── */
	.frame {
		overflow: hidden;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		box-shadow: 0 24px 48px -24px color-mix(in srgb, var(--text1) 45%, transparent);
	}
	.hero .frame {
		margin-top: 2.5rem;
	}
	.frame-bar {
		display: flex;
		gap: 0.4rem;
		padding: 0.6rem 0.8rem;
		border-bottom: 2px solid var(--tile5);
		background: var(--tile4);
	}
	.frame-bar i {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--tile6);
	}
	.frame img,
	.frame video {
		display: block;
		width: 100%;
		height: auto;
	}

	/* ── Sections ──────────────────────────────────────────────────────── */
	.rows {
		display: grid;
		gap: 4rem;
		margin-top: 5rem;
	}
	.row {
		display: grid;
		gap: 1.5rem;
		align-items: center;
	}
	@media (min-width: 900px) {
		.row {
			grid-template-columns: 2fr 3fr;
			gap: 3rem;
		}
		.row.flip .row-text {
			order: 2;
		}
	}

	.points {
		display: grid;
		gap: 1.5rem;
		margin-top: 4.5rem;
	}
	@media (min-width: 760px) {
		.points {
			grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		}
	}
	.point {
		border-top: 2px solid var(--tile6);
		padding-top: 1rem;
	}

	.faq {
		margin-top: 5rem;
		max-width: 48rem;
	}
	.faq-list {
		display: grid;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	details {
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.2rem;
	}
	summary {
		cursor: pointer;
		font-weight: 600;
		color: var(--text1);
	}

	.band {
		margin-top: 5rem;
		border-radius: 1.5rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 3rem 1.5rem;
		text-align: center;
	}
	.band .body {
		margin-inline: auto;
		max-width: 34rem;
	}

	.more {
		margin-top: 5rem;
	}
	.more .h2 {
		margin-bottom: 1.5rem;
	}
</style>
