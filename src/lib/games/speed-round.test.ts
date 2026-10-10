import { describe, expect, it } from 'vitest';
import { buildQuestions, pointsFor } from './speed-round';
import type { GameWord } from './word-pool';

function word(id: number, english: string): GameWord {
	return { id: String(id), arabic: 'ك', plain: 'ك', english, transliteration: '', audioUrl: null };
}

const pool = ['house', 'dog', 'cat', 'bread', 'water', 'tea'].map((e, i) => word(i, e));

describe('buildQuestions', () => {
	it('makes as many questions as asked, with both true and false ones', () => {
		const qs = buildQuestions(pool, 60);
		expect(qs).toHaveLength(60);
		expect(qs.some((q) => q.isTrue)).toBe(true);
		expect(qs.some((q) => !q.isTrue)).toBe(true);
	});

	it('shows the word’s own meaning only when the question is true', () => {
		for (const q of buildQuestions(pool, 100)) {
			expect(q.shown === q.word.english).toBe(q.isTrue);
		}
	});

	it('never uses a synonym as a false meaning', () => {
		const tricky = [word(1, 'to eat'), word(2, 'eat'), word(3, 'dog')];
		for (const q of buildQuestions(tricky, 50)) {
			if (!q.isTrue) expect(q.shown === 'dog' || q.word.english === 'dog').toBe(true);
		}
	});
});

describe('pointsFor', () => {
	it('grows with the streak and caps at 3', () => {
		expect(pointsFor(0)).toBe(1);
		expect(pointsFor(5)).toBe(2);
		expect(pointsFor(10)).toBe(3);
		expect(pointsFor(40)).toBe(3);
	});
});
