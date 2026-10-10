import { getDialectName, getDialectStyle } from '$lib/data/dialect-rules-v2';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { shuffle } from '$lib/games/shuffle';
import type { GapItem } from '$lib/games/fill-the-gap';
import type { GameLevel } from '$lib/games/levels';
import { LEVEL_GUIDE } from './generate';
import { cleanArabic } from './sentence-scramble';

export const ITEMS_PER_ROUND = 10;
/** Saved words woven into a round, at most. */
export const MAX_SAVED_WORDS = 10;

export function fillTheGapPrompt(dialect: string, level: GameLevel, savedWords: string[] = []): string {
	const name = getDialectName(dialect);
	const saved = savedWords.length
		? `
Build the items around these words the learner has saved, one word per item, using each as the answer where it fits naturally: ${savedWords.join('، ')}. If a word can't make a natural sentence, skip it and write an item of your own.
`
		: '';
	return `You are writing a "fill the gap" vocabulary game for learners of ${name}, pitched at ${LEVEL_GUIDE[level]}.

${getDialectStyle(dialect)}
${saved}
Write 12 items. Each is a natural everyday sentence in ${name} with one word that will be blanked out, plus three wrong choices for the blank.

Rules for the choices:
- The player sees the English meaning under the sentence, so every distractor must contradict that English: with a distractor in the gap, the sentence must no longer mean what the English says.
- The answer is the ONLY choice that makes the sentence correct and natural. Each distractor must be clearly wrong in this sentence: wrong meaning for the context (a drink where a food is needed, "yesterday" with a future verb) or wrong grammar (a verb where a noun is needed). Never a near-synonym that would also work.
- Distractors should be real ${name} words of the same rough length and level as the answer, so the choice is about meaning, not about spotting nonsense.
- Never blank out a tiny function word like و or في.

Fields:
- "sentence": the full correct sentence, words separated by single spaces.
- "answer": the blanked word, copied exactly as it appears in "sentence".
- "distractors": three wrong words.
- "english": the meaning of the sentence.
- "transliteration": simple Latin-letter transliteration of the sentence (3 for ع, 7 for ح, 2 for ء; no accents).
- "explanation": one short English sentence saying why the answer fits. You may quote Arabic words.

Between 4 and 12 words per sentence. No diacritics, no Latin letters in the Arabic.

Return JSON: {"items": [{"sentence","answer","distractors","english","transliteration","explanation"}]}`;
}

const EDGE_PUNCTUATION = /^[.,،؛:!?؟"«»()]+|[.,،؛:!?؟"«»()]+$/g;
const bare = (token: string) => token.replace(EDGE_PUNCTUATION, '');
const norm = (text: string) => normalizeArabicText(text).replace(/\s+/g, ' ').trim();

/**
 * Keep an item only if the gap can be found and the choices are fair: the
 * answer is exactly one word of the sentence, and the four choices are four
 * different words even after spelling normalization.
 */
export function validateItem(
	raw: unknown,
	seen: Set<string>,
	random: () => number = Math.random
): GapItem | null {
	const item = raw as Record<string, unknown>;
	const fields = ['sentence', 'answer', 'english', 'explanation'];
	if (!item || fields.some((f) => typeof item[f] !== 'string' || !(item[f] as string).trim())) {
		return null;
	}
	if (!Array.isArray(item.distractors)) return null;

	const sentence = cleanArabic(item.sentence as string);
	const answer = bare(cleanArabic(item.answer as string));
	if (/[A-Za-z]/.test(sentence) || !answer || answer.includes(' ')) return null;

	const words = sentence.split(' ').map(bare);
	if (words.length < 4 || words.length > 12) return null;

	const at = words.map((w, i) => (norm(w) === norm(answer) ? i : -1)).filter((i) => i >= 0);
	if (at.length !== 1) return null;

	const distractors = (item.distractors as unknown[])
		.filter((d): d is string => typeof d === 'string')
		.map((d) => bare(cleanArabic(d)))
		.filter((d) => d && !d.includes(' ') && !/[A-Za-z]/.test(d));
	const unique = [...new Map([answer, ...distractors].map((w) => [norm(w), w])).values()];
	if (norm(unique[0]) !== norm(answer) || unique.length < 4) return null;

	const key = norm(sentence);
	if (seen.has(key)) return null;
	seen.add(key);

	const options = shuffle(unique.slice(0, 4), random);
	return {
		words,
		gapIndex: at[0],
		options,
		answer: options.indexOf(unique[0]),
		english: (item.english as string).trim(),
		transliteration: typeof item.transliteration === 'string' ? item.transliteration.trim() : '',
		explanation: (item.explanation as string).trim().slice(0, 240)
	};
}
