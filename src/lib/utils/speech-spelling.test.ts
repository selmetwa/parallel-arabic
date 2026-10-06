import { describe, expect, it } from 'vitest';
import { spellForSpeech } from './speech-spelling';

const eg = (text: string) => spellForSpeech(text, 'egyptian-arabic');

describe('spellForSpeech, Egyptian', () => {
	it('says ج as a hard g', () => {
		expect(eg('جِنِيه')).toBe('گِنِيه');
		expect(eg('حَاجَة')).toBe('حَاگَة');
		expect(eg('الْجَوّ')).toBe('الْگَوّ');
	});

	it('says ق as a hamza: on an alif at the start of a word, bare inside it', () => {
		expect(eg('قَهْوَة')).toBe('أَهْوَة');
		expect(eg('الْقَطْر')).toBe('الْأَطْر');
		expect(eg('وْالْقَهْوَة')).toBe('وْالْأَهْوَة');
		expect(eg('الطَّرِيق')).toBe('الطَّرِيء');
		expect(eg('مَعْلَقَة')).toBe('مَعْلَءَة');
	});

	it('says ث as t and ذ as d', () => {
		expect(eg('ثَلَّاجَة')).toBe('تَلَّاگَة');
		expect(eg('ذَهَب')).toBe('دَهَب');
	});

	it('keeps whole lines intact around the changed letters', () => {
		expect(eg('الْمَحَطَّة؟ خَمْسِين جِنِيه.')).toBe('الْمَحَطَّة؟ خَمْسِين گِنِيه.');
		expect(eg('تِشْرَب حَاجَة سُخْنَة؟ قَهْوَة؟')).toBe('تِشْرَب حَاگَة سُخْنَة؟ أَهْوَة؟');
	});

	it('uses the exceptions for words that do not follow the rules', () => {
		expect(eg('ثقافة')).toBe('سقافة');
		expect(eg('الثقافة')).toBe('السقافة');
		expect(eg('ذَكِي')).toBe('زكي');
		expect(eg('القرآن')).toBe('القرآن');
	});

	it('leaves Latin text and numbers alone', () => {
		expect(eg('wifi 305')).toBe('wifi 305');
	});
});

describe('spellForSpeech, Levantine', () => {
	const lev = (text: string) => spellForSpeech(text, 'levantine');

	it('says ق as a hamza, ث as t and ذ as d', () => {
		expect(lev('قَدّيش')).toBe('أَدّيش');
		expect(lev('قَهْوِة')).toBe('أَهْوِة');
		expect(lev('الطَّرِيق')).toBe('الطَّرِيء');
		expect(lev('ثَلَاثَة')).toBe('تَلَاتَة');
	});

	it('keeps ج as "j"', () => {
		expect(lev('جاج')).toBe('جاج');
		expect(lev('الْمَحَطَّة؟ جِنِيه')).toBe('الْمَحَطَّة؟ جِنِيه');
	});

	it('uses the same exceptions', () => {
		expect(lev('إذا')).toBe('إزا');
		expect(lev('القرآن')).toBe('القرآن');
	});
});

describe('spellForSpeech, Darija and Fusha', () => {
	it('leaves them as written', () => {
		for (const dialect of ['darija', 'fusha']) {
			expect(spellForSpeech('جِنِيه قَهْوَة ثَلَّاجَة', dialect)).toBe('جِنِيه قَهْوَة ثَلَّاجَة');
		}
	});
});
