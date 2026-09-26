import { getDialectName, getDialectStyle } from '$lib/data/dialect-rules-v2';
import { normalizeArabicText, stripArabicDiacritics } from '$lib/utils/arabic-normalization';
import { tokenize, type ScrambleSentence } from '$lib/games/sentence-scramble';
import type { GameLevel } from '$lib/games/levels';
import { LEVEL_GUIDE } from './generate';

export const SENTENCES_PER_ROUND = 8;

export const WORD_RANGE: Record<GameLevel, [number, number]> = {
	beginner: [3, 6],
	intermediate: [5, 8],
	advanced: [6, 10]
};

/** Clean Arabic for display: no tashkeel, no quotes. Letters are left as written. */
export function cleanArabic(text: string): string {
	return stripArabicDiacritics(text)
		.replace(/["«»“”]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function sentenceScramblePrompt(dialect: string, level: GameLevel): string {
	const [min, max] = WORD_RANGE[level];
	return `You are writing a word-order game for learners of ${getDialectName(dialect)}.

${getDialectStyle(dialect)}

Write 12 different short everyday sentences for ${LEVEL_GUIDE[level]}.

Rules for every sentence:
- Between ${min} and ${max} words.
- It must have ONLY ONE natural word order. Avoid lists, "X and Y" pairs that could swap, and time or place phrases that could move to another position.
- Do not repeat a word within a sentence.
- No diacritics (tashkeel). No Latin letters. End with "." or "؟" only.
- "english": a natural English translation.
- "transliteration": a simple Latin-letter transliteration of the whole sentence.

Return JSON: {"sentences": [{"arabic": "...", "english": "...", "transliteration": "..."}]}`;
}

/**
 * Keep a generated sentence only if it can be played: the right length, more
 * than one distinct word, Arabic only, and not a repeat of one already kept.
 */
export function validateSentence(
	raw: unknown,
	level: GameLevel,
	seen: Set<string>
): ScrambleSentence | null {
	const item = raw as { arabic?: unknown; english?: unknown; transliteration?: unknown };
	if (typeof item?.arabic !== 'string' || typeof item.english !== 'string') return null;

	const arabic = cleanArabic(item.arabic);
	const english = item.english.trim();
	if (!arabic || !english || /[A-Za-z]/.test(arabic)) return null;

	const words = tokenize(arabic);
	const [min, max] = WORD_RANGE[level];
	if (words.length < min || words.length > max) return null;
	if (new Set(words.map(normalizeArabicText)).size < 2) return null;

	const key = normalizeArabicText(words.join(' '));
	if (seen.has(key)) return null;
	seen.add(key);

	return {
		arabic,
		english,
		transliteration: typeof item.transliteration === 'string' ? item.transliteration.trim() : '',
		words
	};
}
