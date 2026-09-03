import { describe, it, expect } from 'vitest';
import { buildMultipleChoice } from './quiz-questions';

const pool = [
	{ arabic_word: 'قوي', english_word: 'very' },
	{ arabic_word: 'جدا', english_word: 'very' },
	{ arabic_word: 'قهوة', english_word: 'coffee' },
	{ arabic_word: 'شاي', english_word: 'tea' },
	{ arabic_word: 'مية', english_word: 'water' },
	{ arabic_word: 'أكل', english_word: 'food' }
];

describe('buildMultipleChoice', () => {
	it('offers four distinct options including the answer', () => {
		for (let i = 0; i < 50; i++) {
			const { options, correctAnswer } = buildMultipleChoice(pool[2], pool);
			expect(options).toContain(correctAnswer);
			expect(new Set(options).size).toBe(options.length);
		}
	});

	it('never shows two options that read the same', () => {
		// قوي and جدا both gloss as "very"; asking arabic-to-english must not
		// offer "very" twice.
		for (let i = 0; i < 50; i++) {
			const { options } = buildMultipleChoice(pool[0], pool, 'arabic-to-english');
			expect(new Set(options).size).toBe(options.length);
		}
	});

	it('honours a pinned direction', () => {
		const en = buildMultipleChoice(pool[2], pool, 'arabic-to-english');
		expect(en.correctAnswer).toBe('coffee');

		const ar = buildMultipleChoice(pool[2], pool, 'english-to-arabic');
		expect(ar.correctAnswer).toBe('قهوة');
	});

	it('degrades rather than throwing when the pool is tiny', () => {
		const { options, correctAnswer } = buildMultipleChoice(pool[0], [pool[0], pool[2]]);
		expect(options).toContain(correctAnswer);
		expect(options.length).toBeLessThanOrEqual(4);
	});
});
