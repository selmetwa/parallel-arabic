import { describe, expect, it } from 'vitest';
import { sortByDifficulty, validatePuzzle } from './odd-one-out';
import { validateItem } from './spot-the-mistake';

const w = (arabic: string, english = 'x') => ({ arabic, english, transliteration: '' });

describe('validatePuzzle', () => {
	const good = {
		words: [w('كتاب'), w('مكتب'), w('كاتب'), w('شراب')],
		oddWord: 'شراب',
		pattern: 'root',
		explanation: 'Three share the root ك-ت-ب.',
		difficulty: 'hard'
	};

	it('finds the odd word and keeps its index right after shuffling', () => {
		for (let i = 0; i < 20; i++) {
			const p = validatePuzzle(good, new Set())!;
			expect(p.words[p.oddIndex].arabic).toBe('شراب');
			expect(p.words).toHaveLength(4);
		}
	});

	it('moves the odd word around rather than leaving it where the model put it', () => {
		const positions = new Set(
			Array.from({ length: 40 }, () => validatePuzzle(good, new Set())!.oddIndex)
		);
		expect(positions.size).toBeGreaterThan(1);
	});

	it('drops puzzles that are not four distinct single words', () => {
		expect(validatePuzzle({ ...good, words: good.words.slice(0, 3) }, new Set())).toBeNull();
		expect(
			validatePuzzle({ ...good, words: [w('كتاب'), w('كتاب'), w('كاتب'), w('شراب')] }, new Set())
		).toBeNull();
		expect(
			validatePuzzle(
				{ ...good, words: [w('كتاب كبير'), w('مكتب'), w('كاتب'), w('شراب')] },
				new Set()
			)
		).toBeNull();
	});

	it('drops puzzles whose odd word is not exactly one of the four', () => {
		expect(validatePuzzle({ ...good, oddWord: 'قلم' }, new Set())).toBeNull();
	});

	it('coerces unknown labels and drops repeats', () => {
		const seen = new Set<string>();
		expect(validatePuzzle({ ...good, pattern: 'vibes', difficulty: '?' }, seen)).toMatchObject({
			pattern: 'meaning',
			difficulty: 'medium'
		});
		expect(validatePuzzle(good, seen)).toBeNull();
	});

	it('sorts easy to hard', () => {
		const make = (difficulty: string) =>
			validatePuzzle(
				{
					...good,
					words: [w(`كتاب${difficulty.length}`), w('مكتب'), w('كاتب'), w('شراب')],
					difficulty
				},
				new Set()
			)!;
		expect(
			sortByDifficulty([make('hard'), make('easy'), make('medium')]).map((p) => p.difficulty)
		).toEqual(['easy', 'medium', 'hard']);
	});
});

describe('validateItem', () => {
	const good = {
		incorrect: 'البنت دي طويل.',
		wrongWord: 'طويل',
		correction: 'طويلة',
		correct: 'البنت دي طويلة.',
		english: 'This girl is tall.',
		transliteration: 'il-bint di tawiila',
		errorType: 'gender',
		explanation: 'البنت is feminine.'
	};

	it('locates the wrong word and strips punctuation from the tokens', () => {
		expect(validateItem(good, new Set())).toMatchObject({
			words: ['البنت', 'دي', 'طويل'],
			wrongIndex: 2,
			correction: 'طويلة'
		});
	});

	it('drops items where the wrong word appears zero times or twice', () => {
		expect(validateItem({ ...good, wrongWord: 'قصير' }, new Set())).toBeNull();
		expect(
			validateItem(
				{ ...good, incorrect: 'طويل البنت دي طويل', correct: 'طويل البنت دي طويلة' },
				new Set()
			)
		).toBeNull();
	});

	it('drops items where the correction does not produce the corrected sentence', () => {
		expect(validateItem({ ...good, correct: 'الولد ده طويل' }, new Set())).toBeNull();
	});

	it('drops spelling-only "mistakes"', () => {
		expect(
			validateItem(
				{
					...good,
					incorrect: 'المدرسه دي كبيرة',
					wrongWord: 'المدرسه',
					correction: 'المدرسة',
					correct: 'المدرسة دي كبيرة'
				},
				new Set()
			)
		).toBeNull();
	});

	it('coerces unknown error types', () => {
		expect(validateItem({ ...good, errorType: 'misc' }, new Set())?.errorType).toBe('grammar');
	});
});
