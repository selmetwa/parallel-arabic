import { describe, expect, it } from 'vitest';
import { GAMES, GAMES_HUB_FAQS, QUIZ_CARD, getGame } from './games';
import { QUIZ_FAQS } from './game-content';
import { GAME_DIALECTS, GAME_THEMES, themesFor } from '$lib/games/themes';
import { sections } from './sections';
import { levantineSections } from './levantine-sections';
import { darijaSections } from './darija-sections';
import { fushaSections } from './fusha-sections';

const allCopy = () =>
	[
		...GAMES.flatMap((g) => [
			g.name,
			g.heading,
			g.tagline,
			g.intro,
			g.seo.title,
			g.seo.description,
			...g.howToPlay,
			...g.faqs.flatMap((f) => [f.question, f.answer])
		]),
		QUIZ_CARD.tagline,
		...GAMES_HUB_FAQS.flatMap((f) => [f.question, f.answer]),
		...QUIZ_FAQS.flatMap((f) => [f.question, f.answer])
	].join('\n');

describe('games config', () => {
	it('uses unique kebab-case slugs that getGame finds', () => {
		const slugs = GAMES.map((g) => g.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		for (const slug of slugs) {
			expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
			expect(getGame(slug)?.slug).toBe(slug);
		}
		// These are real routes of their own, not games.
		expect(slugs).not.toContain('quiz');
		expect(slugs).not.toContain('play');
	});

	it('gives every game enough page copy', () => {
		for (const game of GAMES) {
			expect(game.howToPlay.length, game.slug).toBeGreaterThanOrEqual(3);
			expect(game.faqs.length, game.slug).toBeGreaterThanOrEqual(3);
			expect(game.seo.title.length, game.slug).toBeLessThanOrEqual(65);
			expect(game.seo.description.length, game.slug).toBeLessThanOrEqual(160);
		}
	});

	it('never repeats an FAQ question across the hub, the quiz and the games', () => {
		const questions = [...GAMES_HUB_FAQS, ...QUIZ_FAQS, ...GAMES.flatMap((g) => g.faqs)].map(
			(f) => f.question
		);
		expect(new Set(questions).size).toBe(questions.length);
	});

	it('keeps "AI" out of user-facing copy', () => {
		expect(allCopy()).not.toMatch(/\bAI\b|generat|\bsmart\b/i);
	});
});

describe('game themes', () => {
	const categories: Record<string, string[]> = {
		'egyptian-arabic': sections.map((s) => s.path),
		levantine: levantineSections.map((s) => s.path),
		darija: darijaSections.map((s) => s.path),
		fusha: fushaSections.map((s) => s.path)
	};

	it('only points at categories that exist for the dialect', () => {
		for (const theme of GAME_THEMES) {
			for (const [dialect, category] of Object.entries(theme.categories)) {
				expect(categories[dialect], `${theme.id}/${dialect}`).toContain(category);
			}
		}
	});

	it('offers every dialect at least five themes', () => {
		for (const dialect of GAME_DIALECTS) {
			expect(themesFor(dialect).length, dialect).toBeGreaterThanOrEqual(5);
		}
	});
});
