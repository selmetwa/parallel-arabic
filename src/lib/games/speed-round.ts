import { englishKey, type GameWord } from './word-pool';
import { shuffle } from './shuffle';

export const ROUND_SECONDS = 60;
/** XP is per correct answer like the other games, capped so a fast round can't farm it. */
export const MAX_XP_PER_ROUND = 15;
export const MIN_POOL = 6;

export interface SpeedQuestion {
	word: GameWord;
	/** The English shown beside the Arabic: its own meaning, or another word's. */
	shown: string;
	isTrue: boolean;
}

/**
 * A shuffled run of questions, about half of them true. A false one borrows
 * the meaning of a different word in the same pool, never a synonym of its
 * own ("to eat" and "eat" count as the same meaning).
 */
export function buildQuestions(
	pool: GameWord[],
	count: number,
	random: () => number = Math.random
): SpeedQuestion[] {
	const out: SpeedQuestion[] = [];
	let deck: GameWord[] = [];
	while (out.length < count) {
		if (deck.length === 0) deck = shuffle(pool, random);
		const word = deck.pop()!;
		const others = pool.filter((w) => englishKey(w.english) !== englishKey(word.english));
		const isTrue = others.length === 0 || random() < 0.5;
		const shown = isTrue ? word.english : others[Math.floor(random() * others.length)].english;
		out.push({ word, shown, isTrue });
	}
	return out;
}

/** Points for a correct answer: 1, then 2 from a streak of 5, 3 from 10. */
export function pointsFor(streak: number): number {
	return 1 + Math.min(2, Math.floor(streak / 5));
}

export function bestKey(dialect: string, theme: string): string {
	return `pa-speed-best:${dialect}:${theme}`;
}
