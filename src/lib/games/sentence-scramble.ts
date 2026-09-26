import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { shuffleUntilDifferent } from './shuffle';
import type { GameDialect } from './themes';

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

/**
 * One sentence non-subscribers can play on the page, per dialect. Hand-written;
 * worth a native speaker's check.
 */
export const DEMO_SENTENCES: Record<GameDialect, ScrambleSentence> = {
	'egyptian-arabic': {
		arabic: 'أنا عايز أشرب شاي',
		english: 'I want to drink tea',
		transliteration: 'ana 3ayez ashrab shay',
		words: ['أنا', 'عايز', 'أشرب', 'شاي']
	},
	levantine: {
		arabic: 'أنا بدي إشرب شاي',
		english: 'I want to drink tea',
		transliteration: 'ana biddi ishrab shay',
		words: ['أنا', 'بدي', 'إشرب', 'شاي']
	},
	darija: {
		arabic: 'أنا بغيت نشرب أتاي',
		english: 'I want to drink tea',
		transliteration: 'ana bghit nshrab atay',
		words: ['أنا', 'بغيت', 'نشرب', 'أتاي']
	},
	fusha: {
		arabic: 'أريد أن أشرب الشاي',
		english: 'I want to drink tea',
		transliteration: 'urīdu an ashraba ash-shāy',
		words: ['أريد', 'أن', 'أشرب', 'الشاي']
	}
};
