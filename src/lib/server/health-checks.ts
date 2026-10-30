import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { Stripe } from 'stripe';
import { supabase } from '$lib/supabaseClient';
import { getRedisClient } from '$lib/server/redis';
import { getMailgunClient, MAILGUN_DOMAIN } from '$lib/server/email';

const HOUR_MS = 60 * 60 * 1000;
const CHECK_TIMEOUT_MS = 10_000;
/** Warn before ElevenLabs runs out, not after. */
const ELEVENLABS_USAGE_LIMIT = 0.8;
/** Signups this recent may still be mid-sync, so they don't count as orphaned yet. */
const SIGNUP_GRACE_MS = 15 * 60 * 1000;
/** A stray orphan shows up every few days; a broken sync makes one per signup. */
const ORPHAN_SIGNUP_LIMIT = 3;

const REQUIRED_ENV = [
	'GEMINI_API_KEY',
	'ELEVENLABS_API_KEY',
	'SUPABASE_SERVICE_ROLE_KEY',
	'STRIPE_SECRET',
	'STRIPE_MONTHLY_PRICE_ID',
	'STRIPE_ANNUAL_PRICE_ID',
	'MAILGUN_KEY',
	'REDIS_URL',
	'CRON_SECRET',
	'REVENUECAT_API_KEY'
];

/** How stale each cron's heartbeat may get before it counts as not running. */
const CRON_MAX_AGE_MS: Record<string, number> = {
	'send-streak-reminders': 7 * HOUR_MS,
	'reset-weekly-stats': 26 * HOUR_MS,
	'onboarding-nudge': 26 * HOUR_MS,
	'weekly-recap': 8 * 24 * HOUR_MS
};

const cronKey = (name: string) => `cron:last_run:${name}`;

type AuthUser = { id: string; email?: string | null; created_at: string };

/**
 * Auth users from the last day, old enough that sync should have created their
 * public.user row. Users without that row are treated as logged out, which is how
 * an RLS change silently broke every signup in Oct 2026.
 */
export function recentSignups(users: AuthUser[], now: number) {
	return users.filter((u) => {
		const age = now - Date.parse(u.created_at);
		// No email is Apple's hidden-email case, which sync refuses on purpose.
		return u.email && age > SIGNUP_GRACE_MS && age < 24 * HOUR_MS;
	});
}

export type CheckResult = { name: string; ok: boolean; detail?: string };

type Check = { name: string; run: () => Promise<string | void> };

const checks: Check[] = [
	{
		name: 'env',
		run: async () => {
			const missing = REQUIRED_ENV.filter((key) => !env[key]);
			if (missing.length) throw new Error(`missing ${missing.join(', ')}`);
		}
	},
	{
		name: 'gemini',
		run: async () => {
			const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
			await ai.models.generateContent({
				model: 'gemini-2.5-flash',
				contents: 'ok',
				config: { maxOutputTokens: 5, thinkingConfig: { thinkingBudget: 0 } }
			});
		}
	},
	{
		name: 'elevenlabs',
		run: async () => {
			const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
				headers: { 'xi-api-key': env.ELEVENLABS_API_KEY ?? '' }
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const { character_count, character_limit } = await res.json();
			const used = character_count / character_limit;
			const detail = `${Math.round(used * 100)}% of characters used`;
			if (used >= ELEVENLABS_USAGE_LIMIT) throw new Error(detail);
			return detail;
		}
	},
	{
		name: 'supabase',
		run: async () => {
			const { error } = await supabase.from('user').select('id', { head: true, count: 'exact' });
			if (error) throw new Error(error.message);
		}
	},
	{
		name: 'signups',
		run: async () => {
			const users: AuthUser[] = [];
			for (let page = 1; ; page++) {
				const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
				if (error) throw new Error(error.message);
				users.push(...data.users);
				if (data.users.length < 1000) break;
			}
			const recent = recentSignups(users, Date.now());
			if (!recent.length) return 'no signups in 24h';
			const { data: rows, error } = await supabase
				.from('user')
				.select('supabase_auth_id')
				.in('supabase_auth_id', recent.map((u) => u.id));
			if (error) throw new Error(error.message);
			const linked = new Set((rows ?? []).map((r) => r.supabase_auth_id));
			const orphans = recent.filter((u) => !linked.has(u.id));
			const detail = `${orphans.length} of ${recent.length} signups in 24h have no public.user row`;
			if (orphans.length >= ORPHAN_SIGNUP_LIMIT) throw new Error(detail);
			return detail;
		}
	},
	{
		name: 'redis',
		run: async () => {
			const redis = await getRedisClient();
			if (!redis) throw new Error('no connection');
			await redis.ping();
		}
	},
	{
		name: 'stripe',
		run: async () => {
			const stripe = new Stripe(env.STRIPE_SECRET ?? '');
			for (const id of [env.STRIPE_MONTHLY_PRICE_ID, env.STRIPE_ANNUAL_PRICE_ID]) {
				const price = await stripe.prices.retrieve(id ?? '');
				if (!price.active) throw new Error(`price ${id} is archived`);
			}
		}
	},
	{
		name: 'mailgun',
		run: async () => {
			const domain = await getMailgunClient().domains.get(MAILGUN_DOMAIN);
			if (domain.state !== 'active') throw new Error(`domain state is ${domain.state}`);
		}
	},
	{
		name: 'crons',
		run: async () => {
			const redis = await getRedisClient();
			if (!redis) throw new Error('redis unavailable, cannot read heartbeats');
			const now = Date.now();
			const stale: string[] = [];
			for (const [name, maxAge] of Object.entries(CRON_MAX_AGE_MS)) {
				const lastRun = await redis.get(cronKey(name));
				// No heartbeat yet means the cron hasn't run since this shipped; don't alert on that.
				if (lastRun && now - Number(lastRun) > maxAge) {
					stale.push(`${name} (last ran ${Math.round((now - Number(lastRun)) / HOUR_MS)}h ago)`);
				}
			}
			if (stale.length) throw new Error(`stale: ${stale.join(', ')}`);
		}
	}
];

function withTimeout<T>(promise: Promise<T>): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS / 1000}s`)), CHECK_TIMEOUT_MS)
		)
	]);
}

export async function runHealthChecks(): Promise<CheckResult[]> {
	const settled = await Promise.allSettled(checks.map((check) => withTimeout(check.run())));
	return settled.map((outcome, i) => {
		const name = checks[i].name;
		if (outcome.status === 'fulfilled') {
			return { name, ok: true, ...(outcome.value ? { detail: outcome.value } : {}) };
		}
		const reason = outcome.reason;
		return { name, ok: false, detail: reason instanceof Error ? reason.message : String(reason) };
	});
}

/** Which checks started failing and which recovered since the previous run. */
export function diffFailures(previous: string[], current: string[]) {
	return {
		newlyFailing: current.filter((name) => !previous.includes(name)),
		recovered: previous.filter((name) => !current.includes(name))
	};
}

/** Record a successful cron run for the health check's staleness test. Never throws. */
export async function recordCronRun(name: string): Promise<void> {
	try {
		const redis = await getRedisClient();
		await redis?.set(cronKey(name), String(Date.now()));
	} catch (err) {
		console.error(`Failed to record heartbeat for ${name}:`, err);
	}
}
