import { shuffle } from './shuffle';
import { letterKey } from './arabic-letters';

export const MAX_TRIES = 3;
/** Day 1 of the puzzle; the number in the share text counts from here. */
export const LAUNCH_DAY = Date.UTC(2026, 9, 10);
const DAY_MS = 24 * 60 * 60 * 1000;
/** Pattern letters that turn up in derived words; two are added to each set of tiles as decoys. */
const DECOYS = ['ا', 'و', 'ي', 'م', 'ت', 'ن', 'ة', 'س'];

export interface RootWord {
	arabic: string;
	/** Letters only: what the tiles spell. */
	plain: string;
	transliteration: string;
	english: string;
}

export interface RootPuzzle {
	/** 1 on launch day, 2 the day after… */
	number: number;
	root: string;
	meaning: string;
	words: RootWord[];
}

export type Mark = 'hit' | 'near' | 'miss';

export interface Tile {
	id: number;
	char: string;
}

/** Days since launch, counting the launch day as puzzle 1. */
export function puzzleNumber(now: number = Date.now()): number {
	return Math.max(1, Math.floor((now - LAUNCH_DAY) / DAY_MS) + 1);
}

/**
 * Which root a puzzle number gets. Steps through the list by a stride that
 * shares no factor with its length, so every root comes up once per cycle and
 * neighbouring days don't get neighbouring (often related) roots.
 */
export function rootIndex(number: number, count: number): number {
	let stride = Math.max(1, Math.floor(count / 3));
	const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
	while (gcd(stride, count) !== 1) stride++;
	return ((number - 1) * stride) % count;
}

/** The word's letters plus two decoys, shuffled. */
export function makeTiles(plain: string, random: () => number = Math.random): Tile[] {
	const letters = [...plain];
	const decoys = shuffle(
		DECOYS.filter((d) => !letters.includes(d)),
		random
	).slice(0, 2);
	return shuffle([...letters, ...decoys], random).map((char, id) => ({ id, char }));
}

/**
 * Wordle marks: a letter in the right place is a hit, one that is in the
 * word but elsewhere is near (each answer letter counted once).
 */
export function markGuess(guess: string, answer: string): Mark[] {
	const g = [...guess].map(letterKey);
	const a = [...answer].map(letterKey);
	const marks: Mark[] = g.map((ch, i) => (ch === a[i] ? 'hit' : 'miss'));
	const left = new Map<string, number>();
	a.forEach((ch, i) => {
		if (marks[i] !== 'hit') left.set(ch, (left.get(ch) ?? 0) + 1);
	});
	g.forEach((ch, i) => {
		if (marks[i] === 'hit') return;
		const n = left.get(ch) ?? 0;
		if (n > 0) {
			marks[i] = 'near';
			left.set(ch, n - 1);
		}
	});
	return marks;
}

export function isSolved(guess: string, answer: string): boolean {
	return markGuess(guess, answer).every((m) => m === 'hit') && [...guess].length === [...answer].length;
}

/** Tries per clue: 1–3, or null for a miss. */
export function shareText(puzzle: RootPuzzle, tries: (number | null)[], url: string): string {
	const squares = tries.map((t) => (t === null ? '⬛' : t === 1 ? '🟩' : t === 2 ? '🟨' : '🟧'));
	const solved = tries.filter((t) => t !== null).length;
	return [
		`Parallel Arabic Daily Root #${puzzle.number}`,
		`${puzzle.root.replace(/ /g, '-')} · ${solved}/${tries.length}`,
		squares.join(''),
		url
	].join('\n');
}
