import { describe, it, expect } from 'vitest';
import { PASS_THRESHOLD, scorePronunciation } from './pronunciation';

describe('scorePronunciation', () => {
	it('scores an exact match at 100', () => {
		expect(scorePronunciation('قهوة', 'قهوة')).toBe(100);
	});

	it('ignores the diacritics and letter variants the recognizer drops', () => {
		// Chirp returns bare text; the target often carries tashkeel and a ta marbuta.
		expect(scorePronunciation('قَهْوَة', 'قهوه')).toBe(100);
		expect(scorePronunciation('إسكندرية', 'اسكندريه')).toBe(100);
	});

	it('ignores the trailing full stop the recognizer adds to sentences', () => {
		expect(scorePronunciation('انا عايز قهوة', 'انا عايز قهوة.')).toBe(100);
	});

	it('passes a word that is close but not exact', () => {
		// One letter off a five-letter word.
		expect(scorePronunciation('مدرسة', 'مدرسن')).toBeGreaterThanOrEqual(PASS_THRESHOLD.word);
	});

	it('fails a word that is simply different', () => {
		expect(scorePronunciation('قهوة', 'كتاب')).toBeLessThan(PASS_THRESHOLD.word);
	});

	it('passes a sentence with one word misheard', () => {
		expect(
			scorePronunciation('انا رايح المدرسة دلوقتي', 'انا رايح المدرسه دلوقت')
		).toBeGreaterThanOrEqual(PASS_THRESHOLD.sentence);
	});

	it('scores silence at 0 rather than throwing', () => {
		expect(scorePronunciation('قهوة', '')).toBe(0);
		expect(scorePronunciation('', '')).toBe(0);
	});
});

describe('scorePronunciation with a dialect', () => {
	it('matches numbers the recognizer wrote as digits', () => {
		// Said "keteer awi! arbe3een?"; Chirp returned digits and the formal قوي.
		// The scenario mic passes at the word threshold; this used to fail it.
		expect(scorePronunciation('كِتِير أَوِي! أَرْبِعِين؟', 'كتير قوي 40')).toBeLessThan(
			PASS_THRESHOLD.word
		);
		expect(scorePronunciation('كِتِير أَوِي! أَرْبِعِين؟', 'كتير قوي 40', 'egyptian-arabic')).toBe(
			100
		);
	});

	it('writes compound numbers out the way the dialect says them', () => {
		expect(scorePronunciation('مِيَّة وْخَمْسِين جِنِيه.', '150 جنيه', 'egyptian-arabic')).toBe(100);
		expect(scorePronunciation('خَمْسَة وْعِشْرِين', '٢٥', 'levantine')).toBe(100);
		expect(scorePronunciation('رْبْعِين', '40', 'darija')).toBe(100);
		expect(scorePronunciation('أَرْبَعُونَ', '40', 'fusha')).toBe(100);
	});

	it('keeps different numbers different', () => {
		const one = scorePronunciation('كِيلُو وَاحِد.', 'كيلو 1', 'egyptian-arabic');
		const two = scorePronunciation('اتْنِين كِيلُو.', 'كيلو 1', 'egyptian-arabic');
		expect(one).toBeGreaterThan(two);
	});

	it('treats ق and hamza alike in Egyptian and Levantine, not in Fusha', () => {
		expect(scorePronunciation('قَهْوَة', 'أهوة', 'egyptian-arabic')).toBe(100);
		expect(scorePronunciation('قَدّيش', 'أديش', 'levantine')).toBe(100);
		expect(scorePronunciation('قَهْوَة', 'أهوة', 'fusha')).toBeLessThan(100);
	});
});
