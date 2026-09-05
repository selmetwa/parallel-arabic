import levenshtein from 'fast-levenshtein';

// Character-level similarity for short Arabic phrases. Word-level matching is
// too strict here — one differing letter scores 0%. Normalize away tashkeel +
// common letter variants that speech-to-text drops, then use Levenshtein for
// partial credit.
export function calculateWordSimilarity(transcribed: string, expected: string): number {
	const normalize = (text: string) =>
		text
			.replace(/[ً-ْ]/g, '') // tashkeel/diacritics
			.replace(/[آأإٱ]/g, 'ا') // أ إ آ ٱ → ا
			.replace(/ى/g, 'ي') // ى → ي
			.replace(/ة/g, 'ه') // ة → ه
			.replace(/ـ/g, '') // tatweel
			.replace(/[،.؟!,?]/g, '')
			.replace(/\s+/g, ' ')
			.trim();

	const t = normalize(transcribed);
	const e = normalize(expected);
	if (!t || !e) return 0;
	if (t === e) return 100;

	const distance = levenshtein.get(t, e);
	const maxLength = Math.max(t.length, e.length);
	return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}
