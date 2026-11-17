import { describe, expect, it, vi } from 'vitest';

vi.mock('./feature-flags', () => ({ NUR_ENABLED: true }));

const { resolveVariety, nurVoiceFor, varietiesFor, VARIETIES, getVarietyInfo, varietyKeyWords } = await import('./varieties');
const { VARIETY_LANDING } = await import('./variety-landing');

describe('resolveVariety', () => {
	it("uses the learner's variety on their own dialect", () => {
		const user = { target_dialect: 'levantine', target_variety: 'lebanese' };
		expect(resolveVariety('levantine', user)?.key).toBe('lebanese');
	});

	it('falls back to the default when the learner has none', () => {
		expect(resolveVariety('levantine', { target_dialect: 'levantine', target_variety: null })?.key).toBe('syrian');
		expect(resolveVariety('khaleeji', null)?.key).toBe('emirati');
	});

	it("ignores a variety that belongs to another dialect", () => {
		const user = { target_dialect: 'levantine', target_variety: 'kuwaiti' };
		expect(resolveVariety('levantine', user)?.key).toBe('syrian');
	});

	it("uses the default when browsing a dialect that isn't theirs", () => {
		const user = { target_dialect: 'khaleeji', target_variety: 'omani' };
		expect(resolveVariety('levantine', user)?.key).toBe('syrian');
	});

	it('has no variety for dialects without them', () => {
		expect(resolveVariety('egyptian-arabic', null)).toBeUndefined();
		expect(varietiesFor('saudi')).toEqual([]);
	});
});

describe('nurVoiceFor', () => {
	it("prefers the variety's voice over the dialect's", () => {
		expect(nurVoiceFor('levantine', getVarietyInfo('lebanese')).voice).toBe('ev_3497d80d');
		expect(nurVoiceFor('levantine').voice).toBe('ev_759bdc08');
	});

	it('only sends documented language codes', () => {
		expect(nurVoiceFor('egyptian-arabic').language).toBe('arz');
		expect(nurVoiceFor('iraqi').language).toBeUndefined();
		expect(nurVoiceFor('saudi').language).toBeUndefined();
	});
});

describe('variety landing content', () => {
	it('fits search results', () => {
		for (const v of VARIETIES) {
			expect(VARIETY_LANDING[v.key].seo.title.length).toBeLessThanOrEqual(60);
			expect(VARIETY_LANDING[v.key].seo.description.length).toBeLessThanOrEqual(160);
		}
	});

	it('has an everyday word table for every variety', () => {
		for (const v of VARIETIES) expect(varietyKeyWords(v).length).toBeGreaterThanOrEqual(5);
	});

	it('exists for every variety, with unique slugs', () => {
		for (const v of VARIETIES) expect(VARIETY_LANDING[v.key].phrases.length).toBeGreaterThan(0);
		expect(new Set(VARIETIES.map((v) => v.slug)).size).toBe(VARIETIES.length);
	});
});
