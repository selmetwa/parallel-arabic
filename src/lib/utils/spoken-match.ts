/**
 * Putting what the learner said and what they were meant to say into the same
 * form before comparing them.
 *
 * Speech-to-text "tidies" what it hears: numbers come back as digits (أربعين
 * → 40) and dialect words in their formal spelling (Egyptian أوي → قوي).
 * Neither is a pronunciation mistake, so both sides get:
 *
 * - digits written out as the dialect says the number (40 → أربعين, ربعين in
 *   Darija), so "one kilo" and "two kilos" still differ;
 * - in Egyptian and Levantine, letters that sound alike folded together, as in
 *   speech-spelling.ts: ق and the hamzas count as one, ث as ت, ذ as د, and
 *   Egyptian ج as گ.
 * - in Iraqi, Gulf and Saudi, the Persian-style letters folded into the standard
 *   ones (گ as ق, چ as ك), which speech-to-text uses; Saudi (Hijazi) also folds
 *   ث as ت and ذ as د.
 */
import { normalizeArabicText } from '$lib/utils/arabic-normalization';

interface NumberWords {
	units: string[];
	tens: string[];
	hundreds: string[];
}

// 0–19, then tens from 20, then hundreds from 100. Compounds are "units وtens".
const NUMBERS: Record<string, NumberWords> = {
	'egyptian-arabic': {
		units: ['صفر', 'واحد', 'اتنين', 'تلاتة', 'اربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة', 'عشرة',
			'حداشر', 'اتناشر', 'تلاتاشر', 'اربعتاشر', 'خمستاشر', 'ستاشر', 'سبعتاشر', 'تمنتاشر', 'تسعتاشر'],
		tens: ['', '', 'عشرين', 'تلاتين', 'اربعين', 'خمسين', 'ستين', 'سبعين', 'تمانين', 'تسعين'],
		hundreds: ['', 'مية', 'ميتين', 'تلتمية', 'ربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'تمنمية', 'تسعمية']
	},
	levantine: {
		units: ['صفر', 'واحد', 'تنين', 'تلاتة', 'اربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة', 'عشرة',
			'احدعش', 'اطنعش', 'تلطعش', 'اربعطعش', 'خمسطعش', 'سطعش', 'سبعطعش', 'تمنطعش', 'تسعطعش'],
		tens: ['', '', 'عشرين', 'تلاتين', 'اربعين', 'خمسين', 'ستين', 'سبعين', 'تمانين', 'تسعين'],
		hundreds: ['', 'مية', 'ميتين', 'تلتمية', 'اربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'تمنمية', 'تسعمية']
	},
	darija: {
		units: ['صفر', 'واحد', 'جوج', 'تلاتة', 'ربعة', 'خمسة', 'ستة', 'سبعة', 'تمنية', 'تسعود', 'عشرة',
			'حضاش', 'طناش', 'تلطاش', 'ربعطاش', 'خمسطاش', 'سطاش', 'سبعطاش', 'تمنطاش', 'تسعطاش'],
		tens: ['', '', 'عشرين', 'تلاتين', 'ربعين', 'خمسين', 'ستين', 'سبعين', 'تمانين', 'تسعين'],
		hundreds: ['', 'مية', 'ميتين', 'تلتمية', 'ربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'تمنمية', 'تسعمية']
	},
	iraqi: {
		units: ['صفر', 'واحد', 'ثنين', 'ثلاثة', 'اربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
			'احدعش', 'ثنعش', 'ثلطعش', 'اربعطعش', 'خمسطعش', 'سطعش', 'سبعطعش', 'ثمنطعش', 'تسعطعش'],
		tens: ['', '', 'عشرين', 'ثلاثين', 'اربعين', 'خمسين', 'ستين', 'سبعين', 'ثمانين', 'تسعين'],
		hundreds: ['', 'مية', 'ميتين', 'ثلثمية', 'اربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'ثمنمية', 'تسعمية']
	},
	khaleeji: {
		units: ['صفر', 'واحد', 'ثنين', 'ثلاثة', 'اربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
			'احدعش', 'ثنعش', 'ثلطعش', 'اربعطعش', 'خمسطعش', 'سطعش', 'سبعطعش', 'ثمنطعش', 'تسعطعش'],
		tens: ['', '', 'عشرين', 'ثلاثين', 'اربعين', 'خمسين', 'ستين', 'سبعين', 'ثمانين', 'تسعين'],
		hundreds: ['', 'مية', 'ميتين', 'ثلاثمية', 'اربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'ثمانمية', 'تسعمية']
	},
	saudi: {
		units: ['صفر', 'واحد', 'اتنين', 'تلاتة', 'اربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة', 'عشرة',
			'احدعش', 'اتنعش', 'تلتعش', 'اربعتعش', 'خمستعش', 'ستعش', 'سبعتعش', 'تمنتعش', 'تسعتعش'],
		tens: ['', '', 'عشرين', 'تلاتين', 'اربعين', 'خمسين', 'ستين', 'سبعين', 'تمانين', 'تسعين'],
		hundreds: ['', 'مية', 'ميتين', 'تلتمية', 'اربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'تمنمية', 'تسعمية']
	},
	fusha: {
		units: ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'اربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
			'احد عشر', 'اثنا عشر', 'ثلاثة عشر', 'اربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'],
		tens: ['', '', 'عشرون', 'ثلاثون', 'اربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'],
		hundreds: ['', 'مئة', 'مئتان', 'ثلاثمئة', 'اربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة']
	}
};

/** A number from 0 to 999 as the dialect says it; larger numbers stay as digits. */
export function numberInWords(n: number, dialect: string): string {
	const words = NUMBERS[dialect] ?? NUMBERS['egyptian-arabic'];
	if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
	const below100 = (m: number) => {
		if (m < 20) return words.units[m];
		const unit = m % 10;
		const ten = words.tens[Math.floor(m / 10)];
		return unit ? `${words.units[unit]} و${ten}` : ten;
	};
	if (n < 100) return below100(n);
	const rest = n % 100;
	const hundred = words.hundreds[Math.floor(n / 100)];
	return rest ? `${hundred} و${below100(rest)}` : hundred;
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

const GULF_IRAQI = new Set(['iraqi', 'khaleeji', 'saudi']);

/** Both sides of a speaking check, in the same form. */
export function foldForMatch(text: string, dialect: string): string {
	const withWords = text
		.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
		.replace(/\d+/g, (digits) => ` ${numberInWords(Number(digits), dialect)} `);
	// Before normalizing, which drops گ and چ as non-Arabic letters.
	const standardLetters = GULF_IRAQI.has(dialect)
		? withWords.replace(/گ/g, 'ق').replace(/چ/g, 'ك')
		: withWords;
	let folded = normalizeArabicText(standardLetters);
	if (dialect === 'egyptian-arabic' || dialect === 'levantine') {
		folded = folded.replace(/[قء]/g, 'ا').replace(/ث/g, 'ت').replace(/ذ/g, 'د');
		if (dialect === 'egyptian-arabic') folded = folded.replace(/گ/g, 'ج');
	}
	if (dialect === 'saudi') folded = folded.replace(/ث/g, 'ت').replace(/ذ/g, 'د');
	return folded.replace(/\s+/g, ' ').trim();
}
