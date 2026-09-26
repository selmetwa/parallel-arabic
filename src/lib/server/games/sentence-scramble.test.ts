import { describe, expect, it } from 'vitest';
import { validateSentence } from './sentence-scramble';
import {
	isCorrectOrder,
	scrambleWords,
	tokenize,
	wrongPositions
} from '$lib/games/sentence-scramble';

describe('tokenize', () => {
	it('strips edge punctuation but keeps attached prefixes', () => {
		expect(tokenize('بتروح المدرسة بالعربية؟')).toEqual(['بتروح', 'المدرسة', 'بالعربية']);
	});
});

describe('order checks', () => {
	const words = ['أنا', 'عايز', 'أشرب', 'شاي'];

	it('accepts the sentence regardless of tashkeel', () => {
		expect(isCorrectOrder(['أَنا', 'عايز', 'أشرب', 'شاي'], words)).toBe(true);
		expect(isCorrectOrder(['عايز', 'أنا', 'أشرب', 'شاي'], words)).toBe(false);
	});

	it('marks the positions that are wrong', () => {
		expect(wrongPositions(['عايز', 'أنا', 'أشرب', 'شاي'], words)).toEqual([0, 1]);
	});

	it('never deals the words already in order', () => {
		for (let i = 0; i < 20; i++) {
			expect(scrambleWords(words).map((t) => t.word)).not.toEqual(words);
		}
	});
});

describe('validateSentence', () => {
	it('keeps display spelling and strips tashkeel', () => {
		const s = validateSentence(
			{ arabic: 'المَدرسة كبيرة أوي.', english: 'The school is very big.', transliteration: 'x' },
			'beginner',
			new Set()
		);
		// ة and أ are kept as written; only the tashkeel goes.
		expect(s?.arabic).toBe('المدرسة كبيرة أوي.');
		expect(s?.words).toEqual(['المدرسة', 'كبيرة', 'أوي']);
	});

	it('enforces the word count for the level', () => {
		const seen = new Set<string>();
		expect(
			validateSentence({ arabic: 'أنا عايز أشرب شاي', english: 'x' }, 'beginner', seen)
		).not.toBeNull();
		expect(
			validateSentence({ arabic: 'أنا عايز أشرب شاي', english: 'x' }, 'advanced', new Set())
		).toBeNull();
	});

	it('rejects Latin, repeats and duplicates', () => {
		expect(
			validateSentence({ arabic: 'أنا بحب pizza كتير', english: 'x' }, 'beginner', new Set())
		).toBeNull();
		expect(
			validateSentence({ arabic: 'لا لا لا', english: 'x' }, 'beginner', new Set())
		).toBeNull();
		const seen = new Set<string>();
		validateSentence({ arabic: 'البيت ده كبير أوي', english: 'x' }, 'beginner', seen);
		expect(
			validateSentence({ arabic: 'البيت دَه كبير أوي', english: 'x' }, 'beginner', seen)
		).toBeNull();
	});
});
