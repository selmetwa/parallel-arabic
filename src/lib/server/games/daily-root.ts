/**
 * Today's Daily Root. Only today's puzzle leaves the server, so the list of
 * roots and their words can't be read ahead from the page.
 */
import roots from '$lib/data/daily-root/roots.json';
import { puzzleNumber, rootIndex, type RootPuzzle } from '$lib/games/daily-root';
import type { GameDialect } from '$lib/games/themes';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

type Word = [string, string, string];
type Entry = { root: string; meaning: string; words: Word[] };
const ROOTS = roots as Entry[];

/**
 * Each dialect's words for the same roots, keyed by root: everyone gets the
 * same root on the same day, in the words their dialect uses. roots.json is
 * the Fusha set.
 */
const DIALECT_WORDS = Object.fromEntries(
	Object.entries(
		import.meta.glob<Record<string, Word[]>>('../../data/daily-root/dialects/*.json', {
			eager: true,
			import: 'default'
		})
	).map(([path, words]) => [path.split('/').pop()!.replace('.json', ''), words])
) as Partial<Record<GameDialect, Record<string, Word[]>>>;

export function puzzleFor(
	number: number = puzzleNumber(),
	dialect: GameDialect = 'fusha'
): RootPuzzle {
	const entry = ROOTS[rootIndex(number, ROOTS.length)];
	const words = DIALECT_WORDS[dialect]?.[entry.root] ?? entry.words;
	return {
		number,
		dialect,
		root: entry.root,
		meaning: entry.meaning,
		words: words.map(([arabic, transliteration, english]) => ({
			arabic,
			plain: stripArabicDiacritics(arabic).replace(/[ًٌٍ]/g, ''),
			transliteration,
			english
		}))
	};
}

export const ROOT_COUNT = ROOTS.length;
