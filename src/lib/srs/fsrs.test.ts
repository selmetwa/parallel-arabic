import { describe, expect, it } from 'vitest';
import {
	cardToRow,
	formatDue,
	formatInterval,
	masteryLevel,
	previewIntervals,
	retrievability,
	rowToCard,
	schedule,
	State,
	type SrsRow
} from './fsrs';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-15T12:00:00Z');

const newRow: SrsRow = {
	fsrs_stability: null,
	fsrs_difficulty: null,
	fsrs_state: 0,
	lapses: 0,
	repetitions: 0,
	interval_days: 0,
	next_review_date: null,
	last_review_date: null
};

// What docs/sql/2026-11-15-fsrs.sql produces for a word last reviewed 8 days ago at an 8-day interval.
const backfilledRow: SrsRow = {
	fsrs_stability: 8,
	fsrs_difficulty: 4,
	fsrs_state: 2,
	lapses: 0,
	repetitions: 3,
	interval_days: 8,
	next_review_date: now.getTime(),
	last_review_date: now.getTime() - 8 * DAY
};

describe('rowToCard / cardToRow', () => {
	it('treats a freshly saved word as a new card', () => {
		const card = rowToCard(newRow);
		expect(card.state).toBe(State.New);
		expect(card.reps).toBe(0);
		expect(card.last_review).toBeNull();
	});

	it('round-trips the scheduling columns', () => {
		const row = cardToRow(rowToCard(backfilledRow));
		expect(row).toMatchObject({
			fsrs_stability: 8,
			fsrs_difficulty: 4,
			fsrs_state: 2,
			repetitions: 3,
			interval_days: 8,
			next_review_date: backfilledRow.next_review_date,
			last_review_date: backfilledRow.last_review_date,
			is_learning: true,
			mastery_level: 3
		});
	});
});

describe('schedule', () => {
	it('schedules a new word rated Good at least a day out', () => {
		const { card } = schedule(rowToCard(newRow), 3, now);
		expect(card.state).toBe(State.Review);
		expect(card.scheduled_days).toBeGreaterThanOrEqual(1);
		expect(card.due.getTime()).toBe(now.getTime() + card.scheduled_days * DAY);
		expect(card.reps).toBe(1);
	});

	it('counts Again on a review card as a lapse and brings it back sooner', () => {
		const { card } = schedule(rowToCard(backfilledRow), 1, now);
		expect(card.state).toBe(State.Relearning);
		expect(card.lapses).toBe(1);
		expect(card.scheduled_days).toBeLessThan(8);
		expect(card.stability).toBeLessThan(8);
	});

	it('grows the interval for a converted word recalled on time', () => {
		const { card } = schedule(rowToCard(backfilledRow), 3, now);
		expect(card.scheduled_days).toBeGreaterThan(8);
	});
});

describe('previewIntervals', () => {
	it('orders intervals Again <= Hard <= Good <= Easy', () => {
		for (const row of [newRow, backfilledRow]) {
			const p = previewIntervals(rowToCard(row), now);
			expect(p[1]).toBeLessThanOrEqual(p[2]);
			expect(p[2]).toBeLessThanOrEqual(p[3]);
			expect(p[3]).toBeLessThanOrEqual(p[4]);
		}
	});

	it('matches what schedule() saves', () => {
		const card = rowToCard(backfilledRow);
		expect(previewIntervals(card, now)[4]).toBe(schedule(card, 4, now).card.scheduled_days);
	});
});

describe('retrievability', () => {
	it('is about 90% when a word is reviewed exactly on its due date', () => {
		expect(retrievability(rowToCard(backfilledRow), now)).toBeCloseTo(0.9, 2);
	});

	it('is 0 for a new word', () => {
		expect(retrievability(rowToCard(newRow), now)).toBe(0);
	});
});

describe('masteryLevel', () => {
	it('buckets by stability', () => {
		expect(masteryLevel(State.New, null)).toBe(0);
		expect(masteryLevel(State.Review, 0.5)).toBe(1);
		expect(masteryLevel(State.Review, 3)).toBe(2);
		expect(masteryLevel(State.Review, 20)).toBe(3);
		expect(masteryLevel(State.Review, 21)).toBe(4);
		expect(masteryLevel(State.Review, 400)).toBe(5);
	});
});

describe('formatting', () => {
	it('formats intervals compactly', () => {
		expect(formatInterval(1)).toBe('1d');
		expect(formatInterval(13)).toBe('13d');
		expect(formatInterval(21)).toBe('3w');
		expect(formatInterval(120)).toBe('4mo');
		expect(formatInterval(365)).toBe('1y');
		expect(formatInterval(550)).toBe('1.5y');
	});

	it('formats due dates relative to now', () => {
		const t = now.getTime();
		expect(formatDue(null, t)).toBe('today');
		expect(formatDue(t - DAY, t)).toBe('today');
		expect(formatDue(t + DAY, t)).toBe('tomorrow');
		expect(formatDue(t + 3 * DAY, t)).toBe('in 3d');
	});
});
