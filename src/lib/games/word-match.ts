import type { GameWord } from './word-pool';
import { shuffle } from './shuffle';

export type BoardSize = 'easy' | 'hard';
export const PAIRS: Record<BoardSize, number> = { easy: 6, hard: 8 };

export interface MatchCard {
	key: string;
	wordId: string;
	side: 'ar' | 'en';
	text: string;
}

/**
 * Deal a board of `pairs` words, each as an Arabic card and an English card.
 * Words from the previous board (`avoid`) are only reused when the pool runs
 * short, so "Play again" feels like a new board.
 */
export function dealBoard(
	pool: GameWord[],
	pairs: number,
	{
		random = Math.random,
		avoid = new Set<string>()
	}: { random?: () => number; avoid?: Set<string> } = {}
): { words: GameWord[]; cards: MatchCard[] } {
	const shuffled = shuffle(pool, random);
	const fresh = shuffled.filter((w) => !avoid.has(w.id));
	const reused = shuffled.filter((w) => avoid.has(w.id));
	const words = [...fresh, ...reused].slice(0, pairs);

	const cards = shuffle(
		words.flatMap((w): MatchCard[] => [
			{ key: `${w.id}-ar`, wordId: w.id, side: 'ar', text: w.arabic },
			{ key: `${w.id}-en`, wordId: w.id, side: 'en', text: w.english }
		]),
		random
	);

	return { words, cards };
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;
const BEST_KEY = 'pa-word-match-best';

export function readBest(store: Store | null): Partial<Record<BoardSize, number>> {
	try {
		return JSON.parse(store?.getItem(BEST_KEY) ?? '{}') ?? {};
	} catch {
		return {};
	}
}

/** Save `moves` if it beats the stored best. Returns whether it did. */
export function saveBest(store: Store | null, size: BoardSize, moves: number): boolean {
	const best = readBest(store);
	const previous = best[size];
	if (previous !== undefined && previous <= moves) return false;
	try {
		store?.setItem(BEST_KEY, JSON.stringify({ ...best, [size]: moves }));
	} catch {
		// Best score is a convenience; nothing to do.
	}
	return true;
}
