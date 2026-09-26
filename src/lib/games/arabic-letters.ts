/**
 * Letter handling for the spelling games.
 *
 * Learners guess and type "letters", not code points: guessing ا should reveal
 * أ, إ and آ too, and nobody should need a separate key for ئ. The grouping
 * reuses normalizeArabicTextLight, the same folding the app already uses when
 * it checks typed answers — so ه covers ة and ي covers ى.
 */
import { normalizeArabicTextLight } from '$lib/utils/arabic-normalization';

/** The on-screen keyboard: the 28 letters in alphabet order, plus hamza. */
export const KEYBOARD_LETTERS = [
	'ا',
	'ب',
	'ت',
	'ث',
	'ج',
	'ح',
	'خ',
	'د',
	'ذ',
	'ر',
	'ز',
	'س',
	'ش',
	'ص',
	'ض',
	'ط',
	'ظ',
	'ع',
	'غ',
	'ف',
	'ق',
	'ك',
	'ل',
	'م',
	'ن',
	'ه',
	'و',
	'ي',
	'ء'
] as const;

/** Which keyboard key a written letter belongs to. */
export function letterKey(ch: string): string {
	return normalizeArabicTextLight(ch);
}

const ARABIC_LETTER = /^[ء-غف-ي]$/;

/**
 * The keys a physical keyboard press stands for. Most Arabic layouts have a
 * single لا key, which types two letters. Anything that isn't an Arabic letter
 * gives an empty list.
 */
export function keysForTyped(key: string): string[] {
	if (key === 'لا') return ['ل', 'ا'];
	return ARABIC_LETTER.test(key) ? [letterKey(key)] : [];
}
