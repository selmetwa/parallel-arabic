import { describe, expect, it } from 'vitest';
import {
	LAUNCH_DAY,
	isSolved,
	makeTiles,
	markGuess,
	puzzleNumber,
	rootIndex,
	shareText
} from './daily-root';
import { ROOT_COUNT, puzzleFor } from '$lib/server/games/daily-root';

describe('puzzleNumber', () => {
	it('is 1 on launch day and counts up a day at a time', () => {
		expect(puzzleNumber(LAUNCH_DAY + 1000)).toBe(1);
		expect(puzzleNumber(LAUNCH_DAY + 86_400_000 * 5 + 1000)).toBe(6);
	});
});

describe('rootIndex', () => {
	it('visits every root once per cycle', () => {
		const seen = new Set(Array.from({ length: ROOT_COUNT }, (_, i) => rootIndex(i + 1, ROOT_COUNT)));
		expect(seen.size).toBe(ROOT_COUNT);
	});
});

describe('the roots', () => {
	it('gives every day four or five words, spelled with Arabic letters only', () => {
		for (let n = 1; n <= ROOT_COUNT; n++) {
			const p = puzzleFor(n);
			expect(p.words.length, p.root).toBeGreaterThanOrEqual(4);
			expect(p.words.length, p.root).toBeLessThanOrEqual(5);
			for (const w of p.words) {
				expect(w.plain, `${p.root} ${w.arabic}`).toMatch(/^[ء-ي]{2,10}$/);
				expect(w.transliteration, w.arabic).toMatch(/^[a-z0-9' -]+$/);
				expect(w.english).toBeTruthy();
			}
		}
	});

	it('builds every word of a regular root from its three letters', () => {
		const weak = /[اويءأؤئى]/;
		for (let n = 1; n <= ROOT_COUNT; n++) {
			const p = puzzleFor(n);
			const letters = p.root.split(' ');
			// Doubled roots and roots with و, ي or a hamza change shape in derived words.
			if (letters[1] === letters[2] || letters.some((l) => weak.test(l))) continue;
			for (const w of p.words) {
				for (const l of letters) expect(w.plain, `${p.root}: ${w.arabic}`).toContain(l);
			}
		}
	});
});

describe('markGuess', () => {
	it('marks right places, wrong places and misses', () => {
		expect(markGuess('مكتب', 'مكتب')).toEqual(['hit', 'hit', 'hit', 'hit']);
		expect(markGuess('كتمب', 'مكتب')).toEqual(['near', 'near', 'near', 'hit']);
		expect(markGuess('مكتو', 'مكتب')).toEqual(['hit', 'hit', 'hit', 'miss']);
	});

	it('counts a repeated letter only as often as the answer has it', () => {
		expect(markGuess('تتتب', 'كتاب')).toEqual(['miss', 'hit', 'miss', 'hit']);
	});

	it('treats ة as ه, like the rest of the app', () => {
		expect(isSolved('مدرسه', 'مدرسة')).toBe(true);
	});
});

describe('makeTiles', () => {
	it('holds the word’s letters plus two decoys', () => {
		const tiles = makeTiles('مكتبة');
		expect(tiles).toHaveLength(7);
		for (const ch of 'مكتبة') expect(tiles.some((t) => t.char === ch)).toBe(true);
	});
});

describe('shareText', () => {
	it('shows one square per clue', () => {
		const text = shareText(puzzleFor(1), [1, 2, 3, null, 1], 'https://x');
		expect(text).toContain('🟩🟨🟧⬛🟩');
		expect(text).toContain('#1');
	});
});
