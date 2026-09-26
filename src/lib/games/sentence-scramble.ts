import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { shuffleUntilDifferent } from './shuffle';

export interface ScrambleSentence {
	/** For display — never normalized, so ة and أ stay as written. */
	arabic: string;
	english: string;
	transliteration: string;
	/** The sentence's words in order, edge punctuation removed. */
	words: string[];
}

const EDGE_PUNCTUATION = /^[.,،؛:!?؟"«»()]+|[.,،؛:!?؟"«»()]+$/g;

export function tokenize(arabic: string): string[] {
	return arabic
		.split(/\s+/)
		.map((w) => w.replace(EDGE_PUNCTUATION, ''))
		.filter(Boolean);
}

/** Compare as words, not tokens, so two identical words can be placed either way round. */
export function isCorrectOrder(answer: string[], words: string[]): boolean {
	return normalizeArabicText(answer.join(' ')) === normalizeArabicText(words.join(' '));
}

/** Positions where the answer has the wrong word, for highlighting. */
export function wrongPositions(answer: string[], words: string[]): number[] {
	return answer
		.map((w, i) => (normalizeArabicText(w) === normalizeArabicText(words[i] ?? '') ? -1 : i))
		.filter((i) => i >= 0);
}

export function scrambleWords(
	words: string[],
	random: () => number = Math.random
): { id: number; word: string }[] {
	return shuffleUntilDifferent(
		words.map((word, id) => ({ id, word })),
		(a, b) => normalizeArabicText(a.word) === normalizeArabicText(b.word),
		random
	);
}
