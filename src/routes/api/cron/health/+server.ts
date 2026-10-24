import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email';
import { getRedisClient } from '$lib/server/redis';
import { diffFailures, runHealthChecks, type CheckResult } from '$lib/server/health-checks';

const ALERT_EMAIL = 'selmetwa@gmail.com';
const FAILING_KEY = 'health:failing';

const describe = (results: CheckResult[]) =>
	results.map((r) => `${r.name}: ${r.detail ?? 'ok'}`).join('\n');

/**
 * Hourly health check of external services and crons.
 * Emails only when the set of failing checks changes, so an ongoing outage sends one alert.
 */
export const GET: RequestHandler = async ({ request }) => {
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const results = await runHealthChecks();
	const failing = results.filter((r) => !r.ok);
	const failingNames = failing.map((r) => r.name);

	// Without redis there is no previous state, so every failure counts as new.
	const redis = await getRedisClient().catch(() => null);
	const previous: string[] = JSON.parse((await redis?.get(FAILING_KEY).catch(() => null)) ?? '[]');
	const { newlyFailing, recovered } = diffFailures(previous, failingNames);

	try {
		if (newlyFailing.length) {
			await sendEmail(
				ALERT_EMAIL,
				`🔴 Health check: ${newlyFailing.join(', ')} failing`,
				`Failing now:\n${describe(failing)}\n\nAll results:\n${describe(results)}`
			);
		}
		if (recovered.length) {
			await sendEmail(
				ALERT_EMAIL,
				`✅ Health check: ${recovered.join(', ')} recovered`,
				`All results:\n${describe(results)}`
			);
		}
	} catch (err) {
		console.error('Failed to send health check email:', err);
	}

	await redis?.set(FAILING_KEY, JSON.stringify(failingNames)).catch(() => null);

	if (failing.length) console.error('Health check failures:', failing);
	return json({ ok: failing.length === 0, results }, { status: failing.length ? 503 : 200 });
};
