<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import GameCard from '$lib/components/games/GameCard.svelte';
	import { noteGameSignup } from '$lib/games/signup-source';
	import {
		GAMES,
		GAMES_HUB_FAQS,
		GAME_SKILL_GROUPS,
		POPULAR_GAMES,
		QUIZ_CARD,
		gameHref,
		getGame
	} from '$lib/constants/games';
	import { puzzleNumber } from '$lib/games/daily-root';
	import { gameOfTheDay } from '$lib/games/today';
	import {
		DIALECT_OPTIONS,
		initialDialect,
		isGameDialect,
		saveDialect,
		savedDialect,
		type GameDialect
	} from '$lib/games/themes';

	let { data } = $props();

	const todayGame = getGame(gameOfTheDay(puzzleNumber()))!;

	// Picked here and carried into every game link. Links stay plain until the
	// visitor has a dialect of their own, so crawlers see one URL per game.
	const target = untrack(() => data.targetDialect);
	let dialect = $state<GameDialect>(initialDialect(null, target));
	let chosen = $state(isGameDialect(target));
	// A signed-in learner's dialect comes from the header switcher; the saved
	// pick only stands in for visitors without one.
	onMount(() => {
		const saved = savedDialect();
		if (saved && !isGameDialect(target)) {
			dialect = saved;
			chosen = true;
		}
	});
	const query = $derived(chosen ? `?dialect=${dialect}` : '');

	function pickDialect(value: GameDialect) {
		dialect = value;
		chosen = true;
		saveDialect(value);
	}

	const cards = [
		...GAMES.map((g) => ({ ...g, href: gameHref(g.slug) })),
		{ ...QUIZ_CARD, href: gameHref(QUIZ_CARD.slug) }
	];

	const card = (slug: string) => cards.find((c) => c.slug === slug)!;

	const popular = POPULAR_GAMES.map(card);

	// The full grid, split by skill. Every group gets a fair spot on the page,
	// where level sections left the all-level games at the bottom.
	const groups = GAME_SKILL_GROUPS.map((group) => ({ ...group, games: group.games.map(card) }));
</script>

