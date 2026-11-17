import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/constants/feature-flags', () => ({ NUR_ENABLED: true }));

const { learnerVariety } = await import('./learner-variety');

const locals = { user: { target_dialect: 'levantine', target_variety: 'lebanese' } } as unknown as App.Locals;

describe('learnerVariety', () => {
	it('uses an accent the page picked for this session', () => {
		expect(learnerVariety(locals, 'levantine', 'jordanian')?.key).toBe('jordanian');
		expect(learnerVariety(locals, 'khaleeji', 'omani')?.key).toBe('omani');
	});

	it("falls back to the learner's own variety, then the default", () => {
		expect(learnerVariety(locals, 'levantine')?.key).toBe('lebanese');
		expect(learnerVariety(locals, 'khaleeji')?.key).toBe('emirati');
	});

	it('ignores an accent from another dialect or junk', () => {
		expect(learnerVariety(locals, 'levantine', 'kuwaiti')?.key).toBe('lebanese');
		expect(learnerVariety(locals, 'levantine', { evil: true })?.key).toBe('lebanese');
		expect(learnerVariety(locals, 'egyptian-arabic', 'lebanese')).toBeUndefined();
	});
});
