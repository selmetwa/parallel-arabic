import { describe, expect, it } from 'vitest';
import { OPTIONS, WORDS_PER_ROUND, buildRound, nearMiss } from './listen-and-spell';
import { normalizeArabicTextLight } from '$lib/utils/arabic-normalization';
import type { GameWord } from './word-pool';

const PLAINS = ['سمك', 'صباح', 'طاولة', 'تفاح', 'حليب', 'قهوة', 'كتاب', 'دجاج', 'زيت', 'خبز'];

function word(plain: string, i: number, audio = true): GameWord {
	return {
		id: String(i),
		arabic: plain,
		plain,
		english: `w${i}`,
		transliteration: '',
		audioUrl: audio ? `https://a/${i}.mp3` : null
	};
}

const pool = PLAINS.map((p, i) => word(p, i));

describe('nearMiss', () => {
	it('swaps exactly one sound-alike letter', () => {
		const miss = nearMiss('سمك')!;
		expect(miss).not.toBe('سمك');
		expect([...miss].filter((c, i) => c !== [...'سمك'][i])).toHaveLength(1);
	});

	it('returns null when no letter has a sound-alike partner', () => {
		expect(nearMiss('بيل')).toBeNull();
	});
});

describe('buildRound', () => {
	it('asks about recorded words only, each with four different spellings', () => {
		const round = buildRound([...pool, word('بيت', 99, false)]);
		expect(round).toHaveLength(WORDS_PER_ROUND);
		for (const q of round) {
			expect(q.word.audioUrl).toBeTruthy();
			expect(q.options).toHaveLength(OPTIONS);
			expect(q.options[q.answer]).toBe(q.word.plain);
			expect(new Set(q.options.map((o) => normalizeArabicTextLight(o))).size).toBe(OPTIONS);
		}
	});
});
