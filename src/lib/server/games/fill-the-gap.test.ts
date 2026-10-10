import { describe, expect, it } from 'vitest';
import { fillTheGapPrompt, validateItem } from './fill-the-gap';

const good = {
	sentence: 'أنا بشرب قهوة كل يوم الصبح',
	answer: 'قهوة',
	distractors: ['كرسي', 'شباك', 'امبارح'],
	english: 'I drink coffee every morning',
	transliteration: 'ana bashrab 2ahwa kull yom is-sub7',
	explanation: 'You drink قهوة, not a chair.'
};

describe('validateItem', () => {
	it('finds the gap and keeps the answer among four choices', () => {
		const item = validateItem(good, new Set())!;
		expect(item.words[item.gapIndex]).toBe('قهوة');
		expect(item.options).toHaveLength(4);
		expect(item.options[item.answer]).toBe('قهوة');
	});

	it('rejects an answer that isn’t in the sentence, or is there twice', () => {
		expect(validateItem({ ...good, answer: 'شاي' }, new Set())).toBeNull();
		expect(
			validateItem({ ...good, sentence: 'قهوة ولا قهوة كل يوم الصبح' }, new Set())
		).toBeNull();
	});

	it('rejects distractors that are the answer spelled another way', () => {
		expect(
			validateItem({ ...good, distractors: ['قهوه', 'كرسي', 'شباك'] }, new Set())
		).toBeNull();
	});

	it('rejects multi-word answers and duplicate sentences', () => {
		expect(validateItem({ ...good, answer: 'قهوة كل' }, new Set())).toBeNull();
		const seen = new Set<string>();
		expect(validateItem(good, seen)).not.toBeNull();
		expect(validateItem(good, seen)).toBeNull();
	});
});

describe('fillTheGapPrompt', () => {
	it('mentions saved words only when given', () => {
		expect(fillTheGapPrompt('egyptian-arabic', 'beginner')).not.toContain('saved');
		expect(fillTheGapPrompt('egyptian-arabic', 'beginner', ['قطة'])).toContain('قطة');
	});
});
