import { describe, expect, it } from 'vitest';
import { canPause, pauseResumesAt, pausedPaidThrough, stripeAccessEnd } from './cancel-flow';

const NOV_30 = Date.UTC(2026, 10, 30, 12) / 1000;

describe('pauseResumesAt', () => {
	it('restarts billing just before the renewal, the given months on', () => {
		expect(pauseResumesAt(NOV_30, 2)).toBe(Date.UTC(2027, 0, 30, 11) / 1000);
	});

	it('lands on the last day of a shorter month', () => {
		const jan31 = Date.UTC(2027, 0, 31, 12) / 1000;
		expect(pauseResumesAt(jan31, 1)).toBe(Date.UTC(2027, 1, 28, 11) / 1000);
	});
});

describe('canPause', () => {
	const paying = { status: 'active', interval: 'month', cancelAtPeriodEnd: false, pausedUntil: null };

	it('allows a paying monthly plan', () => {
		expect(canPause(paying)).toBe(true);
	});

	it('rules out trials, annual plans, cancellations and existing pauses', () => {
		expect(canPause({ ...paying, status: 'trialing' })).toBe(false);
		expect(canPause({ ...paying, interval: 'year' })).toBe(false);
		expect(canPause({ ...paying, cancelAtPeriodEnd: true })).toBe(false);
		expect(canPause({ ...paying, pausedUntil: NOV_30 })).toBe(false);
	});
});

describe('stripeAccessEnd', () => {
	const active = { status: 'active', current_period_end: NOV_30 + 86400 * 30 };

	it('uses the current period normally', () => {
		expect(stripeAccessEnd(active)).toBe(active.current_period_end);
	});

	it('stops at the paid-through date while paused', () => {
		const paused = {
			...active,
			pause_collection: { resumes_at: NOV_30 + 86400 * 60 },
			metadata: { paid_through: String(NOV_30) }
		};
		expect(pausedPaidThrough(paused)).toBe(NOV_30);
		expect(stripeAccessEnd(paused)).toBe(NOV_30);
	});

	it('ignores a leftover paid-through date once the pause is over', () => {
		expect(stripeAccessEnd({ ...active, metadata: { paid_through: String(NOV_30) } })).toBe(
			active.current_period_end
		);
	});

	it('uses the trial end while trialing', () => {
		expect(stripeAccessEnd({ status: 'trialing', trial_end: NOV_30, current_period_end: 1 })).toBe(
			NOV_30
		);
	});
});
