import type { GameWord } from './word-pool';
import { shuffle } from './shuffle';
import { normalizeArabicTextLight } from '$lib/utils/arabic-normalization';

export const WORDS_PER_ROUND = 8;
export const OPTIONS = 4;
/** Below this many recorded words a theme isn't offered. */
export const MIN_RECORDED = WORDS_PER_ROUND;

/**
 * Letters learners mix up by ear. A near-miss spelling swaps one of these for
 * its partner, so the choice is between sounds, not between shapes.
 * (ة and ه sound the same at the end of a word and are never swapped.)
 */
const SOUND_ALIKE: string[][] = [
	['س', 'ص'],
	['ت', 'ط'],
	['د', 'ض'],
	['ذ', 'ز', 'ظ'],
	['ح', 'ه'],
	['ك', 'ق'],
	['ث', 'س'],
	['ع', 'ء']
];

export interface SpellQuestion {
	word: GameWord;
	/** Plain spellings (no tashkeel, which would give the answer away). */
	options: string[];
	answer: number;
}

export function recordedWords(pool: GameWord[]): GameWord[] {
	return pool.filter((w) => w.audioUrl);
}

const key = (s: string) => normalizeArabicTextLight(s);

/** The word with one sound-alike letter swapped, or null if it has none. */
export function nearMiss(plain: string, random: () => number = Math.random): string | null {
	const chars = [...plain];
	const spots = chars.flatMap((ch, i) => {
		const group = SOUND_ALIKE.find((g) => g.includes(ch));
		return group ? [{ i, others: group.filter((c) => c !== ch) }] : [];
	});
	if (spots.length === 0) return null;
	const { i, others } = spots[Math.floor(random() * spots.length)];
	chars[i] = others[Math.floor(random() * others.length)];
	return chars.join('');
}

function questionFor(
	word: GameWord,
	pool: GameWord[],
	random: () => number
): SpellQuestion {
	const seen = new Set([key(word.plain)]);
	const options = [word.plain];
	const add = (s: string | null) => {
		if (s && !seen.has(key(s)) && options.length < OPTIONS) {
			seen.add(key(s));
			options.push(s);
		}
	};

	add(nearMiss(word.plain, random));
	// Other words of about the same length, so length alone doesn't give it away.
	const len = [...word.plain].length;
	const similar = shuffle(
		pool.filter((w) => w.id !== word.id && Math.abs([...w.plain].length - len) <= 1),
		random
	);
	for (const w of similar) add(w.plain);
	for (const w of shuffle(pool, random)) add(w.plain);

	const order = shuffle(
		options.map((_, i) => i),
		random
	);
	return {
		word,
		options: order.map((i) => options[i]),
		answer: order.indexOf(0)
	};
}

export function buildRound(
	pool: GameWord[],
	{
		random = Math.random,
		avoid = new Set<string>()
	}: { random?: () => number; avoid?: Set<string> } = {}
): SpellQuestion[] {
	const words = shuffle(recordedWords(pool), random);
	return [...words.filter((w) => !avoid.has(w.id)), ...words.filter((w) => avoid.has(w.id))]
		.slice(0, WORDS_PER_ROUND)
		.map((w) => questionFor(w, pool, random));
}
