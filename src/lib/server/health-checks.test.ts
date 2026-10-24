import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('$lib/server/redis', () => ({ getRedisClient: async () => null }));
vi.mock('$lib/server/email', () => ({ getMailgunClient: () => ({}), MAILGUN_DOMAIN: 'x' }));

const { diffFailures } = await import('./health-checks');

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
