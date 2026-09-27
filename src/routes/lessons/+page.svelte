<script lang="ts">
	import { resolve } from '$app/paths';
	import { trackEvent } from '$lib/analytics';

	const paths = [
		{
			id: 'structured',
			href: '/lessons/structured' as const,
			icon: '🗺️',
			title: 'Structured path',
			note: 'A step-by-step curriculum from the alphabet upwards, one module at a time.',
			pills: ['4 dialects', 'A1 to C2', 'Tracks your progress'],
			cta: 'Explore the curriculum',
			accent: '#0ea5e9',
			deep: '#0369a1'
		},
		{
			id: 'custom',
			href: '/lessons/custom' as const,
			icon: '✨',
			title: 'Custom lessons',
			note: 'Create a lesson on any topic, like food, travel or work, or browse the ones other learners made.',
			pills: ['Any topic', 'Any level', 'Community library'],
			cta: 'Browse lessons',
			accent: '#8b5cf6',
			deep: '#6d28d9'
		}
	];

	const inside = [
		{
			emoji: '🔊',
			title: 'Audio on everything',
			body: 'Hear every word and sentence as often as you need.',
			accent: '#0ea5e9'
		},
		{
			emoji: '🎯',
			title: 'Exercises as you go',
			body: 'Multiple choice and fill-in-the-blank after each topic.',
			accent: '#f59e0b'
		},
		{
			emoji: '🌍',
			title: 'Dialect comparison',
			body: 'See how a phrase changes across all four dialects.',
			accent: '#10b981'
		}
	];
</script>

<section class="page">
	<div class="inner">
		<header class="hero">
			<h1>Lessons</h1>
			<p>Follow a structured path, or make a lesson on any topic, in four Arabic dialects.</p>
		</header>

		<div class="step-head">
			<span class="step-num">1</span>
			<h2>Choose your path</h2>
			<span class="step-tag">Pick one</span>
		</div>

		<div class="paths">
			{#each paths as p, i (p.id)}
				<a
					href={resolve(p.href)}
					class="path"
					style="--accent:{p.accent}; --deep:{p.deep}; --delay:{i * 80}ms"
					onclick={() => trackEvent('lessons_path_selected', { path: p.id })}
				>
					<span class="path-icon" aria-hidden="true">{p.icon}</span>
					<span class="path-title">{p.title}</span>
					<span class="path-note">{p.note}</span>
					<span class="pills">
						{#each p.pills as pill (pill)}
							<span class="pill">{pill}</span>
						{/each}
					</span>
					<span class="path-go">
						{p.cta}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
						</svg>
					</span>
				</a>
			{/each}
		</div>

		<h2 class="how-title">What's in a lesson</h2>
		<div class="how">
			{#each inside as item (item.title)}
				<div class="how-card" style="--accent:{item.accent};">
					<span class="how-emoji" aria-hidden="true">{item.emoji}</span>
					<h3>{item.title}</h3>
					<p>{item.body}</p>
				</div>
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

	/* Hero */
	.hero {
		margin: 1.5rem 0 2.5rem;
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
		max-width: 46ch;
	}

	/* Step heading, as on /lessons/structured and /speak */
	.step-head {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
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

	/* Path cards: pressable, with a solid bottom edge that collapses on click */
	.paths {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.path {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 1.5rem;
		text-decoration: none;
		border-radius: 1.25rem;
		background: var(--tile3);
		border: 2px solid var(--tile5);
		box-shadow: 0 5px 0 var(--tile5);
		animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		animation-delay: var(--delay, 0ms);
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}

	.path:hover {
		transform: translateY(-4px);
		border-color: var(--accent);
		box-shadow: 0 9px 0 var(--deep);
	}

	.path:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--deep);
	}

	.path:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}

	.path-icon {
		display: grid;
		place-items: center;
		width: 3.5rem;
		height: 3.5rem;
		font-size: 1.8rem;
		border-radius: 1rem;
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.path:hover .path-icon {
		transform: rotate(-3deg) scale(1.04);
	}

	.path-title {
		margin-top: 1rem;
		font-size: 1.3rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.path-note {
		margin-top: 0.4rem;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--text2);
		flex: 1;
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 1rem;
	}

	.pill {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text1);
		background: color-mix(in srgb, var(--accent) 16%, var(--tile3));
		border-radius: 100px;
		padding: 0.2rem 0.6rem;
	}

	.path-go {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 1.25rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		border-radius: 100px;
		padding: 0.5rem 1.1rem;
		transition:
			gap 0.2s ease,
			filter 0.2s ease;
	}

	.path:hover .path-go {
		gap: 0.65rem;
		filter: brightness(1.08);
	}

	.path-go svg {
		width: 0.9rem;
		height: 0.9rem;
	}

	/* What's in a lesson, as on /speak */
	.how-title {
		margin: 3rem 0 0.9rem;
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.how {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.how-card {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1.1rem;
		transition:
			transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.2s ease;
	}

	.how-card:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
	}

	.how-emoji {
		display: block;
		font-size: 1.6rem;
		line-height: 1;
	}

	.how-card h3 {
		margin-top: 0.55rem;
		font-size: 0.98rem;
		font-weight: 600;
		color: var(--text1);
	}

	.how-card p {
		margin-top: 0.3rem;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--text2);
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
		.paths,
		.how {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.path {
			animation: none;
		}
		.path,
		.path-icon,
		.path-go,
		.how-card {
			transition: none;
		}
		.path:hover,
		.how-card:hover,
		.path:hover .path-icon {
			transform: none;
		}
	}
</style>
