import { describe, expect, it } from 'vitest';
import { FIND_OPTIONS, QUESTIONS_PER_ROUND, buildRound, findOptions, isDistinct } from './dialect-match';
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

	it('can ask every hand-written set as a "find" question in any dialect', () => {
		for (const item of items.filter((i) => !/^(room|phrase)-/.test(i.id))) {
			for (const d of GAME_DIALECTS) {
				expect(findOptions(item, d), `${item.id} ${d}`).not.toBeNull();
			}
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
					expect(q.options).toHaveLength(FIND_OPTIONS);
					expect(q.options).toContain(q.dialect);
					const forms = q.options.map((d) => q.item.forms[d].arabic);
					expect(new Set(forms).size).toBe(FIND_OPTIONS);
				} else {
					expect(isDistinct(q.item, q.dialect)).toBe(true);
				}
				if (q.kind === 'listen') expect(q.item.forms[q.dialect].audioUrl).toBeTruthy();
			}
		}
	});
});
