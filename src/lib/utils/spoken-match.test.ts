import { describe, expect, it } from 'vitest';
import { foldForMatch, numberInWords } from './spoken-match';

describe('numberInWords', () => {
	it('says numbers the way each new dialect does', () => {
		expect(numberInWords(2, 'iraqi')).toBe('ثنين');
		expect(numberInWords(12, 'khaleeji')).toBe('ثنعش');
		expect(numberInWords(23, 'saudi')).toBe('تلاتة وعشرين');
	});
});

describe('foldForMatch', () => {
	it('matches گ and چ against the standard letters speech-to-text writes', () => {
		expect(foldForMatch('گال', 'iraqi')).toBe(foldForMatch('قال', 'iraqi'));
		expect(foldForMatch('چم', 'khaleeji')).toBe(foldForMatch('كم', 'khaleeji'));
	});

	it('folds ث and ذ in Saudi (Hijazi) only', () => {
		expect(foldForMatch('ثلاثة', 'saudi')).toBe(foldForMatch('تلاتة', 'saudi'));
		expect(foldForMatch('ثلاثة', 'iraqi')).not.toBe(foldForMatch('تلاتة', 'iraqi'));
	});

	it('writes digits out in the dialect', () => {
		expect(foldForMatch('2', 'iraqi')).toBe('ثنين');
	});
});
