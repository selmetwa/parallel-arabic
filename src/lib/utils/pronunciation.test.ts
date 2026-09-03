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
