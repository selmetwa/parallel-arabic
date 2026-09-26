<script lang="ts">
	import { resolve } from '$app/paths';
	import GameCard from '$lib/components/games/GameCard.svelte';
	import { GAMES, GAMES_HUB_FAQS, QUIZ_CARD, gameHref } from '$lib/constants/games';

	// "Games by skill": every skill a game lists, with the games that train it.
	const cards = [
		...GAMES.map((g) => ({ ...g, href: gameHref(g.slug) })),
		{ ...QUIZ_CARD, href: gameHref(QUIZ_CARD.slug) }
	];
	const bySkill = [...new Set(cards.flatMap((c) => c.skills))].map((skill) => ({
		skill,
		games: cards.filter((c) => c.skills.includes(skill))
	}));
</script>

<section class="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-5">
	<header class="mb-8">
		<h1 class="hero-title">Arabic Games</h1>
		<p class="hero-sub">
			Short games for Arabic vocabulary and grammar in Egyptian Arabic, Levantine, Moroccan Darija
			and Modern Standard Arabic. Every game has two free rounds, with no account needed. Pick one,
			choose your dialect, and play.
		</p>
	</header>

	<div class="grid">
		{#each GAMES as game (game.slug)}
			<GameCard href={gameHref(game.slug)} {...game} />
		{/each}
		<GameCard href={gameHref(QUIZ_CARD.slug)} {...QUIZ_CARD} />
	</div>

	<section class="info">
		<h2 class="section-title">Games by skill</h2>
		<dl class="skills">
			{#each bySkill as { skill, games } (skill)}
				<div class="skill-row">
					<dt>{skill}</dt>
					<dd>
						{#each games as game, i (game.href)}
							<a href={resolve(game.href)}>{game.name}</a>{#if i < games.length - 1},&nbsp;{/if}
						{/each}
					</dd>
				</div>
			{/each}
		</dl>
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

	.skills {
		display: grid;
		gap: 0.5rem;
	}

	.skill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.9rem;
		font-size: 0.9rem;
	}

	.skill-row dt {
		min-width: 7rem;
		font-weight: 600;
		color: var(--text1);
	}

	.skill-row dd {
		color: var(--text2);
	}

	.skill-row a {
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.skill-row a:hover {
		color: var(--brand);
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
