<script lang="ts">
	let { data } = $props();

	const dialects = [
		{
			href: '/lessons/structured/egyptian-arabic',
			arabic: 'مصر',
			label: 'Egyptian Arabic',
			sub: 'Masri',
			flag: '🇪🇬',
			note: 'Most widely understood dialect worldwide'
		},
		{
			href: '/lessons/structured/darija',
			arabic: 'المغرب',
			label: 'Moroccan Darija',
			sub: 'Darija',
			flag: '🇲🇦',
			note: 'The dialect of North Africa'
		},
		{
			href: '/lessons/structured/msa',
			arabic: 'الفصحى',
			label: 'Modern Standard Arabic',
			sub: 'Fusha',
			flag: '📖',
			note: 'Formal Arabic used in media and literature'
		},
		{
			href: '/lessons/structured/levantine',
			arabic: 'الشام',
			label: 'Levantine Arabic',
			sub: 'Shami',
			flag: '🇱🇧',
			note: 'Syria, Lebanon, Jordan and Palestine'
		}
	];
</script>

<section class="page">
	<div class="inner">
		<div class="back-link">
			<a href="/lessons">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Lessons
			</a>
		</div>

		<header class="page-header">
			<h1>Structured Lessons</h1>
			<p>Follow a curated path — from alphabet foundations to full dialect fluency.</p>
		</header>

		<div class="section-label">Foundation</div>
		<a href="/lessons/structured/alphabet" class="foundation-card">
			<div class="foundation-glyph" aria-hidden="true">أ</div>
			<div class="foundation-body">
				<div class="badge">Start Here</div>
				<h2>Arabic Alphabet</h2>
				<p>Master letter forms, vowel marks, and pronunciation — the essential key to every dialect.</p>
			</div>
			<div class="foundation-arrow">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<div class="section-label" style="margin-top: 3rem;">Choose Your Dialect</div>
		<div class="grid">
			{#each dialects as d (d.href)}
				<a href={d.href} class="dialect-card" style="--delay: {dialects.indexOf(d) * 80}ms">
					<div class="dialect-watermark" aria-hidden="true">{d.arabic}</div>
					<div class="dialect-body">
						<div class="dialect-top">
							<span class="dialect-flag">{d.flag}</span>
							<span class="dialect-sub">{d.sub}</span>
						</div>
						<h2 class="dialect-name">{d.label}</h2>
						<p class="dialect-note">{d.note}</p>
						<div class="dialect-cta">
							<span>Start Learning</span>
							<svg class="cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>

<style>
	.page {
		min-height: 100vh;
		padding: 2rem 1rem 5rem;
	}

	.inner {
		max-width: 900px;
		margin: 0 auto;
	}

	.back-link a {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text2);
		text-decoration: none;
		transition: color 0.2s;
	}
	.back-link a:hover {
		color: var(--text1);
	}

	.back-link svg {
		width: 1rem;
		height: 1rem;
	}

	.page-header {
		margin-top: 2.5rem;
		margin-bottom: 2.5rem;
	}

	.page-header h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--text1);
		line-height: 1.1;
	}

	.page-header p {
		margin-top: 0.6rem;
		font-size: 1rem;
		color: var(--text2);
		max-width: 42ch;
	}

	.section-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--text3);
		margin-bottom: 1rem;
		border-left: 2px solid var(--brand);
		padding-left: 0.6rem;
	}

	/* Foundation Card */
	.foundation-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		position: relative;
		overflow: hidden;
		background: var(--tile3);
		border-top: 1px solid var(--tile5);
		border-right: 1px solid var(--tile5);
		border-bottom: 1px solid var(--tile5);
		border-left: 3px solid var(--brand);
		border-radius: 1.25rem;
		padding: 2rem 1.75rem;
		text-decoration: none;
		transition:
			transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.25s ease,
			background 0.2s;
	}

	.foundation-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 36px -8px rgba(0, 0, 0, 0.18);
		background: var(--tile4);
	}

	.foundation-glyph {
		font-size: 5rem;
		font-weight: 700;
		color: var(--brand);
		opacity: 0.9;
		line-height: 1;
		flex-shrink: 0;
	}

	.foundation-body {
		flex: 1;
	}

	.badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--brand);
		background: color-mix(in srgb, var(--brand) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent);
		border-radius: 100px;
		padding: 0.2rem 0.65rem;
		margin-bottom: 0.6rem;
	}

	.foundation-body h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text1);
		margin-bottom: 0.4rem;
	}

	.foundation-body p {
		font-size: 0.9rem;
		color: var(--text2);
		line-height: 1.5;
		max-width: 48ch;
	}

	.foundation-arrow {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px solid var(--tile6);
		color: var(--text2);
		transition:
			transform 0.2s,
			border-color 0.2s,
			color 0.2s;
	}

	.foundation-card:hover .foundation-arrow {
		transform: translateX(4px);
		border-color: var(--brand);
		color: var(--brand);
	}

	.foundation-arrow svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	/* Dialect Grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (max-width: 560px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	.dialect-card {
		position: relative;
		overflow: hidden;
		background: var(--tile2);
		border: 1px solid var(--tile4);
		border-radius: 1.25rem;
		text-decoration: none;
		padding: 1.5rem;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		transition:
			transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.25s ease,
			border-color 0.2s;
		animation: appear 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: var(--delay, 0ms);
	}

	.dialect-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.2);
		border-color: var(--tile6);
	}

	.dialect-watermark {
		position: absolute;
		bottom: -0.5rem;
		right: -0.5rem;
		font-size: 6rem;
		font-weight: 700;
		color: var(--text1);
		opacity: 0.04;
		line-height: 1;
		pointer-events: none;
		user-select: none;
		transition: opacity 0.3s;
	}

	.dialect-card:hover .dialect-watermark {
		opacity: 0.08;
	}

	.dialect-body {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.dialect-top {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.9rem;
	}

	.dialect-flag {
		font-size: 1.4rem;
		line-height: 1;
	}

	.dialect-sub {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text3);
	}

	.dialect-name {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text1);
		line-height: 1.2;
		margin-bottom: 0.5rem;
	}

	.dialect-note {
		font-size: 0.82rem;
		color: var(--text2);
		line-height: 1.5;
		flex: 1;
	}

	.dialect-cta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1.2rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--brand);
		transition: gap 0.2s;
	}

	.dialect-card:hover .dialect-cta {
		gap: 0.7rem;
	}

	.cta-arrow {
		width: 1rem;
		height: 1rem;
		transition: transform 0.2s;
	}

	.dialect-card:hover .cta-arrow {
		transform: translateX(3px);
	}

	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dialect-card {
			animation: none;
		}
		.foundation-card,
		.dialect-card,
		.foundation-arrow,
		.dialect-cta,
		.cta-arrow {
			transition: none;
		}
	}
</style>
