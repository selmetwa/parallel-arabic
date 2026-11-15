/**
 * Coverage check for tutor-notes extraction: which Arabic words in the notes
 * did no extracted item pick up? Pure, so it can be unit tested without Gemini.
 */
import { normalizeArabicText } from '$lib/utils/arabic-normalization';

// Function words that don't need their own card (normalized spelling: ة→ه, أ/إ/آ→ا, ى→ي).
const STOPWORDS = new Set([
	'و', 'في', 'فى', 'من', 'علي', 'الي', 'عن', 'مع', 'يا', 'او', 'ان', 'انا', 'انت', 'انتي', 'هو', 'هي',
	'ده', 'دي', 'دا', 'دول', 'ما', 'لا', 'مش', 'مو', 'اللي', 'الي', 'لو', 'بس', 'كمان', 'هنا'
]);

const PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب', 'ل', 'ف', 'ك'];

/** Spelling-insensitive key: no diacritics, unified letter variants. */
function key(word: string): string {
	return normalizeArabicText(word).replace(/[^ء-ي]/g, '');
}

/** The word plus its forms with common clitic prefixes removed, so "والمباني" matches "مباني". */
function forms(word: string): string[] {
	const base = key(word);
	const out = [base];
	for (const p of PREFIXES) {
		if (base.startsWith(p) && base.length - p.length >= 2) out.push(base.slice(p.length));
	}
	return out;
}

/** Arabic word tokens in a text, in order. */
export function arabicTokens(text: string): string[] {
	return text.match(/[ء-يً-ْٰ]+/g) ?? [];
}

/**
 * Arabic words from `sourceText` that none of `covered` (each item's arabic and
 * aligned words) account for. Returns each missing word once, as written.
 */
export function findUncovered(sourceText: string, covered: string[]): string[] {
	const known = new Set<string>();
	for (const text of covered) {
		for (const token of arabicTokens(text)) forms(token).forEach((f) => known.add(f));
	}

	const missing = new Map<string, string>();
	for (const token of arabicTokens(sourceText)) {
		const k = key(token);
		if (k.length < 2 || STOPWORDS.has(k) || missing.has(k)) continue;
		if (forms(token).some((f) => known.has(f) || STOPWORDS.has(f))) continue;
		missing.set(k, token);
	}
	return [...missing.values()];
}

/** Source lines that contain any of `words`, for a focused follow-up extraction. */
export function linesContaining(sourceText: string, words: string[]): string[] {
	const keys = new Set(words.map(key));
	return sourceText
		.split('\n')
		.filter((line) => arabicTokens(line).some((t) => keys.has(key(t))));
}
