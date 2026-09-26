import { describe, expect, it } from 'vitest';
import { localDay, readRoundsUsed, recordRound } from './free-rounds';

function memoryStore() {
	const data = new Map<string, string>();
	return {
		getItem: (k: string) => data.get(k) ?? null,
		setItem: (k: string, v: string) => void data.set(k, v)
	};
}

describe('free rounds', () => {
	it('counts rounds for the day and resets on a new day', () => {
		const store = memoryStore();
		recordRound(store, 'word-match', 'anon', '2026-09-26');
		recordRound(store, 'word-match', 'anon', '2026-09-26');
		expect(readRoundsUsed(store, 'word-match', 'anon', '2026-09-26')).toBe(2);
		expect(readRoundsUsed(store, 'word-match', 'anon', '2026-09-27')).toBe(0);
	});

	it('keeps games and identities apart', () => {
		const store = memoryStore();
		recordRound(store, 'word-match', 'anon', '2026-09-26');
		expect(readRoundsUsed(store, 'word-guess', 'anon', '2026-09-26')).toBe(0);
		expect(readRoundsUsed(store, 'word-match', 'user-1', '2026-09-26')).toBe(0);
	});

	it('survives storage that throws', () => {
		const broken = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			}
		};
		expect(readRoundsUsed(broken, 'word-match', 'anon', '2026-09-26')).toBe(0);
		expect(recordRound(broken, 'word-match', 'anon', '2026-09-26')).toBe(1);
		expect(readRoundsUsed(null, 'word-match', 'anon', '2026-09-26')).toBe(0);
	});

	it('uses the local calendar day', () => {
		expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
	});
});
