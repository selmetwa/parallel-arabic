<script lang="ts">
	import { resolve } from '$app/paths';
	import { DEMOS } from '$lib/constants/demos';
</script>

<article class="demos mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
	<header>
		<h1 class="title">See Parallel Arabic in action</h1>
		<p class="lede">
			Half-minute walkthroughs recorded in the app: reading a story, playing a game and taking a lesson.
		</p>
	</header>

	<ul class="grid">
		{#each DEMOS as demo, i (demo.slug)}
			<li>
				<a class="card" href={resolve(`/demo/${demo.slug}`)}>
					<img
						src={demo.video.poster}
						width="1280"
						height="720"
						alt=""
						loading={i === 0 ? 'eager' : 'lazy'}
						decoding="async"
					/>
					<h2 class="h3">{demo.emoji} {demo.name} demo</h2>
					<p class="blurb">{demo.blurb}</p>
				</a>
			</li>
		{/each}
	</ul>
</article>

<style>
	.demos {
		padding-block: 3rem 4rem;
	}

	.title {
		font-size: clamp(2rem, 1.4rem + 2.6vw, 3.2rem);
		font-weight: 600;
		line-height: 1.08;
		letter-spacing: -0.03em;
		color: var(--text1);
	}

	.lede {
		margin-top: 1rem;
		max-width: 40rem;
		font-size: 1.15rem;
		line-height: 1.6;
		color: var(--text2);
	}

	.grid {
		display: grid;
		gap: 1.25rem;
		margin-top: 2.5rem;
	}
	@media (min-width: 760px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.card {
		display: grid;
		gap: 0.4rem;
		height: 100%;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile2);
		padding: 0.75rem 0.75rem 1rem;
		transition: border-color 0.2s ease;
	}
	.card:hover {
		border-color: var(--text1);
	}
	.card:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}
	.card img {
		width: 100%;
		height: auto;
		border-radius: 0.6rem;
		margin-bottom: 0.4rem;
	}

	.h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text1);
	}

	.blurb {
		color: var(--text2);
		line-height: 1.5;
	}
</style>
