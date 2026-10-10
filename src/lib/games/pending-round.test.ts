import { describe, expect, it } from 'vitest';
import { rememberRound, takePendingRound } from './pending-round';
import type { GameWord } from './word-pool';

function memoryStore() {
	const data = new Map<string, string>();
	return {
		getItem: (k: string) => data.get(k) ?? null,
		setItem: (k: string, v: string) => void data.set(k, v),
		removeItem: (k: string) => void data.delete(k)
	};
}

const word = (id: string): GameWord => ({
	id,
	arabic: id,
	plain: id,
	english: id,
	transliteration: id,
	audioUrl: null
});

describe('pending round', () => {
	it('adds rounds up and hands them over once', () => {
		const store = memoryStore();
		rememberRound(store, { xp: 5, words: [word('a')], dialect: 'levantine' }, 0);
		rememberRound(store, { xp: 4, words: [word('a'), word('b')], dialect: 'levantine' }, 10);
		const taken = takePendingRound(store, 20);
		expect(taken?.xp).toBe(9);
		expect(taken?.words.map((w) => w.id)).toEqual(['a', 'b']);
		expect(takePendingRound(store, 30)).toBeNull();
	});

	it('caps XP and words', () => {
		const store = memoryStore();
		const words = Array.from({ length: 25 }, (_, i) => word(String(i)));
		rememberRound(store, { xp: 50, words, dialect: 'fusha' }, 0);
		const taken = takePendingRound(store, 0);
		expect(taken?.xp).toBe(30);
		expect(taken?.words).toHaveLength(20);
	});

	it('drops words from another dialect but keeps the XP', () => {
		const store = memoryStore();
		rememberRound(store, { xp: 3, words: [word('a')], dialect: 'fusha' }, 0);
		rememberRound(store, { xp: 2, words: [word('b')], dialect: 'darija' }, 0);
		const taken = takePendingRound(store, 0);
		expect(taken?.xp).toBe(5);
		expect(taken?.words.map((w) => w.id)).toEqual(['b']);
		expect(taken?.dialect).toBe('darija');
	});

	it('expires after a day', () => {
		const store = memoryStore();
		rememberRound(store, { xp: 3, words: [], dialect: 'fusha' }, 0);
		expect(takePendingRound(store, 25 * 60 * 60 * 1000)).toBeNull();
	});

	it('keeps nothing for an empty round', () => {
		const store = memoryStore();
		rememberRound(store, { xp: 0, words: [], dialect: 'fusha' }, 0);
		expect(takePendingRound(store, 0)).toBeNull();
	});
});
