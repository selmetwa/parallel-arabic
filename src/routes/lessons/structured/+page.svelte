<script lang="ts">
	// Each track gets its own accent so the grid reads as a set of places to go,
	// not four copies of the same card.
	const dialects = [
		{
			href: '/lessons/structured/egyptian-arabic',
			flag: '🇪🇬',
			label: 'Egyptian Arabic',
			sub: 'Masri',
			note: 'Most widely understood dialect worldwide',
			accent: '#f59e0b',
			deep: '#b45309'
		},
		{
			href: '/lessons/structured/darija',
			flag: '🇲🇦',
			label: 'Moroccan Darija',
			sub: 'Darija',
			note: 'The dialect of North Africa',
			accent: '#f43f5e',
			deep: '#9f1239'
		},
		{
			href: '/lessons/structured/msa',
			flag: '📖',
			label: 'Modern Standard Arabic',
			sub: 'Fusha',
			note: 'Formal Arabic used in media and literature',
			accent: '#8b5cf6',
			deep: '#6d28d9'
		},
		{
			href: '/lessons/structured/levantine',
			flag: '🇱🇧',
			label: 'Levantine Arabic',
			sub: 'Shami',
			note: 'Syria, Lebanon, Jordan and Palestine',
			accent: '#10b981',
			deep: '#047857'
		}
	];
</script>

<section class="page">
	<div class="inner">
		<a href="/lessons" class="back">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
			Lessons
		</a>

		<header class="hero">
			<h1>Structured lessons</h1>
			<p>Designed by professionals.</p>
		</header>

		<!-- Step 1: the alphabet -->
		<div class="step-head">
			<span class="step-num">1</span>
			<h2>Foundation</h2>
			<span class="step-tag">Start here</span>
		</div>

		<a
			href="/lessons/structured/alphabet"
			class="foundation"
			style="--accent:#0ea5e9; --deep:#0369a1;"
		>
			<span class="foundation-icon" aria-hidden="true">✏️</span>
			<span class="foundation-body">
				<span class="foundation-title">Arabic Alphabet</span>
				<span class="foundation-note">
					Master letter forms, vowel marks, and pronunciation — the essential key to every dialect.
				</span>
			</span>
			<span class="foundation-go">
				Start
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</span>
		</a>

		<!-- Step 2: the dialect -->
		<div class="step-head step-head--spaced">
			<span class="step-num">2</span>
			<h2>Choose your dialect</h2>
			<span class="step-tag">Pick one</span>
		</div>

		<div class="grid">
			{#each dialects as d, i (d.href)}
				<a
					href={d.href}
					class="card"
					style="--accent:{d.accent}; --deep:{d.deep}; --delay:{i * 80}ms"
				>
					<span class="card-flag" aria-hidden="true">{d.flag}</span>
					<span class="card-sub">{d.sub}</span>
					<span class="card-name">{d.label}</span>
					<span class="card-note">{d.note}</span>
					<span class="card-go">
						Start Learning
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<style>
	.page {
		min-height: 100vh;
		padding: 1.5rem 1.25rem 5rem;
	}

	.inner {
		max-width: 860px;
		margin: 0 auto;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			color 0.2s ease;
	}
	.back:hover {
		color: var(--text1);
		transform: translateX(-3px);
	}
	.back svg {
		width: 1rem;
		height: 1rem;
	}

	/* Hero */
	.hero {
		margin: 2.5rem 0 3rem;
	}

	.hero h1 {
		font-size: clamp(2.2rem, 6.5vw, 3.4rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.035em;
		color: var(--text1);
	}

	.hero p {
		margin-top: 0.9rem;
		font-size: 1.02rem;
		line-height: 1.55;
		color: var(--text2);
		max-width: 44ch;
	}

	/* Step headings */
	.step-head {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.step-head--spaced {
		margin-top: 3rem;
	}

	.step-num {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 50%;
		background: var(--brand);
		color: #fff;
		font-size: 0.9rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.step-head h2 {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.step-tag {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border-radius: 100px;
		padding: 0.25rem 0.7rem;
	}

	/* Shared "pressable" feel: a solid bottom edge that collapses on click. */
	.foundation,
	.card {
		position: relative;
		text-decoration: none;
		border-radius: 1.25rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		box-shadow: 0 5px 0 var(--tile5);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}

	.foundation:hover,
	.card:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		box-shadow: 0 9px 0 var(--deep);
	}

	.foundation:active,
	.card:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep);
	}

	/* Foundation card */
	.foundation {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		padding: 1.5rem;
	}

	.foundation-icon {
		display: grid;
		place-items: center;
		width: 3.5rem;
		height: 3.5rem;
		flex-shrink: 0;
		font-size: 1.8rem;
		border-radius: 1rem;
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.foundation:hover .foundation-icon {
		transform: rotate(-3deg) scale(1.04);
	}

	.foundation-body {
		flex: 1 1 16rem;
		min-width: 0;
	}

	.foundation-title {
		display: block;
		font-size: 1.3rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.foundation-note {
		display: block;
		margin-top: 0.35rem;
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--text2);
		max-width: 46ch;
	}

	.foundation-go,
	.card-go {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		border-radius: 100px;
		padding: 0.5rem 1.1rem;
		white-space: nowrap;
		transition:
			gap 0.2s ease,
			filter 0.2s ease;
	}

	.foundation:hover .foundation-go,
	.card:hover .card-go {
		gap: 0.65rem;
		filter: brightness(1.08);
	}

	.foundation-go svg,
	.card-go svg {
		width: 0.9rem;
		height: 0.9rem;
	}

	/* Dialect grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 1.4rem;
		animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		animation-delay: var(--delay, 0ms);
	}

	.card-flag {
		font-size: 2rem;
		line-height: 1;
		margin-bottom: 0.75rem;
		transition: transform 0.22s ease-out;
	}

	.card:hover .card-flag {
		transform: rotate(-3deg) scale(1.05);
	}

	.card-sub {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.card-name {
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: var(--text1);
		margin-top: 0.15rem;
	}

	.card-note {
		font-size: 0.84rem;
		line-height: 1.5;
		color: var(--text2);
		margin-top: 0.45rem;
		flex: 1;
	}

	.card-go {
		margin-top: 1.1rem;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 620px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.foundation {
			padding: 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			animation: none;
		}
		.back,
		.foundation,
		.card,
		.card-flag,
		.foundation-icon,
		.foundation-go,
		.card-go {
			transition: none;
		}
		.foundation:hover,
		.card:hover {
			transform: none;
		}
		.card:hover .card-flag,
		.foundation:hover .foundation-icon {
			transform: none;
		}
	}
</style>
