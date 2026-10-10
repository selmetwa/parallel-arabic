import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { FEATURES, getFeature } from './features';
import { GAMES } from './games';
import { GAME_FEATURES } from './game-features';

describe('game pages and feature pages', () => {
	it('links every game to a feature page that links back', () => {
		for (const game of GAMES) {
			expect(game.feature, game.slug).toBeTruthy();
			const feature = getFeature(game.feature!);
			expect(feature, game.feature).toBeDefined();
			expect(feature!.group, game.feature).toBe('games');
			expect(feature!.app.href, game.feature).toBe(game.path ?? `/learn/game/${game.slug}`);
		}
	});

	it('gives every page its own title and description', () => {
		const titles = [...GAMES.map((g) => g.seo.title), ...FEATURES.map((f) => f.seo.title)];
		const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
		expect(dupes).toEqual([]);
		const descriptions = [
			...GAMES.map((g) => g.seo.description),
			...FEATURES.map((f) => f.seo.description)
		];
		expect(new Set(descriptions).size).toBe(descriptions.length);
		expect(new Set(FEATURES.map((f) => f.slug)).size).toBe(FEATURES.length);
	});

	it('points at screenshots that exist', () => {
		for (const f of FEATURES) {
			const shots = [f.hero, ...f.sections.flatMap((s) => (s.shot ? [s.shot] : []))];
			for (const s of shots) expect(existsSync(join('static', s.src)), s.src).toBe(true);
		}
		for (const g of GAMES) expect(existsSync(join('static', g.shot.src)), g.shot.src).toBe(true);
	});

	it('keeps the per-game pages’ titles and descriptions short enough for search results', () => {
		for (const f of GAME_FEATURES) {
			expect(f.seo.title.length, f.slug).toBeLessThanOrEqual(65);
			expect(f.seo.description.length, f.slug).toBeLessThanOrEqual(160);
		}
	});

	it('keeps "AI" out of the copy, apart from the AI Tutor', () => {
		for (const f of FEATURES.filter((f) => f.group === 'games')) {
			const text = JSON.stringify(f).replace(/AI Tutor/g, '');
			expect(text, f.slug).not.toMatch(/\bAI\b/);
		}
	});
});
