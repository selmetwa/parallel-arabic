import { describe, expect, it } from 'vitest';
import { QUESTIONS_PER_ROUND, allDistinct, buildRound, isDistinct } from './dialect-match';
import { dialectMatchItems } from '$lib/server/games/dialect-match-items';
import { GAME_DIALECTS } from './themes';

const items = dialectMatchItems();

describe('dialectMatchItems', () => {
	it('has every dialect for every item, with Arabic and transliteration', () => {
		expect(items.length).toBeGreaterThan(60);
		for (const item of items) {
			for (const d of GAME_DIALECTS) {
				expect(item.forms[d]?.arabic, `${item.id} ${d}`).toBeTruthy();
				expect(item.forms[d]?.transliteration, `${item.id} ${d}`).toBeTruthy();
			}
		}
	});

	it('keeps the hand-written sets four-way distinct', () => {
		for (const item of items.filter((i) => !/^(room|phrase)-/.test(i.id))) {
			expect(allDistinct(item), item.id).toBe(true);
		}
	});

	it('writes transliteration without accents', () => {
		for (const item of items) {
			for (const d of GAME_DIALECTS) {
				expect(item.forms[d].transliteration, `${item.id} ${d}`).not.toMatch(/[áéíóúāēīōūšḥ]/);
			}
		}
	});
});

describe('buildRound', () => {
	it('builds a full round of unambiguous questions, each item once', () => {
		for (let run = 0; run < 20; run++) {
			const round = buildRound(items);
			expect(round).toHaveLength(QUESTIONS_PER_ROUND);
			expect(new Set(round.map((q) => q.item.id)).size).toBe(round.length);
			for (const q of round) {
				if (q.kind === 'find') {
					expect(allDistinct(q.item)).toBe(true);
					expect([...q.options].sort()).toEqual([...GAME_DIALECTS].sort());
				} else {
					expect(isDistinct(q.item, q.dialect)).toBe(true);
				}
				if (q.kind === 'listen') expect(q.item.forms[q.dialect].audioUrl).toBeTruthy();
			}
		}
	});
});
