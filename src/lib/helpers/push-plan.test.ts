import { describe, expect, it } from 'vitest';
import { pickPush, type PushUser } from './push-plan';

const at = (iso: string) => Date.parse(iso);
/** 19:00 UTC: inside the evening window. */
const NOW = at('2026-10-12T19:00:00Z');
const daysAgo = (days: number) => NOW - days * 24 * 60 * 60 * 1000;

const user = (over: Partial<PushUser>): PushUser => ({
	current_streak: 0,
	longest_streak: 0,
	streak_freezes: 0,
	last_activity_date: null,
	onboarding_completed_at: null,
	timezone: 'UTC',
	push_sent_at: null,
	...over
});

describe('pickPush', () => {
	it('warns that a streak ends tonight', () => {
		expect(pickPush(user({ current_streak: 4, last_activity_date: daysAgo(1) }), NOW)).toBe('streak');
	});

	it('says nothing to someone who already practised today', () => {
		expect(pickPush(user({ current_streak: 4, last_activity_date: NOW - 60_000 }), NOW)).toBeNull();
	});

	it('nudges the day after onboarding if they never started', () => {
		expect(pickPush(user({ onboarding_completed_at: daysAgo(1) }), NOW)).toBe('first_day');
		expect(pickPush(user({ onboarding_completed_at: daysAgo(2) }), NOW)).toBeNull();
	});

	it('offers reviews on the second day away', () => {
		expect(pickPush(user({ last_activity_date: daysAgo(2) }), NOW)).toBe('reviews');
	});

	it('asks them back at three and seven days, then goes quiet', () => {
		expect(pickPush(user({ last_activity_date: daysAgo(3) }), NOW)).toBe('comeback');
		expect(pickPush(user({ last_activity_date: daysAgo(7) }), NOW)).toBe('comeback');
		for (const days of [4, 5, 6, 8, 30]) {
			expect(pickPush(user({ last_activity_date: daysAgo(days) }), NOW)).toBeNull();
		}
	});

	it('only sends in the learner’s evening', () => {
		// 19:00 UTC is midday in Los Angeles.
		const la = user({ current_streak: 4, last_activity_date: daysAgo(1), timezone: 'America/Los_Angeles' });
		expect(pickPush(la, NOW)).toBeNull();
	});

	it('never sends twice in one evening', () => {
		const sent = user({ current_streak: 4, last_activity_date: daysAgo(1), push_sent_at: NOW - 3_600_000 });
		expect(pickPush(sent, NOW)).toBeNull();
	});
});
