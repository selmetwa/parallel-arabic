import { describe, expect, it } from 'vitest';
import { shuffle, shuffleUntilDifferent } from './shuffle';

/** A seeded generator, so the tests are deterministic. */
function seeded(seed: number) {
	return () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
}

describe('shuffle', () => {
	it('returns a permutation without mutating the input', () => {
		const input = [1, 2, 3, 4, 5, 6];
		const out = shuffle(input, seeded(7));
		expect(input).toEqual([1, 2, 3, 4, 5, 6]);
		expect([...out].sort()).toEqual(input);
	});

	it('is deterministic for an injected random source', () => {
		expect(shuffle([1, 2, 3, 4], seeded(3))).toEqual(shuffle([1, 2, 3, 4], seeded(3)));
	});
});

describe('shuffleUntilDifferent', () => {
	it('never returns the original order when another exists', () => {
		for (let seed = 1; seed < 50; seed++) {
			expect(shuffleUntilDifferent(['a', 'b'], undefined, seeded(seed))).toEqual(['b', 'a']);
		}
	});

	it('terminates on items that cannot be reordered', () => {
		expect(shuffleUntilDifferent(['x', 'x', 'x'])).toEqual(['x', 'x', 'x']);
		expect(shuffleUntilDifferent(['x'])).toEqual(['x']);
	});
});
