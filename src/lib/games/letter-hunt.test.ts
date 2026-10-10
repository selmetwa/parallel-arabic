import { describe, expect, it } from 'vitest';
import { LETTERS, OPTIONS, QUESTIONS_PER_ROUND, buildRound, formOf } from './letter-hunt';

describe('buildRound', () => {
	it('asks ten different letters, each with four distinct options', () => {
		for (let run = 0; run < 20; run++) {
			const round = buildRound();
			expect(round).toHaveLength(QUESTIONS_PER_ROUND);
			expect(new Set(round.map((q) => q.letter.key)).size).toBe(QUESTIONS_PER_ROUND);
			for (const q of round) {
				expect(q.options).toHaveLength(OPTIONS);
				const keys = q.options.map((o) => (typeof o === 'string' ? o : o.key));
				expect(new Set(keys).size).toBe(OPTIONS);
			}
		}
	});

	it('puts the right answer at the answer index', () => {
		for (const q of buildRound()) {
			const right = q.options[q.answer];
			if (q.kind === 'letter-to-form') expect(right).toBe(formOf(q.letter, q.position));
			else expect(right).toBe(q.letter);
		}
	});

	it('only asks about forms a letter really has', () => {
		for (let run = 0; run < 20; run++) {
			for (const q of buildRound()) {
				if (q.kind !== 'sound-to-letter') expect(formOf(q.letter, q.position)).toBeTruthy();
			}
		}
	});
});

describe('LETTERS', () => {
	it('has all 28 letters with an audio key', () => {
		expect(LETTERS).toHaveLength(28);
		expect(LETTERS.every((l) => l.key)).toBe(true);
	});
});
