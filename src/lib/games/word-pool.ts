/**
 * Turning rows of the `word` table into words a game can use.
 *
 * The table is messy in ways that break games: plurals in parentheses
 * (`كلِب (كْلاب)`), verb pairs (`درّب، يْدرِّب`), whole example sentences,
 * templates (`__ـي بْيِوْجعْني`), loanwords with Latin in them (`MP3 بْلايِر`),
 * transliterations with grammar codes (`kal [i3]`), and several words per English
 * gloss. Two words that both mean "a bite" would give one clue two answers, so
 * duplicates by meaning are dropped too: a clue can't have two answers.
 */
import { normalizeArabicText, stripArabicDiacritics } from '$lib/utils/arabic-normalization';

export interface WordRow {
	id: string | number;
	arabic_word: string | null;
	english_word: string | null;
	transliterated_word: string | null;
	audio_url: string | null;
}

export interface GameWord {
	id: string;
	/** As written in the table, tashkeel included — for display. */
	arabic: string;
	/** Letters only, no tashkeel or tatweel — for letter games and comparison. */
	plain: string;
	english: string;
	transliteration: string;
	audioUrl: string | null;
}

const BRACKETED = /\s*[([][^)\]]*[)\]]/g;

export function cleanWord(row: WordRow): GameWord | null {
	const arabicRaw = (row.arabic_word ?? '').trim();
	const englishRaw = (row.english_word ?? '').trim();
	if (!arabicRaw || !englishRaw || englishRaw.startsWith('*')) return null;

	// Drop the plural/notes in brackets, then keep the first of several forms.
	const arabic = arabicRaw
		.replace(BRACKETED, '')
		.split(/،|,| - /)[0]
		.replace(/\s+/g, ' ')
		.trim();

	// Latin, digits and template underscores mean this isn't a plain word.
	if (!arabic || /[A-Za-z0-9_*/]/.test(arabic)) return null;
	// Punctuation means a sentence or a question, not a word.
	if (/[.؟?!:؛]/.test(arabic) || /[.?!]$/.test(englishRaw)) return null;

	const plain = stripArabicDiacritics(arabic).replace(/\s+/g, ' ').trim();
	if (!plain) return null;

	const english = englishRaw.replace(BRACKETED, '').split(/[;,/]/)[0].replace(/\s+/g, ' ').trim();
	if (!english || english.split(' ').length > 3) return null;

	const transliteration = (row.transliterated_word ?? '')
		.replace(BRACKETED, '')
		.split(/,| - /)[0]
		.replace(/\s+/g, ' ')
		.trim();

	return {
		id: String(row.id),
		arabic,
		plain,
		english,
		transliteration,
		// Stored as http; the host serves https, and http would be mixed content.
		audioUrl: row.audio_url ? row.audio_url.replace(/^http:\/\//, 'https://') : null
	};
}

/** A single word of 3–7 plain Arabic letters: something you can spell from tiles. */
export function isLetterWord(word: GameWord): boolean {
	return /^[ء-غف-ي]{3,7}$/.test(word.plain);
}

/** "to eat" and "eat", "whales" and "whale" are the same answer on a board. */
export function englishKey(english: string): string {
	const key = english
		.toLowerCase()
		.trim()
		.replace(/^(to|a|an|the)\s+/, '');
	return key.length > 3 ? key.replace(/s$/, '') : key;
}

export function arabicKey(plain: string): string {
	return normalizeArabicText(plain);
}

/** Every spellable word, unique by meaning and by spelling, in table order. */
export function buildPool(rows: WordRow[]): GameWord[] {
	const seenEnglish = new Set<string>();
	const seenArabic = new Set<string>();
	const pool: GameWord[] = [];

	for (const row of rows) {
		const word = cleanWord(row);
		if (!word || !isLetterWord(word)) continue;

		const en = englishKey(word.english);
		const ar = arabicKey(word.plain);
		if (seenEnglish.has(en) || seenArabic.has(ar)) continue;

		seenEnglish.add(en);
		seenArabic.add(ar);
		pool.push(word);
	}

	return pool;
}
