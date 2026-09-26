<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	interface Props {
		href: Pathname;
		name: string;
		emoji: string;
		tagline: string;
		skills: string[];
		levels: string;
		accent: string;
		deep: string;
		/** Smaller card for the "more games" strip under a game. */
		compact?: boolean;
	}

	let {
		href,
		name,
		emoji,
		tagline,
		skills,
		levels,
		accent,
		deep,
		compact = false
	}: Props = $props();
</script>

<a href={resolve(href)} class="card" class:compact style="--accent:{accent}; --deep:{deep};">
	<span class="emoji" aria-hidden="true">{emoji}</span>
	<span class="name">{name}</span>
	<span class="tagline">{tagline}</span>
	{#if !compact}
		<span class="meta">
			{#each skills as skill (skill)}
				<span class="skill">{skill}</span>
			{/each}
			<span class="levels">{levels}</span>
		</span>
		<span class="play">Play <span aria-hidden="true">→</span></span>
	{/if}
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		height: 100%;
		padding: 1.1rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		color: inherit;
		text-decoration: none;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}

	.card:hover,
	.card:focus-visible {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow: 0 6px 0 var(--deep);
	}

	.card:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 var(--deep);
	}

	.emoji {
		font-size: 2rem;
		line-height: 1;
		transition: transform 0.22s ease-out;
	}

	.card:hover .emoji {
		transform: rotate(-4deg) scale(1.06);
	}

	.name {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.015em;
		color: var(--text1);
	}

	.tagline {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--text2);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: auto;
		padding-top: 0.35rem;
	}

	.skill,
	.levels {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile4);
		border-radius: 100px;
		padding: 0.18rem 0.55rem;
	}

	.levels {
		background: color-mix(in srgb, var(--accent) 16%, var(--tile3));
		color: var(--text1);
	}

	.play {
		margin-top: 0.4rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text1);
	}

	.card:hover .play {
		color: var(--accent);
	}

	.compact {
		padding: 0.9rem;
	}

	.compact .emoji {
		font-size: 1.5rem;
	}

	.compact .name {
		font-size: 0.95rem;
	}

	.compact .tagline {
		font-size: 0.8rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.card,
		.emoji {
			transition: none;
		}
		.card:hover,
		.card:focus-visible,
		.card:active,
		.card:hover .emoji {
			transform: none;
		}
	}
</style>
