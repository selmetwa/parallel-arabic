<script lang="ts" module>
	export interface Picker {
		id: string;
		label: string;
		value: string;
		options: { value: string; label: string; emoji?: string }[];
		onChange: (value: string) => void;
	}
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import GameCard from './GameCard.svelte';
	import { GAMES, QUIZ_CARD, gameHref, type GameInfo } from '$lib/constants/games';
	import { DIALECT_OPTIONS, type GameDialect } from '$lib/games/themes';

	interface Props {
		game: GameInfo;
		dialect: GameDialect;
		onDialectChange: (dialect: GameDialect) => void;
		/** Theme, board size, level — rendered as chip rows under the dialect. */
		pickers?: Picker[];
		/** Short status shown beside the heading, e.g. "2 of 3 free rounds left today". */
		status?: string;
		modal: 'auth' | 'paywall' | null;
		onCloseModal: () => void;
		children: Snippet;
	}

	let {
		game,
		dialect,
		onDialectChange,
		pickers = [],
		status,
		modal,
		onCloseModal,
		children
	}: Props = $props();

	const otherGames = $derived(GAMES.filter((g) => g.slug !== game.slug));
</script>

{#snippet chipRow(
	id: string,
	label: string,
	value: string,
	options: { value: string; label: string; emoji?: string }[],
	onChange: (value: string) => void
)}
	<div class="picker">
		<span class="picker-label" id="picker-{id}">{label}</span>
		<div class="chips" role="group" aria-labelledby="picker-{id}">
			{#each options as option (option.value)}
				<button
					type="button"
					class="chip"
					class:is-on={option.value === value}
					aria-pressed={option.value === value}
					onclick={() => onChange(option.value)}
				>
					{#if option.emoji}<span aria-hidden="true">{option.emoji}</span>{/if}
					{option.label}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<section
	class="shell mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-5"
	style="--accent:{game.accent}; --deep:{game.deep};"
>
	<a href={resolve('/learn/game')} class="back">← All games</a>

	<header class="head">
		<div class="title-row">
			<span class="emoji" aria-hidden="true">{game.emoji}</span>
			<h1>{game.heading}</h1>
		</div>
		<p class="intro">{game.intro}</p>
		{#if status}
			<p class="status">{status}</p>
		{/if}
	</header>

	<div class="controls">
		{@render chipRow('dialect', 'Dialect', dialect, DIALECT_OPTIONS, (value) =>
			onDialectChange(value as GameDialect)
		)}
		{#each pickers as picker (picker.id)}
			{@render chipRow(picker.id, picker.label, picker.value, picker.options, picker.onChange)}
		{/each}
	</div>

	<div class="play-area">
		{@render children()}
	</div>

	<section class="info">
		<h2>How to play</h2>
		<ol class="steps">
			{#each game.howToPlay as step, i (i)}
				<li>{step}</li>
			{/each}
		</ol>
	</section>

	<section class="info">
		<h2>Common questions</h2>
		<div class="faqs">
			{#each game.faqs as faq (faq.question)}
				<div class="faq">
					<h3>{faq.question}</h3>
					<p>{faq.answer}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="info">
		<h2>More games</h2>
		<div class="more">
			{#each otherGames as other (other.slug)}
				<GameCard href={gameHref(other.slug)} {...other} compact />
			{/each}
			<GameCard href={gameHref(QUIZ_CARD.slug)} {...QUIZ_CARD} compact />
		</div>
	</section>

	<nav class="footer-nav">
		<a href={resolve('/learn/game')}>All games</a>
		<span aria-hidden="true">·</span>
		<a href={resolve('/vocabulary')}>Browse the vocabulary</a>
		<span aria-hidden="true">·</span>
		<a href={resolve('/alphabet')}>Learn the alphabet</a>
	</nav>
</section>

<AuthModal isOpen={modal === 'auth'} handleCloseModal={onCloseModal} />
<PaywallModal isOpen={modal === 'paywall'} handleCloseModal={onCloseModal} />

<style>
	.back {
		display: inline-block;
		margin-bottom: 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		transition: color 0.2s ease;
	}
	.back:hover {
		color: var(--brand);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.emoji {
		font-size: clamp(2rem, 6vw, 2.6rem);
		line-height: 1;
	}

	h1 {
		font-size: clamp(1.9rem, 6vw, 2.7rem);
		font-weight: 600;
		line-height: 1.08;
		letter-spacing: -0.035em;
		color: var(--text1);
	}

	.intro {
		margin-top: 0.8rem;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--text2);
		max-width: 62ch;
	}

	.status {
		display: inline-block;
		margin-top: 0.85rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text1);
		background: color-mix(in srgb, var(--accent) 16%, var(--tile3));
		border-radius: 100px;
		padding: 0.3rem 0.8rem;
	}

	.controls {
		display: grid;
		gap: 0.85rem;
		margin-top: 1.75rem;
	}

	.picker-label {
		display: block;
		margin-bottom: 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 2.5rem;
		padding: 0.45rem 0.85rem;
		border-radius: 100px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text2);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.18s ease,
			border-color 0.18s ease,
			color 0.18s ease;
	}

	.chip:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
		color: var(--text1);
	}

	.chip.is-on {
		color: var(--text1);
		font-weight: 600;
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, var(--tile3));
	}

	.play-area {
		margin-top: 1.75rem;
	}

	.info {
		margin-top: 3rem;
	}

	.info h2 {
		font-size: 1.3rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
		margin-bottom: 0.9rem;
	}

	.steps {
		display: grid;
		gap: 0.55rem;
		counter-reset: step;
	}

	.steps li {
		counter-increment: step;
		position: relative;
		padding-left: 2.3rem;
		font-size: 0.92rem;
		line-height: 1.55;
		color: var(--text2);
	}

	.steps li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: 0;
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.faqs {
		display: grid;
		gap: 0.6rem;
	}

	.faq {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem;
	}

	.faq h3 {
		font-size: 0.96rem;
		font-weight: 600;
		color: var(--text1);
	}

	.faq p {
		margin-top: 0.35rem;
		font-size: 0.86rem;
		line-height: 1.55;
		color: var(--text2);
	}

	.more {
		display: grid;
		gap: 0.65rem;
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
	}

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		align-items: center;
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		border-top: 2px solid var(--tile5);
		font-size: 0.85rem;
		color: var(--text2);
	}
	.footer-nav a {
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.footer-nav a:hover {
		color: var(--brand);
	}

	@media (prefers-reduced-motion: reduce) {
		.chip {
			transition: none;
		}
		.chip:hover {
			transform: none;
		}
	}
</style>
