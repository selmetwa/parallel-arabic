import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { LINES_PER_ROUND, SHADOW_LEVELS, buildRound, fitsLevel, linesFor, rate } from './shadowing';
import { GAME_DIALECTS } from './themes';

describe('linesFor', () => {
	it.each(GAME_DIALECTS)('has plenty of recorded lines for every level in %s', (dialect) => {
		const lines = linesFor(dialect);
		for (const line of lines) {
			expect(line.arabic && line.english && line.transliteration, line.id).toBeTruthy();
		}
		for (const { value } of SHADOW_LEVELS) {
			expect(lines.filter((l) => fitsLevel(l, value)).length, value).toBeGreaterThan(50);
		}
	});

	it('points at recordings that exist', () => {
		for (const line of linesFor('egyptian-arabic')) {
			expect(existsSync(join('static', line.audioUrl)), line.audioUrl).toBe(true);
		}
	});
});

describe('buildRound', () => {
	it('keeps easy lines short and medium lines longer', () => {
		const words = (s: string) => s.trim().split(/\s+/).length;
		expect(buildRound('darija', 'easy').every((l) => words(l.arabic) <= 3)).toBe(true);
		expect(buildRound('darija', 'medium').every((l) => words(l.arabic) > 3)).toBe(true);
	});

	it('picks different lines, avoiding the last round', () => {
		const first = buildRound('levantine', 'medium');
		expect(first).toHaveLength(LINES_PER_ROUND);
		const next = buildRound('levantine', 'medium', { avoid: new Set(first.map((l) => l.id)) });
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
