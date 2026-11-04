<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { DEMOS } from '$lib/constants/demos';

	let { data } = $props();

	const demo = $derived(data.demo);
	const others = $derived(DEMOS.filter((d) => d.slug !== demo.slug));

	let video = $state<HTMLVideoElement>();

	// Chapter links in the structured data point at ?t=<seconds>.
	$effect(() => {
		const t = Number(page.url.searchParams.get('t'));
		if (video && t > 0) video.currentTime = t;
	});
</script>

<article class="demo mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
	<header class="hero">
		<p class="kicker"><a href={resolve('/demo')}>Demos</a> · {demo.name}</p>
		<h1 class="hero-title">{demo.heading}</h1>
		<p class="lede">{demo.lede}</p>
	</header>

	<figure class="frame">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={video}
			src={demo.video.src}
			poster={demo.video.poster}
			width="1920"
			height="1080"
			controls
			playsinline
			preload="metadata"
			aria-label={demo.heading}
		></video>
	</figure>

	<div class="actions">
		<a href={resolve(demo.app.href)} class="cta">
			{demo.app.label} <span aria-hidden="true">→</span>
		</a>
		<a href={resolve('/signup')} class="btn-quiet">Create a free account</a>
	</div>
	<p class="body">
		<a class="link" href={resolve(`/features/${demo.feature.slug}`)}>{demo.feature.label}</a>
	</p>

	<section class="faq">
		<h2 class="h2">Common questions</h2>
		<div class="faq-list">
			{#each demo.faqs as faq (faq.question)}
				<details>
					<summary>{faq.question}</summary>
					<p class="body">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="more">
		<h2 class="h2">More demos</h2>
		<ul class="more-grid">
			{#each others as other (other.slug)}
				<li>
					<a class="card" href={resolve(`/demo/${other.slug}`)}>
						<img src={other.video.poster} width="1280" height="720" alt="" loading="lazy" decoding="async" />
						<span class="h3">{other.emoji} {other.name} demo</span>
						<span class="card-blurb">{other.blurb}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</article>

<style>
	.demo {
		padding-block: 3rem 4rem;
	}

	.kicker {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text2);
	}
	.kicker a,
	.link {
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.hero-title {
		margin-top: 0.75rem;
		max-width: 24ch;
		font-size: clamp(2rem, 1.4rem + 2.6vw, 3.2rem);
		font-weight: 600;
		line-height: 1.08;
		letter-spacing: -0.03em;
		color: var(--text1);
		text-wrap: balance;
	}

	.lede {
		margin-top: 1.1rem;
		max-width: 44rem;
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
	}

	.h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.body {
		margin-top: 0.5rem;
		font-size: 1.0625rem;
		line-height: 1.65;
		color: var(--text2);
		text-wrap: pretty;
	}

	.frame {
		margin-top: 2.5rem;
		overflow: hidden;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		box-shadow: 0 24px 48px -24px color-mix(in srgb, var(--text1) 45%, transparent);
	}
	.frame video {
		display: block;
		width: 100%;
		height: auto;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.75rem;
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

	.faq {
		margin-top: 4.5rem;
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

	.more {
		margin-top: 4.5rem;
	}
	.more-grid {
		display: grid;
		gap: 1.25rem;
		margin-top: 1.5rem;
	}
	@media (min-width: 760px) {
		.more-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 1024px) {
		.more-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.card {
		display: grid;
		gap: 0.4rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		padding: 0.75rem 0.75rem 1rem;
		transition: border-color 0.2s ease;
	}
	.card:hover {
		border-color: var(--text1);
	}
	.card img {
		width: 100%;
		height: auto;
		border-radius: 0.6rem;
		margin-bottom: 0.4rem;
	}
	.card-blurb {
		color: var(--text2);
		line-height: 1.5;
	}
</style>
