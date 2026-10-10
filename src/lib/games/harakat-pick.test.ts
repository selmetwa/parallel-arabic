import { describe, expect, it } from 'vitest';
import { buildRound, decoys, playable, vowelSlots, OPTIONS, WORDS_PER_ROUND } from './harakat-pick';
import { VOCAB, wordFor } from './room-hunt/round';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

const fusha = Object.keys(VOCAB).map((id) => wordFor(id, 'fusha'));

describe('harakat pick', () => {
	it('finds the short vowels', () => {
		expect(vowelSlots('سَمَك')).toHaveLength(2);
		expect(vowelSlots('باب')).toHaveLength(0);
	});

	it('makes wrong spellings with the same letters and different vowels', () => {
		for (const word of playable(fusha)) {
			const wrong = decoys(word.arabic);
			expect(wrong, word.id).toHaveLength(OPTIONS - 1);
			for (const w of wrong) {
				expect(w).not.toBe(word.arabic);
				expect(stripArabicDiacritics(w)).toBe(stripArabicDiacritics(word.arabic));
			}
		}
	});

	it('builds a full round from the Room Hunt words', () => {
		expect(playable(fusha).length).toBeGreaterThanOrEqual(WORDS_PER_ROUND);
		const round = buildRound(fusha);
		expect(round).toHaveLength(WORDS_PER_ROUND);
		for (const q of round) {
			expect(new Set(q.options).size).toBe(OPTIONS);
			expect(q.options[q.answer]).toBe(q.word.arabic);
		}
	});
});
