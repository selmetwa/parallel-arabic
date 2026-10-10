import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { LINES_PER_ROUND, buildRound, linesFor, rate } from './shadowing';
import { GAME_DIALECTS } from './themes';

describe('linesFor', () => {
	it.each(GAME_DIALECTS)('has plenty of short recorded lines in %s', (dialect) => {
		const lines = linesFor(dialect);
		expect(lines.length).toBeGreaterThan(100);
		for (const line of lines) {
			expect(line.arabic && line.english && line.transliteration, line.id).toBeTruthy();
			expect(line.arabic.trim().split(/\s+/).length).toBeLessThanOrEqual(8);
		}
	});

	it('points at recordings that exist', () => {
		for (const line of linesFor('egyptian-arabic')) {
			expect(existsSync(join('static', line.audioUrl)), line.audioUrl).toBe(true);
		}
	});
});

describe('buildRound', () => {
	it('picks different lines, avoiding the last round', () => {
		const first = buildRound('levantine');
		expect(first).toHaveLength(LINES_PER_ROUND);
		const next = buildRound('levantine', { avoid: new Set(first.map((l) => l.id)) });
		expect(next.some((l) => first.some((f) => f.id === l.id))).toBe(false);
	});
});

describe('rate', () => {
	it('rates scores in three bands', () => {
		expect(rate(95)).toBe('great');
		expect(rate(60)).toBe('good');
		expect(rate(20)).toBe('again');
	});
});
