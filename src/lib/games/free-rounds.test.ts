import { describe, expect, it } from 'vitest';
import { freeRounds, readRoundsUsed, recordRound } from './free-rounds';

function memoryStore() {
	const data = new Map<string, string>();
	return {
		getItem: (k: string) => data.get(k) ?? null,
		setItem: (k: string, v: string) => void data.set(k, v)
	};
}

describe('free rounds', () => {
	it('shares one count across games', () => {
		const store = memoryStore();
		recordRound(store, 'word-scramble', 'anon');
		recordRound(store, 'odd-one-out', 'anon');
		expect(readRoundsUsed(store, 'memory-pairs', 'anon')).toBe(2);
	});

	it('keeps identities apart', () => {
		const store = memoryStore();
		recordRound(store, 'word-scramble', 'anon');
		expect(readRoundsUsed(store, 'word-scramble', 'user-1')).toBe(0);
	});

	it('keeps scenarios on their own count', () => {
		const store = memoryStore();
		recordRound(store, 'word-scramble', 'anon');
		expect(readRoundsUsed(store, 'scenarios', 'anon')).toBe(0);
		expect(freeRounds('scenarios', false)).toBe(2);
	});

	it('gives accounts more rounds than signed-out visitors', () => {
		expect(freeRounds('quiz', true)).toBeGreaterThan(freeRounds('quiz', false));
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
