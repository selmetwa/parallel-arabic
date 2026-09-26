/**
 * Letter handling for Word Scramble's keyboard input.
 *
 * Learners type "letters", not code points: typing ا should be able to place
 * أ, إ or آ, and nobody should need a separate key for ئ. The grouping reuses
 * normalizeArabicTextLight, the same folding the app already uses when it
 * checks typed answers — so ه covers ة and ي covers ى.
 */
import { normalizeArabicTextLight } from '$lib/utils/arabic-normalization';

/** The letter group a written letter belongs to. */
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
