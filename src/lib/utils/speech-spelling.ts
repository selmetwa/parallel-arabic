/**
 * Spelling Arabic for the text-to-speech voice, so it says the dialect.
 *
 * Arabic script doesn't mark dialect: جنيه is spelled the same in Cairo and in
 * Fusha, so the voice reads it the standard way (ج as "j", ق as "q", ث as "th").
 * For Egyptian and Levantine, the voice gets a copy spelled the way people say
 * it; learners still see the normal spelling.
 *
 * - ق → hamza (2ahwa, 2addeish): أ at the start of a word, ء inside it
 * - ث → ت, ذ → د (talata, dahab)
 * - Egyptian only: ج → گ (a hard g: geneh, tallaga). Levantine keeps "j".
 *
 * A few words don't follow the rules: learned words where ث and ذ become s and
 * z, and words that keep the formal q. Those are in SPOKEN_WORDS.
 */

/** Tashkeel: fathatan to sukun, and the dagger alif. */
const HARAKA = /[ً-ْٰ]/;
const HARAKAT = /[ً-ْٰ]/g;
/** A run of Arabic letters: one word. */
const ARABIC_WORD = /[؀-ۿݐ-ݿ]+/g;

/** Prefixes that can come before a word's first letter: و، ف، ب، ل and ال. */
const PREFIXES = ['وال', 'فال', 'بال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل'];

/**
 * Whole words (without tashkeel or prefixes) the rules get wrong: what the
 * voice should read instead, or `null` to leave the word as written.
 */
const SPOKEN_WORDS: Record<string, string | null> = {
	قرآن: null,
	قران: null,
	ثقافة: 'سقافة',
	ثقافي: 'سقافي',
	ثورة: 'سورة',
	مثلا: 'مسلا',
	مثلًا: 'مسلا',
	ثانوي: 'سانوي',
	ذكي: 'زكي',
	ذكية: 'زكية',
	إذا: 'إزا',
	اذا: 'إزا',
	ذلك: 'زلك',
	هذا: 'هزا',
	هذه: 'هزه',
	لذيذ: 'لزيز',
	لذيذة: 'لزيزة'
};

/** The word without tashkeel, and without the longest prefix whose rest is a known word. */
function lookup(word: string): { prefix: string; entry: string | null } | undefined {
	const bare = word.replace(HARAKAT, '');
	if (bare in SPOKEN_WORDS) return { prefix: '', entry: SPOKEN_WORDS[bare] };
	for (const prefix of PREFIXES) {
		const rest = bare.slice(prefix.length);
		if (bare.startsWith(prefix) && rest in SPOKEN_WORDS) {
			return { prefix, entry: SPOKEN_WORDS[rest] };
		}
	}
	return undefined;
}

/** Index where the word proper starts, after any prefix letters (tashkeel ignored). */
function stemStart(word: string): number {
	const bare = word.replace(HARAKAT, '');
	const prefix = PREFIXES.find((p) => bare.startsWith(p) && bare.length > p.length) ?? '';
	// Walk the original word, skipping tashkeel, until `prefix.length` letters have passed.
	let letters = 0;
	let i = 0;
	while (i < word.length && letters < prefix.length) {
		if (!HARAKA.test(word[i])) letters++;
		i++;
	}
	while (i < word.length && HARAKA.test(word[i])) i++;
	return i;
}

function spokenWord(word: string, hardG: boolean): string {
	const known = lookup(word);
	if (known) return known.entry === null ? word : known.prefix + known.entry;

	const start = stemStart(word);
	let out = '';
	for (let i = 0; i < word.length; i++) {
		const ch = word[i];
		if (ch === 'ج' && hardG) out += 'گ';
		else if (ch === 'ث') out += 'ت';
		else if (ch === 'ذ') out += 'د';
		else if (ch === 'ق') out += i === start || i === 0 ? 'أ' : 'ء';
		else out += ch;
	}
	return out;
}

/** The text as the voice should read it, for this dialect. Darija and Fusha are unchanged. */
export function spellForSpeech(text: string, dialect: string): string {
	if (dialect !== 'egyptian-arabic' && dialect !== 'levantine') return text;
	const hardG = dialect === 'egyptian-arabic';
	return text.replace(ARABIC_WORD, (word) => spokenWord(word, hardG));
}
