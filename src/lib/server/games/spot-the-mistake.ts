import { getDialectName, getDialectStyle } from '$lib/data/dialect-rules-v2';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { MISTAKE_TYPES, type MistakeItem, type MistakeType } from '$lib/games/spot-the-mistake';
import type { GameLevel } from '$lib/games/levels';
import { LEVEL_GUIDE } from './generate';
import { cleanArabic } from './sentence-scramble';

export const ITEMS_PER_ROUND = 10;

export function spotTheMistakePrompt(dialect: string, level: GameLevel): string {
	return `You are writing a "spot the mistake" grammar game for learners of ${getDialectName(
		dialect
	)}, pitched at ${LEVEL_GUIDE[level]}.

${getDialectStyle(dialect)}

Write 12 items. Each is a natural everyday sentence with EXACTLY ONE wrong word.

The most important rule: the mistake must be provable from the Arabic sentence alone. The wrong word must clash with ANOTHER word that is in the sentence:
- "gender": an adjective or demonstrative that disagrees with a noun in the sentence. Use only nouns whose gender is certain (feminine nouns ending in ة, masculine nouns without it).
- "conjugation": a verb whose person or gender disagrees with an explicit subject pronoun or noun in the sentence (هو، هي، هما، إحنا، أنا + verb).
- "number": a noun, adjective or verb that disagrees in number with a number or plural subject in the sentence.
- "pronoun-suffix": a possessive or object ending that contradicts a noun or pronoun named in the same sentence.

Never write an item where the "wrong" word would be correct for some unseen speaker or context. For example, "أنا عايزة" is not a mistake: a woman says it. Check every item: the corrected sentence must be fully correct, natural ${getDialectName(
		dialect
	)}, and the incorrect sentence must be wrong for everyone.

Fields:
- "incorrect": the sentence with the mistake, words separated by single spaces.
- "wrongWord": the wrong word, copied exactly as it appears in "incorrect".
- "correction": the word that should replace it.
- "correct": the full corrected sentence (identical to "incorrect" except for that one word).
- "english": the meaning of the corrected sentence.
- "transliteration": simple Latin-letter transliteration of the corrected sentence.
- "errorType": gender, conjugation, number or pronoun-suffix.
- "explanation": one short English sentence naming the word it clashes with and why. You may quote Arabic words.

Also:
- The wrong word must appear only once in the sentence.
- NEVER make the mistake a spelling variant (ة vs ه, أ/إ/ا, ى vs ي).
- Between 3 and 12 words. No diacritics, no Latin letters.

Return JSON: {"items": [{"incorrect","wrongWord","correction","correct","english","transliteration","errorType","explanation"}]}`;
}

const EDGE_PUNCTUATION = /^[.,،؛:!?؟"«»()]+|[.,،؛:!?؟"«»()]+$/g;
const bare = (token: string) => token.replace(EDGE_PUNCTUATION, '');
const norm = (text: string) => normalizeArabicText(text).replace(/\s+/g, ' ').trim();

/**
 * Keep an item only if the mistake is real and locatable: the wrong word is
 * exactly one token, the correction differs from it even after spelling
 * normalization, and swapping it in reproduces the corrected sentence.
 */
export function validateItem(raw: unknown, seen: Set<string>): MistakeItem | null {
	const item = raw as Record<string, unknown>;
	const fields = ['incorrect', 'wrongWord', 'correction', 'correct', 'english', 'explanation'];
	if (!item || fields.some((f) => typeof item[f] !== 'string' || !(item[f] as string).trim())) {
		return null;
	}

	const incorrect = cleanArabic(item.incorrect as string);
	const correct = cleanArabic(item.correct as string);
	const correction = bare(cleanArabic(item.correction as string));
	const wrongWord = bare(cleanArabic(item.wrongWord as string));
	if ([incorrect, correct, correction].some((t) => /[A-Za-z]/.test(t))) return null;

	const tokens = incorrect.split(' ');
	if (tokens.length < 3 || tokens.length > 12) return null;

	const matches = tokens
		.map((t, i) => (norm(bare(t)) === norm(wrongWord) ? i : -1))
		.filter((i) => i >= 0);
	if (matches.length !== 1) return null;
	const wrongIndex = matches[0];

	// A spelling-only "mistake" would vanish under normalization.
	if (norm(correction) === norm(wrongWord)) return null;

	const fixed = tokens.map((t, i) => (i === wrongIndex ? correction : t)).join(' ');
	if (norm(fixed) !== norm(correct)) return null;

	const key = norm(correct);
	if (seen.has(key)) return null;
	seen.add(key);

	return {
		words: tokens.map(bare),
		wrongIndex,
		correction,
		correct,
		english: (item.english as string).trim(),
		transliteration: typeof item.transliteration === 'string' ? item.transliteration.trim() : '',
		errorType: (MISTAKE_TYPES as readonly unknown[]).includes(item.errorType)
			? (item.errorType as MistakeType)
			: 'grammar',
		explanation: (item.explanation as string).trim().slice(0, 240)
	};
}
