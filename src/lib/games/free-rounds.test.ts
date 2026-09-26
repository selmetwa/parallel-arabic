import { describe, expect, it } from 'vitest';
import { readRoundsUsed, recordRound } from './free-rounds';

function memoryStore() {
	const data = new Map<string, string>();
	return {
		getItem: (k: string) => data.get(k) ?? null,
		setItem: (k: string, v: string) => void data.set(k, v)
	};
}

describe('free rounds', () => {
	it('counts rounds per game', () => {
		const store = memoryStore();
		recordRound(store, 'word-scramble', 'anon');
		recordRound(store, 'word-scramble', 'anon');
		expect(readRoundsUsed(store, 'word-scramble', 'anon')).toBe(2);
	});

	it('keeps games and identities apart', () => {
		const store = memoryStore();
		recordRound(store, 'word-scramble', 'anon');
		expect(readRoundsUsed(store, 'odd-one-out', 'anon')).toBe(0);
		expect(readRoundsUsed(store, 'word-scramble', 'user-1')).toBe(0);
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
		expect(readRoundsUsed(broken, 'word-scramble', 'anon')).toBe(0);
		expect(recordRound(broken, 'word-scramble', 'anon')).toBe(1);
		expect(readRoundsUsed(null, 'word-scramble', 'anon')).toBe(0);
	});
});
