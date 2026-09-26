<script lang="ts">
	import { resolve } from '$app/paths';
	import type { FeatureLink } from '$lib/constants/features';

	interface Props {
		links: FeatureLink[];
	}

	let { links }: Props = $props();
</script>

<ul class="grid">
	{#each links as link (link.href)}
		<li>
			<a href={resolve(link.href)} class="card">
				<span class="emoji" aria-hidden="true">{link.emoji}</span>
				<span class="name">{link.name}</span>
				<span class="blurb">{link.blurb}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.9rem;
	}

	.card {
		display: flex;
		height: 100%;
		flex-direction: column;
		gap: 0.35rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1.1rem 1.2rem;
		box-shadow: 0 3px 0 var(--tile5);
		transition:
			transform 0.18s ease,
			border-color 0.18s ease;
	}
	.card:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
	}
	.card:focus-visible {
		outline: 2px solid var(--text1);
		outline-offset: 3px;
	}

	.emoji {
		font-size: 1.5rem;
		line-height: 1;
	}

	.name {
		margin-top: 0.35rem;
		font-weight: 600;
		color: var(--text1);
	}

	.blurb {
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--text2);
	}
</style>
