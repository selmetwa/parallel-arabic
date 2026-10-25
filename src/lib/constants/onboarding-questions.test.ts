import { describe, expect, it } from 'vitest';
import { parseGoal } from './daily-goal';
import {
	CHALLENGES,
	DAILY_MINUTES,
	buildGoal,
	challengeHelp,
	minutesToGoal,
	parseChallenges
} from './onboarding-questions';
import { FEATURES } from './features';
import { REMINDER_WINDOWS, inReminderWindow, streakGoalLine, type ReminderTime } from '$lib/helpers/streak';

describe('minutesToGoal', () => {
	it('turns every slider stop into a valid daily goal', () => {
		for (const minutes of DAILY_MINUTES) expect(parseGoal(minutesToGoal(minutes))).not.toBeNull();
	});

	it('asks for more as the time goes up', () => {
		expect(minutesToGoal(5)).toHaveLength(1);
		expect(minutesToGoal(15)).toHaveLength(2);
		expect(minutesToGoal(30)).toHaveLength(3);
	});
});

describe('buildGoal', () => {
	it('leads with what they find hard, sized by their time', () => {
		expect(buildGoal(15, ['speaking'], 'egyptian-arabic')).toEqual([
			{ kind: 'speak', target: 5 },
			{ kind: 'review', target: 10 }
		]);
		expect(buildGoal(5, ['listening', 'grammar'], 'levantine')).toEqual([{ kind: 'story', target: 1 }]);
	});

	it('never repeats a kind and tops up from the presets', () => {
		expect(buildGoal(30, ['grammar', 'where_to_start'], 'egyptian-arabic')).toEqual([
			{ kind: 'lesson', target: 1 },
			{ kind: 'review', target: 20 },
			{ kind: 'game', target: 1 }
		]);
	});

	it('makes a valid goal for every combination', () => {
		for (const minutes of DAILY_MINUTES)
			for (const c of CHALLENGES)
				for (const dialect of ['egyptian-arabic', 'saudi'])
					expect(parseGoal(buildGoal(minutes, [c.id], dialect))).not.toBeNull();
	});
});

describe('challengeHelp', () => {
	it('points every challenge at a real feature screenshot', () => {
		for (const c of CHALLENGES)
			expect(FEATURES.some((f) => f.slug === challengeHelp(c.id, 'saudi', 'Saudi Arabic').feature)).toBe(true);
	});

	it("doesn't promise stories to dialects without them", () => {
		expect(challengeHelp('listening', 'saudi', 'Saudi Arabic').goal.kind).not.toBe('story');
		expect(challengeHelp('listening', 'saudi', 'Saudi Arabic').start).toBeUndefined();
		expect(challengeHelp('listening', 'levantine', 'Levantine Arabic').goal.kind).toBe('story');
	});
});

describe('parseChallenges', () => {
	it('keeps known ids once each and drops the rest', () => {
		expect(parseChallenges(['speaking', 'speaking', 'nope', 'grammar'])).toEqual(['speaking', 'grammar']);
		expect(parseChallenges([])).toBeNull();
		expect(parseChallenges('speaking')).toBeNull();
	});
});

describe('inReminderWindow', () => {
	it('defaults to the evening and never fires when off', () => {
		expect(inReminderWindow(18, null)).toBe(true);
		expect(inReminderWindow(9, null)).toBe(false);
		expect(inReminderWindow(18, 'off')).toBe(false);
	});

	it('wraps the night window past midnight', () => {
		expect(inReminderWindow(22, 'night')).toBe(true);
		expect(inReminderWindow(1, 'night')).toBe(true);
		expect(inReminderWindow(4, 'night')).toBe(false);
	});

	// The crons run at 00, 06, 12 and 18 UTC, and Hobby fires anywhere within the hour.
	it('reaches every time zone at least once a day in every window', () => {
		const runs = [0, 6, 12, 18];
		for (const window of Object.keys(REMINDER_WINDOWS) as ReminderTime[]) {
			for (let offset = -12 * 60; offset <= 14 * 60; offset += 30) {
				for (const delay of [0, 59]) {
					const hits = runs.filter((run) => {
						const minutes = (((run * 60 + delay + offset) % 1440) + 1440) % 1440;
						return inReminderWindow(Math.floor(minutes / 60), window);
					});
					expect(hits.length, `${window} at UTC${offset / 60} +${delay}m`).toBeGreaterThan(0);
				}
			}
		}
	});
});

describe('streakGoalLine', () => {
	it('mentions the goal only while it is still ahead', () => {
		expect(streakGoalLine(6, 14)).toBe('Day 6 of your 14-day goal. A few minutes keeps it going.');
		expect(streakGoalLine(14, 14)).toBeNull();
		expect(streakGoalLine(6, null)).toBeNull();
	});
});
