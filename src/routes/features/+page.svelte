<script lang="ts">
	import FeatureGrid from '$lib/components/features/FeatureGrid.svelte';
	import { FEATURE_LINKS } from '$lib/constants/features';

	const tools = FEATURE_LINKS.filter((l) => !l.group);
	const games = FEATURE_LINKS.filter((l) => l.group === 'games');
</script>

<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
	<h1 class="title">Features</h1>
	<p class="lede">
		Everything Parallel Arabic does to help you learn Egyptian, Levantine, Moroccan Darija and
		Modern Standard Arabic: read, listen, speak, write and review.
	</p>
	<div class="grid-wrap">
		<FeatureGrid links={tools} />
	</div>
	<h2 class="group-title">Games</h2>
	<div class="grid-wrap grid-wrap--tight">
		<FeatureGrid links={games} />
	</div>
</section>

<style>
	.title {
		font-size: clamp(2rem, 1.4rem + 2.6vw, 3.2rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		color: var(--text1);
	}

	.lede {
		margin-top: 0.9rem;
		max-width: 40rem;
		font-size: 1.125rem;
		line-height: 1.6;
		color: var(--text2);
	}

	.grid-wrap {
		margin-top: 2.5rem;
	}

	.grid-wrap--tight {
		margin-top: 1rem;
	}

	.group-title {
		margin-top: 3rem;
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
</style>
