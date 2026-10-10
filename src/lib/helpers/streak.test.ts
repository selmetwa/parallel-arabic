import { describe, expect, it } from 'vitest';
import {
	daysBetween,
	earnedBadges,
	localDayKey,
	localHour,
	nextStreak,
	safeTimeZone,
	streakAtRisk,
	type StreakState
} from './streak';

const at = (iso: string) => Date.parse(iso);
const state = (over: Partial<StreakState>): StreakState => ({
	current: 3,
	longest: 3,
	freezes: 0,
	lastActivity: at('2026-10-09T20:00:00Z'),
	timezone: 'UTC',
	...over
});

describe('local days', () => {
	it('uses the learner’s calendar day, not UTC’s', () => {
		// 03:00 UTC on the 10th is still the evening of the 9th in Los Angeles.
		expect(localDayKey(at('2026-10-10T03:00:00Z'), 'America/Los_Angeles')).toBe('2026-10-09');
		expect(localDayKey(at('2026-10-10T03:00:00Z'), 'UTC')).toBe('2026-10-10');
		expect(localHour(at('2026-10-10T03:00:00Z'), 'America/Los_Angeles')).toBe(20);
	});

	it('falls back to UTC for an unknown time zone', () => {
		expect(safeTimeZone('Not/AZone')).toBe('UTC');
		expect(safeTimeZone(null)).toBe('UTC');
	});

	it('counts days between keys across months', () => {
		expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1);
		expect(daysBetween('2026-10-10', '2026-10-10')).toBe(0);
	});
});

describe('nextStreak', () => {
	it('starts at 1 for a first activity', () => {
		expect(nextStreak(state({ current: 0, longest: 0, lastActivity: null }), Date.now())).toMatchObject({
			current: 1,
			newDay: true
		});
	});

	it('keeps the streak on a second activity the same day', () => {
		expect(nextStreak(state({}), at('2026-10-09T22:00:00Z'))).toMatchObject({ current: 3, newDay: false });
	});

	it('adds a day for activity the next day', () => {
		expect(nextStreak(state({}), at('2026-10-10T09:00:00Z'))).toMatchObject({ current: 4, newDay: true });
	});

	it('resets after a missed day with no freeze', () => {
		expect(nextStreak(state({}), at('2026-10-11T09:00:00Z')).current).toBe(1);
	});

	it('uses a freeze for one missed day', () => {
		const next = nextStreak(state({ freezes: 1 }), at('2026-10-11T09:00:00Z'));
		expect(next).toMatchObject({ current: 4, freezes: 0, freezesUsed: 1 });
	});

	it('resets when the missed days outnumber the freezes', () => {
		expect(nextStreak(state({ freezes: 1 }), at('2026-10-12T09:00:00Z'))).toMatchObject({
			current: 1,
			freezes: 1
		});
	});

	it('earns a freeze every seventh day, up to two', () => {
		expect(nextStreak(state({ current: 6, longest: 6 }), at('2026-10-10T09:00:00Z'))).toMatchObject({
			current: 7,
			freezes: 1,
			freezeEarned: true
		});
		expect(nextStreak(state({ current: 13, freezes: 2 }), at('2026-10-10T09:00:00Z'))).toMatchObject({
			freezes: 2,
			freezeEarned: false
		});
	});

	it('follows the learner’s time zone, not UTC midnight', () => {
		// Active 20:00 Los Angeles on the 8th (03:00 UTC on the 9th), then 20:00 on the 9th.
		const la = state({ lastActivity: at('2026-10-09T03:00:00Z'), timezone: 'America/Los_Angeles' });
		expect(nextStreak(la, at('2026-10-10T03:00:00Z')).current).toBe(4);
	});
});

describe('streakAtRisk', () => {
	it('is true only when last active yesterday and not yet today', () => {
		expect(streakAtRisk(state({}), at('2026-10-10T19:00:00Z'))).toBe(true);
		expect(streakAtRisk(state({}), at('2026-10-09T23:00:00Z'))).toBe(false);
		expect(streakAtRisk(state({ current: 0 }), at('2026-10-10T19:00:00Z'))).toBe(false);
	});
});

describe('earnedBadges', () => {
	it('gives the badges up to the longest streak', () => {
		expect(earnedBadges(6)).toHaveLength(0);
		expect(earnedBadges(30).map((b) => b.days)).toEqual([7, 30]);
	});
});
