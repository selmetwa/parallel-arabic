import { getDialectName, getDialectStyle } from '$lib/data/dialect-rules-v2';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { ODD_PATTERNS, type OddPattern, type OddPuzzle } from '$lib/games/odd-one-out';
import { shuffle } from '$lib/games/shuffle';
import type { GameLevel } from '$lib/games/levels';
import { LEVEL_GUIDE } from './generate';
import { cleanArabic } from './sentence-scramble';

export const PUZZLES_PER_ROUND = 10;

export function oddOneOutPrompt(dialect: string, level: GameLevel): string {
	return `You are writing "odd one out" puzzles for learners of ${getDialectName(
		dialect
	)}, pitched at ${LEVEL_GUIDE[level]}.

${getDialectStyle(dialect)}

Write 12 puzzles. Each has exactly 4 different single Arabic words. Three share one clear pattern; the fourth ("oddWord") does not.

"pattern" is one of:
- "meaning": three belong to one category (fruit, family, colours…) and one does not.
- "gender": three masculine nouns and one feminine, or the reverse. Use only nouns whose gender is certain: feminine nouns ending in ة and masculine nouns without it. Never use irregular-gender nouns (like شمس, أرض, بيت used as feminine) or loanwords.
- "word-type": three nouns and one verb or adjective, or similar.
- "root": three words built from the same three-letter root (e.g. كتاب، مكتب، كاتب) and one from another root.
- "number": three singular and one plural, or the reverse.

Order the puzzles from easy to hard: 4 "easy" (meaning), 3 "medium" (word-type, number, gender), 3 "hard" (root, or gender with a tricky ending). Set "difficulty" to easy, medium or hard.

Rules:
- The odd word must be the only defensible answer. No other word may be arguably odd for a different reason.
- For root puzzles, check each word's root letter by letter. Words that merely share letters are not enough: مدير (root د-و-ر) is NOT from د-ر-س. If you are unsure of a root, write a different puzzle.
- Use everyday words of ${getDialectName(
		dialect
	)}, including for root puzzles. No diacritics, no Latin letters.
- "oddWord" is copied exactly from one of the four words.
- "explanation": one short English sentence naming the pattern and why the odd word breaks it. You may quote Arabic words.
- Give each word its English meaning and a simple transliteration.

Return JSON: {"puzzles": [{"words": [{"arabic","english","transliteration"}], "oddWord", "pattern", "explanation", "difficulty"}]}`;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

/**
 * Keep a puzzle only if it is playable: four distinct single words, and the
 * odd word found in exactly one of them. Positions are reshuffled here, so the
 * answer isn't wherever the model tends to put it.
 */
export function validatePuzzle(
	raw: unknown,
	seen: Set<string>,
	random: () => number = Math.random
): OddPuzzle | null {
	const item = raw as {
		words?: { arabic?: unknown; english?: unknown; transliteration?: unknown }[];
		oddWord?: unknown;
		pattern?: unknown;
		explanation?: unknown;
		difficulty?: unknown;
	};
	if (!Array.isArray(item?.words) || item.words.length !== 4) return null;
	if (typeof item.oddWord !== 'string' || typeof item.explanation !== 'string') return null;

	const words = item.words.map((w) => ({
		arabic: typeof w?.arabic === 'string' ? cleanArabic(w.arabic) : '',
		english: typeof w?.english === 'string' ? w.english.trim() : '',
		transliteration: typeof w?.transliteration === 'string' ? w.transliteration.trim() : ''
	}));
	if (words.some((w) => !w.arabic || !w.english || /\s|[A-Za-z]/.test(w.arabic))) return null;

	const keys = words.map((w) => normalizeArabicText(w.arabic));
	if (new Set(keys).size !== 4) return null;

	const oddKey = normalizeArabicText(cleanArabic(item.oddWord));
	const oddPositions = keys.map((k, i) => (k === oddKey ? i : -1)).filter((i) => i >= 0);
	if (oddPositions.length !== 1) return null;

	const explanation = item.explanation.trim();
	if (!explanation) return null;

	const setKey = [...keys].sort().join('|');
	if (seen.has(setKey)) return null;
	seen.add(setKey);

	const order = shuffle([0, 1, 2, 3], random);
	return {
		words: order.map((i) => words[i]),
		oddIndex: order.indexOf(oddPositions[0]),
		pattern: (ODD_PATTERNS as readonly unknown[]).includes(item.pattern)
			? (item.pattern as OddPattern)
			: 'meaning',
		explanation: explanation.slice(0, 200),
		difficulty: (DIFFICULTIES as readonly unknown[]).includes(item.difficulty)
			? (item.difficulty as OddPuzzle['difficulty'])
			: 'medium'
	};
}

/** Easy first, hard last, the order the prompt asks for but can't guarantee. */
export function sortByDifficulty(puzzles: OddPuzzle[]): OddPuzzle[] {
	return [...puzzles].sort(
		(a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty)
	);
}
