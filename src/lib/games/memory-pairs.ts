import type { GameWord } from './word-pool';
import { shuffle } from './shuffle';

export const PAIRS_PER_BOARD = 6;

/** Read: Arabic matched to English. Listen: a recording matched to its Arabic. */
export type MemoryMode = 'read' | 'listen';

export interface MemoryCard {
	/** Unique per card on the board. */
	id: number;
	word: GameWord;
	face: 'arabic' | 'english' | 'audio';
}

/** Listen boards need a recording for every word. */
export function wordsForMode(pool: GameWord[], mode: MemoryMode): GameWord[] {
	return mode === 'listen' ? pool.filter((w) => w.audioUrl) : pool;
}

export function canPlayMode(pool: GameWord[], mode: MemoryMode): boolean {
	return wordsForMode(pool, mode).length >= PAIRS_PER_BOARD;
}

/**
 * Pick the words for a board, preferring ones not on the last board, and lay
 * out two cards per word in a shuffled order.
 */
export function buildBoard(
	pool: GameWord[],
	mode: MemoryMode,
	{
		random = Math.random,
		avoid = new Set<string>()
	}: { random?: () => number; avoid?: Set<string> } = {}
): MemoryCard[] {
	const candidates = shuffle(wordsForMode(pool, mode), random);
	const words = [
		...candidates.filter((w) => !avoid.has(w.id)),
		...candidates.filter((w) => avoid.has(w.id))
	].slice(0, PAIRS_PER_BOARD);

	const other: MemoryCard['face'] = mode === 'listen' ? 'audio' : 'english';
	const cards = words.flatMap((word) => [
		{ word, face: 'arabic' as const },
		{ word, face: other }
	]);
	return shuffle(cards, random).map((card, id) => ({ ...card, id }));
}

/** Two different cards for the same word. */
export function isPair(a: MemoryCard, b: MemoryCard): boolean {
	return a.id !== b.id && a.word.id === b.word.id;
}
