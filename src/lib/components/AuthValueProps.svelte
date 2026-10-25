<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import IncludedFeatures from '$lib/components/IncludedFeatures.svelte';

	interface Props {
		/** Label for the overlay's button, which closes it and puts the cursor in the form. */
		cta: string;
	}

	let { cta }: Props = $props();

	const points = [
		'Seven dialects, from Egyptian and Levantine to Gulf and Moroccan',
		'Step-by-step lessons from your first word, one short lesson a day',
		'Stories with native audio and tap-to-translate',
		"Words that come back right before you'd forget them",
		'Games, verb drills and pronunciation practice'
	];

	function backToForm(close: () => void) {
		close();
		document.getElementById('email')?.focus();
	}
</script>

<div class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-lg p-6">
	<h2 class="text-xl font-bold text-text-300">Learn the Arabic people actually speak</h2>
	<ul class="points">
		{#each points as point (point)}
			<li>{point}</li>
		{/each}
	</ul>
	<IncludedFeatures>
		{#snippet bar(close)}
			<Button type="button" onClick={() => backToForm(close)} className="w-full !py-3 !text-lg">
				{cta}
			</Button>
		{/snippet}
	</IncludedFeatures>
</div>

<style>
	.points {
		margin: 0.9rem 0 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.points li {
		position: relative;
		padding-left: 1.4rem;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--text1);
	}
	.points li::before {
		content: '';
		position: absolute;
		left: 0.2rem;
		top: 0.45rem;
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--brand);
	}
</style>
