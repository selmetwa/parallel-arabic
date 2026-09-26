import { describe, expect, it } from 'vitest';
import { keysForTyped, letterKey } from './arabic-letters';
import { correctPrefix, isSolved, makeTiles, pickSet, tileForTyped } from './word-scramble';
import type { GameWord } from './word-pool';

const word = (plain: string, id = plain): GameWord => ({
	id,
	arabic: plain,
	plain,
	english: id,
	transliteration: '',
	audioUrl: null
});

describe('letterKey', () => {
	it('groups the letter variants learners treat as one', () => {
		expect(['أ', 'إ', 'آ'].map(letterKey)).toEqual(['ا', 'ا', 'ا']);
		expect(letterKey('ة')).toBe('ه');
		expect(letterKey('ى')).toBe('ي');
		expect(['ئ', 'ؤ'].map(letterKey)).toEqual(['ء', 'ء']);
	});

	it('reads physical key presses', () => {
		expect(keysForTyped('لا')).toEqual(['ل', 'ا']);
		expect(keysForTyped('أ')).toEqual(['ا']);
		expect(keysForTyped('a')).toEqual([]);
		expect(keysForTyped('Shift')).toEqual([]);
	});
});

describe('word scramble', () => {
	it('deals every letter as a tile, never already in order', () => {
		for (let i = 0; i < 30; i++) {
			const tiles = makeTiles('كتاب');
			expect(tiles.map((t) => t.char).sort()).toEqual([...'كتاب'].sort());
			expect(tiles.map((t) => t.char).join('')).not.toBe('كتاب');
		}
	});

	it('ramps each set from short words to long ones', () => {
		const pool = ['سمكة', 'قط', 'مدرسة', 'بيت', 'كتاب', 'طاولة', 'شباك'].map((w) => word(w));
		const lengths = pickSet(pool).map((w) => [...w.plain].length);
		expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
	});

	it('checks answers and finds the correct prefix', () => {
		expect(isSolved('مدرسة', word('مدرسة'))).toBe(true);
		expect(isSolved('مدرسه', word('مدرسة'))).toBe(true);
		expect(correctPrefix('مدسر', word('مدرسة'))).toBe(2);
	});

	it('picks the tile for a typed letter, exact first', () => {
		const tiles = [
			{ id: 0, char: 'ا' },
			{ id: 1, char: 'أ' }
		];
		expect(tileForTyped(tiles, [], 'أ')?.id).toBe(1);
		expect(tileForTyped(tiles, [1], 'أ')?.id).toBe(0);
		expect(tileForTyped(tiles, [0, 1], 'ا')).toBeUndefined();
	});
});
