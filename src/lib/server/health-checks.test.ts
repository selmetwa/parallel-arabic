import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('$lib/server/redis', () => ({ getRedisClient: async () => null }));
vi.mock('$lib/server/email', () => ({ getMailgunClient: () => ({}), MAILGUN_DOMAIN: 'x' }));

const { diffFailures, recentSignups } = await import('./health-checks');

describe('diffFailures', () => {
	it('reports a new failure', () => {
		expect(diffFailures([], ['gemini'])).toEqual({ newlyFailing: ['gemini'], recovered: [] });
	});

	it('reports a recovery', () => {
		expect(diffFailures(['gemini'], [])).toEqual({ newlyFailing: [], recovered: ['gemini'] });
	});

	it('stays quiet while the state is unchanged', () => {
		expect(diffFailures(['gemini'], ['gemini'])).toEqual({ newlyFailing: [], recovered: [] });
	});

	it('handles failures and recoveries together', () => {
		expect(diffFailures(['gemini', 'stripe'], ['stripe', 'redis'])).toEqual({
			newlyFailing: ['redis'],
			recovered: ['gemini']
		});
	});
});

describe('recentSignups', () => {
	const now = Date.parse('2026-10-30T12:00:00Z');
	const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

	it('keeps signups between the grace period and 24h old', () => {
		const users = [
			{ id: 'fresh', email: 'a@x.com', created_at: minutesAgo(5) },
			{ id: 'hour', email: 'b@x.com', created_at: minutesAgo(60) },
			{ id: 'old', email: 'c@x.com', created_at: minutesAgo(25 * 60) }
		];
		expect(recentSignups(users, now).map((u) => u.id)).toEqual(['hour']);
	});

	it('skips users without an email', () => {
		const users = [{ id: 'apple', email: null, created_at: minutesAgo(60) }];
		expect(recentSignups(users, now)).toEqual([]);
	});
});
