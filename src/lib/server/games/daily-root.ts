/**
 * Today's Daily Root. Only today's puzzle leaves the server, so the list of
 * roots and their words can't be read ahead from the page.
 */
import roots from '$lib/data/daily-root/roots.json';
import { puzzleNumber, rootIndex, type RootPuzzle } from '$lib/games/daily-root';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

type Entry = { root: string; meaning: string; words: [string, string, string][] };
const ROOTS = roots as Entry[];

export function puzzleFor(number: number = puzzleNumber()): RootPuzzle {
	const entry = ROOTS[rootIndex(number, ROOTS.length)];
	return {
		number,
		root: entry.root,
		meaning: entry.meaning,
		words: entry.words.map(([arabic, transliteration, english]) => ({
			arabic,
			plain: stripArabicDiacritics(arabic).replace(/[ًٌٍ]/g, ''),
			transliteration,
			english
		}))
	};
}

export const ROOT_COUNT = ROOTS.length;
