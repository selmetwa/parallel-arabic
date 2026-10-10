/**
 * "Hear it, pick the vowels": play a word, then choose which of three fully
 * voweled spellings matches. The consonants are the same in every option;
 * only the short vowel marks (fatha, damma, kasra) differ, so the choice is
 * about the marks and nothing else.
 */
import type { GameWord } from './word-pool';
import { shuffle } from './shuffle';

export const WORDS_PER_ROUND = 8;
export const OPTIONS = 3;

const FATHA = 'َ';
const DAMMA = 'ُ';
const KASRA = 'ِ';
const SHORT_VOWELS = [FATHA, DAMMA, KASRA];

export interface HarakatQuestion {
	word: GameWord;
	options: string[];
	answer: number;
}

/** Positions of the short vowel marks in a word. */
export function vowelSlots(arabic: string): number[] {
	return [...arabic].flatMap((ch, i) => (SHORT_VOWELS.includes(ch) ? [i] : []));
}

/** Words with at least two short vowels, so there is something to choose between. */
export function playable(words: GameWord[]): GameWord[] {
	return words.filter((w) => w.audioUrl && vowelSlots(w.arabic).length >= 2);
}

/** The word with one or two of its short vowels swapped for others. */
function variant(arabic: string, random: () => number): string {
	const chars = [...arabic];
	const slots = shuffle(vowelSlots(arabic), random);
	const changes = slots.length > 2 && random() < 0.5 ? 2 : 1;
	for (const i of slots.slice(0, changes)) {
		const others = SHORT_VOWELS.filter((v) => v !== chars[i]);
		chars[i] = others[Math.floor(random() * others.length)];
	}
	return chars.join('');
}

/** Two different wrong spellings of the same consonants. */
export function decoys(arabic: string, random: () => number = Math.random): string[] {
	const out = new Set<string>();
	for (let tries = 0; out.size < OPTIONS - 1 && tries < 50; tries++) {
		const v = variant(arabic, random);
		if (v !== arabic) out.add(v);
	}
	return [...out];
}

export function buildRound(
	words: GameWord[],
	random: () => number = Math.random
): HarakatQuestion[] {
	return shuffle(playable(words), random)
		.slice(0, WORDS_PER_ROUND)
		.map((word) => {
			const options = shuffle([word.arabic, ...decoys(word.arabic, random)], random);
			return { word, options, answer: options.indexOf(word.arabic) };
		});
}
