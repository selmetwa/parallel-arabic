import { describe, expect, it, vi } from 'vitest';

const flags = vi.hoisted(() => ({ nur: false }));
vi.mock('$lib/constants/feature-flags', () => ({
	get NUR_ENABLED() {
		return flags.nur;
	}
}));
vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('$lib/server/redis', () => ({ getRedisClient: async () => null }));
vi.mock('$lib/server/email', () => ({ getMailgunClient: () => ({}), MAILGUN_DOMAIN: 'x' }));

const { diffFailures, recentSignups, checkEesi } = await import('./health-checks');
const { env } = await import('$env/dynamic/private');

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

describe('checkEesi', () => {
	const respond = (status: number, body = new Uint8Array([1, 2, 3])) =>
		vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status })));

	it('passes when a word is spoken', async () => {
		(env as Record<string, string>).EESI_API_KEY = 'k';
		respond(200);
		await expect(checkEesi()).resolves.toBeTruthy();
	});

	it('names running out of credits', async () => {
		respond(429);
		await expect(checkEesi()).rejects.toThrow(/out of credits/);
	});

	it('names a bad key', async () => {
		respond(401);
		await expect(checkEesi()).rejects.toThrow(/invalid API key/);
	});

	it('fails on empty audio', async () => {
		respond(200, new Uint8Array());
		await expect(checkEesi()).rejects.toThrow(/empty audio/);
	});

	it('stays quiet without a key while the flag is off', async () => {
		delete (env as Record<string, string>).EESI_API_KEY;
		await expect(checkEesi()).resolves.toBe('not configured');
	});

	it('fails without a key once the flag is on', async () => {
		flags.nur = true;
		await expect(checkEesi()).rejects.toThrow(/EESI_API_KEY is not set/);
		flags.nur = false;
	});
});
