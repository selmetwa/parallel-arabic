import { describe, expect, it } from 'vitest';
import { dealBoard, readBest, saveBest } from './word-match';
import type { GameWord } from './word-pool';

const pool: GameWord[] = Array.from({ length: 10 }, (_, i) => ({
	id: String(i),
	arabic: `ع${i}`,
	plain: `ع${i}`,
	english: `word ${i}`,
	transliteration: '',
	audioUrl: null
}));

describe('dealBoard', () => {
	it('deals each word once as Arabic and once as English', () => {
		const { words, cards } = dealBoard(pool, 6);
		expect(words).toHaveLength(6);
		expect(cards).toHaveLength(12);
		for (const w of words) {
			expect(
				cards
					.filter((c) => c.wordId === w.id)
					.map((c) => c.side)
					.sort()
			).toEqual(['ar', 'en']);
		}
	});

	it('avoids the previous board while the pool allows', () => {
		const first = dealBoard(pool, 4);
		const avoid = new Set(first.words.map((w) => w.id));
		const second = dealBoard(pool, 4, { avoid });
		expect(second.words.some((w) => avoid.has(w.id))).toBe(false);
	});

	it('deals what it can from a small pool', () => {
		expect(dealBoard(pool.slice(0, 3), 6).cards).toHaveLength(6);
	});
});

describe('best score', () => {
	it('keeps the lowest move count per board size', () => {
		const data = new Map<string, string>();
		const store = {
			getItem: (k: string) => data.get(k) ?? null,
			setItem: (k: string, v: string) => void data.set(k, v)
		};
		expect(saveBest(store, 'easy', 14)).toBe(true);
		expect(saveBest(store, 'easy', 16)).toBe(false);
		expect(saveBest(store, 'easy', 10)).toBe(true);
		expect(saveBest(store, 'hard', 30)).toBe(true);
		expect(readBest(store)).toEqual({ easy: 10, hard: 30 });
	});
});
