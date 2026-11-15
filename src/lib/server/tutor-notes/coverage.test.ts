import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { arabicTokens, findUncovered, linesContaining } from './coverage';

const notes = readFileSync(join(__dirname, 'fixtures', 'example-notes.txt'), 'utf-8');

// What a complete extraction of the example notes covers (each item's arabic text).
const fullExtraction = [
	'ناقص', 'مفرد', 'مؤنث', 'جمع', 'مذكر', 'تعاون', 'اتعاون', 'معتمد', 'معتمدة', 'سفارة', 'فريق',
	'مشروع التخرج', 'قدم على', 'اتقدم', 'دراسة', 'من الناحية التانية', 'ملوش طعم', 'ملهاش طعم', 'ماسخ',
	'على حسب', 'ليه', 'ليها', 'الطباخ', 'طريقة الطبخ', 'بيانات', 'زراير', 'خزن', 'مخزن', 'نزل', 'أداة',
	'أدوات', 'مبنى', 'مباني', 'الرسايل هتاخد وقت عشان تتبعت', 'كسل', 'بعت', 'اتبعت',
	'إيه اللغات اللي هتشتغلي بيها', 'مفيش مكان', 'مفيش حد', 'مفيش حاجة', 'كل حاجة', 'أي حاجة', 'بـ'
];

describe('findUncovered', () => {
	it('reports nothing when every word in the notes was extracted', () => {
		expect(findUncovered(notes, fullExtraction)).toEqual([]);
	});

	it('ignores spelling variants: tashkeel, hamza, taa marbuta and alef maqsura', () => {
		expect(findUncovered('مُؤنث سِفارة مبنى إتبعت', ['مؤنث', 'سفارة', 'مبني', 'اتبعت'])).toEqual([]);
	});

	it('matches words with clitic prefixes', () => {
		expect(findUncovered('والمباني بالأداة للفريق', ['مباني', 'أداة', 'فريق'])).toEqual([]);
	});

	it('reports each missing word once, as written in the notes', () => {
		const withoutCooking = fullExtraction.filter((w) => w !== 'الطباخ' && w !== 'طريقة الطبخ');
		expect(findUncovered(notes, withoutCooking)).toEqual(['الطباخ', 'طريقة', 'الطبخ']);
	});

	it('skips function words and one-letter fragments like the ة in معتمد/ة', () => {
		expect(findUncovered('في من على اللي معتمد/ة', ['معتمد'])).toEqual([]);
	});
});

describe('linesContaining', () => {
	it('returns only the lines that hold the missing words', () => {
		expect(linesContaining(notes, ['زراير'])).toEqual(['| Data / database | بيانات  | Buttons  | زراير  |']);
	});
});

describe('arabicTokens', () => {
	it('keeps diacritics attached to their word', () => {
		expect(arabicTokens('Team | فَريق and مُفْرَد')).toEqual(['فَريق', 'مُفْرَد']);
	});
});
