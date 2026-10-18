<script lang="ts">
	import { FEATURES } from '$lib/constants/features';
</script>

<!-- Everything a subscription includes, as screenshot tiles: behind "See everything included". -->
<p class="trial-dialects">Egyptian, Levantine, Moroccan and MSA all included</p>
<ul class="trial-grid">
	{#each FEATURES as feature (feature.slug)}
		<li class="trial-tile">
			<img
				class="trial-tile-shot"
				src={feature.hero.src}
				width={feature.hero.w}
				height={feature.hero.h}
				alt={feature.hero.alt}
				loading="lazy"
				decoding="async"
			/>
			<span class="trial-tile-name">{feature.name}</span>
			<span class="trial-tile-blurb">{feature.blurb}</span>
		</li>
	{/each}
</ul>

<style>
	.trial-dialects {
		display: inline-block;
		margin: 1rem 0 1.25rem;
		padding: 0.35rem 0.9rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	.trial-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
		margin: 0 0 1.75rem;
		text-align: left;
	}
	@media (min-width: 640px) {
		.trial-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.65rem;
		}
	}
	@media (min-width: 1024px) {
		.trial-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	.trial-tile {
		overflow: hidden;
		padding: 0 0.75rem 0.6rem;
		border-radius: 1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 3px 0 var(--tile5);
	}
	@media (min-width: 640px) {
		.trial-tile {
			padding: 0 0.9rem 0.8rem;
		}
	}

	/* Same screenshots as the /features pages, cropped to the top of the screen. */
	.trial-tile-shot {
		display: block;
		width: calc(100% + 1.5rem);
		max-width: none;
		height: auto;
		aspect-ratio: 16 / 10;
		margin: 0 -0.75rem 0.6rem;
		object-fit: cover;
		object-position: top center;
		border-bottom: 2px solid var(--tile5);
		background: var(--tile4);
	}
	@media (min-width: 640px) {
		.trial-tile-shot {
			width: calc(100% + 1.8rem);
			margin: 0 -0.9rem 0.7rem;
		}
	}

	.trial-tile-name {
		display: block;
		font-size: 0.84rem;
		font-weight: 700;
		line-height: 1.25;
		color: var(--text1);
	}

	/* Phones get name-only tiles so the price stays near the fold. */
	.trial-tile-blurb {
		display: none;
	}
	@media (min-width: 640px) {
		.trial-tile-blurb {
			display: block;
			margin-top: 0.2rem;
			font-size: 0.74rem;
			line-height: 1.4;
			color: var(--text2);
		}
	}
</style>
