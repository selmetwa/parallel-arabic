import type { GameWord } from './word-pool';
import { shuffle, shuffleUntilDifferent } from './shuffle';
import { letterKey } from './arabic-letters';
import { normalizeArabicTextLight } from '$lib/utils/arabic-normalization';

export const WORDS_PER_SET = 5;

export interface Tile {
	id: number;
	char: string;
}

/**
 * Pick a set of words and order them short to long, so each set warms up
 * before the harder words. (Fixed length levels don't work: some themes have
 * almost no six- or seven-letter words.)
 */
export function pickSet(
	pool: GameWord[],
	{
		random = Math.random,
		avoid = new Set<string>()
	}: { random?: () => number; avoid?: Set<string> } = {}
): GameWord[] {
	const shuffled = shuffle(pool, random);
	const fresh = shuffled.filter((w) => !avoid.has(w.id));
	const reused = shuffled.filter((w) => avoid.has(w.id));
	return [...fresh, ...reused]
		.slice(0, WORDS_PER_SET)
		.sort((a, b) => [...a.plain].length - [...b.plain].length);
}

/** The word's letters as tiles, never in the answer's own order. */
export function makeTiles(plain: string, random: () => number = Math.random): Tile[] {
	const tiles = [...plain].map((char, id) => ({ id, char }));
	return shuffleUntilDifferent(tiles, (a, b) => a.char === b.char, random);
}

export function isSolved(built: string, word: GameWord): boolean {
	return normalizeArabicTextLight(built) === normalizeArabicTextLight(word.plain);
}

/** How many letters at the start of `built` are already right. */
export function correctPrefix(built: string, word: GameWord): number {
	const got = [...built];
	const want = [...word.plain];
	let i = 0;
	while (i < got.length && i < want.length && letterKey(got[i]) === letterKey(want[i])) i++;
	return i;
}

/**
 * The unplaced tile a typed letter should pick: the exact letter if there is
 * one, otherwise one in the same group (typing ا can place أ).
 */
export function tileForTyped(tiles: Tile[], placed: number[], key: string): Tile | undefined {
	const free = tiles.filter((t) => !placed.includes(t.id));
	return free.find((t) => t.char === key) ?? free.find((t) => letterKey(t.char) === letterKey(key));
}
