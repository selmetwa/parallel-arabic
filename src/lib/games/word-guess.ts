import type { GameWord } from './word-pool';
import { shuffle } from './shuffle';
import { letterKey } from './arabic-letters';

export const MAX_MISSES = 6;

/** A word to guess: four letters or more where the pool allows, and not one just played. */
export function pickWord(
	pool: GameWord[],
	{
		random = Math.random,
		avoid = new Set<string>()
	}: { random?: () => number; avoid?: Set<string> } = {}
): GameWord {
	const shuffled = shuffle(pool, random);
	const unplayed = shuffled.filter((w) => !avoid.has(w.id));
	const candidates = unplayed.length ? unplayed : shuffled;
	return candidates.find((w) => [...w.plain].length >= 4) ?? candidates[0];
}

export function isSolved(plain: string, guessed: Set<string>): boolean {
	return [...plain].every((ch) => guessed.has(letterKey(ch)));
}

export function missCount(plain: string, guessed: Set<string>): number {
	const inWord = new Set([...plain].map(letterKey));
	return [...guessed].filter((key) => !inWord.has(key)).length;
}