<section class="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-5">
	<header class="mb-6">
		<h1 class="hero-title">Arabic Games</h1>
		<p class="hero-sub">Short games for learning Arabic, in seven dialects. Your first three rounds are free.</p>
	</header>

	<label class="picker">
		<span class="picker-label">Playing in</span>
		<select
			class="picker-select"
			value={dialect}
			onchange={(e) => pickDialect(e.currentTarget.value as GameDialect)}
		>
			{#each DIALECT_OPTIONS as option (option.value)}
				<option value={option.value}>{option.emoji} {option.label}</option>
			{/each}
		</select>
	</label>

	<a href="{resolve('/learn/game/today')}{query}" class="today">
		<span class="today-emoji" aria-hidden="true">📅</span>
		<span class="today-text">
			<span class="today-title">Today’s challenge</span>
			<span class="today-desc">Daily Root + {todayGame.name}. About three minutes; keeps your streak going.</span>
		</span>
		<span class="today-play">Play now <span aria-hidden="true">→</span></span>
	</a>
	<p class="today-alt">
		Just the word puzzle? <a href="{resolve('/learn/game/daily-root')}{query}">Play Daily Root</a>
	</p>

	<section class="level">
		<h2 class="section-title">Popular games</h2>
		<p class="level-note">New to Arabic? Start with Letter Hunt, then Word Scramble.</p>
		<div class="grid">
			{#each popular as game (game.slug)}
				<GameCard {...game} {query} />
			{/each}
		</div>
	</section>

	{#if !page.data.user}
		<div class="join">
			<p class="join-text">
				<span class="join-title">Earn XP and keep a daily streak</span>
				<span class="join-desc">
					A free account saves every word you miss to a review deck and gives you five more
					rounds.
				</span>
			</p>
			<a
				href="{resolve('/signup')}?next={encodeURIComponent('/learn/game')}"
				class="join-cta"
				onclick={() => noteGameSignup('hub', 'hub')}
			>
				Create a free account
			</a>
		</div>
	{/if}

	{#each groups as group (group.id)}
		<section class="level">
			<h2 class="section-title">{group.title}</h2>
			<p class="level-note">{group.note}</p>
			<div class="grid">
				{#each group.games as game (game.slug)}
					<GameCard {...game} {query} />
				{/each}
			</div>
		</section>
	{/each}

	<section class="info">
		<h2 class="section-title">About these games</h2>
		<p class="about">
			Short games for Arabic vocabulary and grammar in Egyptian Arabic, Levantine, Moroccan Darija,
			Iraqi, Gulf, Saudi and Modern Standard Arabic. Your first three rounds are free, with no account needed. Pick one,
			choose your dialect, and play.
		</p>
	</section>

	<section class="info">
		<h2 class="section-title">Common questions</h2>
		<div class="faqs">
			{#each GAMES_HUB_FAQS as faq (faq.question)}
				<div class="faq">
					<h3>{faq.question}</h3>
					<p>{faq.answer}</p>
				</div>
			{/each}
		</div>
	</section>

	<nav class="footer-nav">
		<a href={resolve('/vocabulary')}>Browse the vocabulary</a>
		<span aria-hidden="true">·</span>
		<a href={resolve('/alphabet')}>Learn the alphabet</a>
		<span aria-hidden="true">·</span>
		<a href={resolve('/stories')}>Read a story</a>
	</nav>
</section>

<style>
	.picker {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.9rem;
	}

	.picker-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
	}

	.picker-select {
		min-height: 2.5rem;
		padding: 0.4rem 0.75rem;
		border-radius: 100px;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
	}

	.picker-select:hover {
		border-color: var(--tile6);
	}

	.today {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.9rem 1.1rem;
		border-radius: 1.25rem;
		border: 2px solid #22c55e;
		background: color-mix(in srgb, #22c55e 10%, var(--tile3));
		padding: 1.25rem 1.3rem;
		box-shadow: 0 5px 0 #15803d;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.18s ease;
	}
	.today:hover {
		transform: translateY(-2px);
		box-shadow: 0 7px 0 #15803d;
	}
	.today:active {
		transform: translateY(3px);
		box-shadow: 0 2px 0 #15803d;
	}
	.today-emoji {
		font-size: 2.2rem;
	}
	.today-text {
		flex: 1;
		min-width: 12rem;
	}
	.today-title {
		display: block;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text1);
	}
	.today-desc {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.9rem;
		color: var(--text2);
	}
	.today-play {
		border-radius: 100px;
		background: #22c55e;
		color: #fff;
		font-weight: 600;
		padding: 0.6rem 1.2rem;
		white-space: nowrap;
	}

	.today-alt {
		margin-top: 0.6rem;
		font-size: 0.85rem;
		color: var(--text2);
	}
	.today-alt a {
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.today-alt a:hover {
		color: var(--brand);
	}

	.join {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.1rem;
		margin-top: 2rem;
		border-radius: 1.25rem;
		border: 2px dashed var(--tile6);
		background: var(--tile3);
		padding: 1rem 1.3rem;
	}
	.join-text {
		flex: 1;
		min-width: 12rem;
	}
	.join-title {
		display: block;
		font-weight: 600;
		color: var(--text1);
	}
	.join-desc {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.9rem;
		color: var(--text2);
	}
	.join-cta {
		border-radius: 100px;
		border: 2px solid var(--tile6);
		background: var(--tile4);
		color: var(--text1);
		font-weight: 600;
		padding: 0.55rem 1.1rem;
		white-space: nowrap;
	}
	.join-cta:hover {
		border-color: var(--brand);
	}

	.level {
		margin-top: 2.5rem;
	}

	.level .section-title {
		margin-bottom: 0.2rem;
	}

	.level-note {
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: var(--text2);
	}

	.about {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text2);
		max-width: 62ch;
	}

	@media (prefers-reduced-motion: reduce) {
		.today {
			transition: none;
		}
		.today:hover,
		.today:active {
			transform: none;
		}
	}

	.hero-title {
		font-size: clamp(2.2rem, 7vw, 3.2rem);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.035em;
		color: var(--text1);
	}

	.hero-sub {
		margin-top: 0.85rem;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--text2);
		max-width: 62ch;
	}

	.grid {
		display: grid;
		gap: 0.8rem;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
	}

	.info {
		margin-top: 3rem;
	}

	.section-title {
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		color: var(--text1);
		margin-bottom: 1rem;
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
		font-size: 0.98rem;
		font-weight: 600;
		color: var(--text1);
	}

	.faq p {
		margin-top: 0.35rem;
		font-size: 0.86rem;
		line-height: 1.55;
		color: var(--text2);
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
</style>
