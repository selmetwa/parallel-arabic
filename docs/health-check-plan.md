# Hourly health check for external services

## Context
Gemini prepay credits ran out and all 29 Gemini-backed routes returned a generic 500. Nobody noticed until a user hit it. Server-side Sentry is commented out (`src/hooks.server.ts:45`), so nothing alerts today. Billing auto-reload is now on (prevention). This adds detection: an hourly Vercel cron (project is on Pro) that checks each critical dependency and emails selmetwa@gmail.com when something breaks and again when it recovers. Alerts go through Mailgun. We accept the risk that a Mailgun outage also silences its own alert.

Copy this plan to `docs/health-check-plan.md` when implementation starts (repo convention).

## Checks (v1)
Each check is `{ name, run(): Promise<void> }` and throws with a short reason on failure. Each one gets a 10s timeout. They run in parallel with `Promise.allSettled`.

| Check | How | Fails when |
|---|---|---|
| env | Every required key is non-empty: GEMINI_API_KEY, ELEVENLABS_API_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET, STRIPE_MONTHLY_PRICE_ID, STRIPE_ANNUAL_PRICE_ID, MAILGUN_KEY, REDIS_URL, CRON_SECRET, REVENUECAT_API_KEY | any missing |
| gemini | `new GoogleGenAI(...).models.generateContent` called directly, without `generateContentWithRetry`, so the raw status shows. Model `gemini-2.5-flash`, `maxOutputTokens: 5`, `thinkingConfig: { thinkingBudget: 0 }` | any error (reports status, e.g. 402) |
| elevenlabs | `GET https://api.elevenlabs.io/v1/user/subscription` with `xi-api-key` | request fails, or `character_count / character_limit >= 0.8` (**early warning**) |
| supabase | `supabase.from(<small table>).select('id', { head: true, count: 'exact' })` via `$lib/supabaseClient` | error returned |
| redis | `getRedisClient()` from `src/lib/server/redis.ts`, then `PING` | client null or ping fails |
| stripe | `prices.retrieve` for both price IDs, using the client in `src/lib/services/stripe.service.ts` | error or `!price.active` |
| mailgun | `getMailgunClient().domains.get(MAILGUN_DOMAIN)` | error or state not `active` |
| crons | Reads `cron:last_run:<name>` from Redis for each cron | heartbeat older than its limit (below). A missing key is skipped, so a fresh deploy doesn't flood alerts |

Cron heartbeat limits: `send-streak-reminders` 7h (runs every 6h), `reset-weekly-stats` 26h, `onboarding-nudge` 26h, `weekly-recap` 8d.

Deferred (add later, one check each): Google Cloud Speech token, YouTube quota, RevenueCat, APNs key signing.

## Alerting without spam
- Redis key `health:failing` holds a JSON list of the check names that failed on the previous run.
- A pure function `diffFailures(previous, current)` returns `{ newlyFailing, recovered }`.
- **Email only on change:** newly failing → "🔴 Health check: gemini, stripe failing" with each reason. Recovered → "✅ Health check: gemini recovered". No email while the state stays the same.
- If Redis itself is down there's no previous state, so failures are emailed every run. That's acceptable, since Redis being down is worth knowing about.
- The route always returns JSON `{ ok, results }`: status 200 when everything passes, 503 otherwise. That makes manual curl checks easy.

## Files
- **New** `src/lib/server/health-checks.ts`: the check list, `runHealthChecks()`, `diffFailures()`, `recordCronRun(name)` (`SET cron:last_run:<name> Date.now()`; never throws).
- **New** `src/routes/api/cron/health/+server.ts`: `GET` with the same `CRON_SECRET` bearer check as `src/routes/api/cron/weekly-recap/+server.ts:81`. Runs the checks, diffs against Redis, emails via `sendEmail` from `src/lib/server/email.ts`, and saves the new state.
- **Edit** `src/lib/server/email.ts`: export `MAILGUN_DOMAIN`.
- **Edit** the 4 existing cron routes (`reset-weekly-stats`, `onboarding-nudge`, `send-streak-reminders`, `weekly-recap`): call `recordCronRun('<name>')` just before the success response.
- **Edit** `vercel.json`: add `{ "path": "/api/cron/health", "schedule": "0 * * * *" }`.
- **New** `src/lib/server/health-checks.test.ts`: vitest for `diffFailures` (new failure, recovery, unchanged, mixed).

## Cost
720 runs a month. Gemini uses about 10 tokens per run; every other call is a free read. Vercel CPU time per run is milliseconds.

## Verification
1. `npm run test:unit`: the `diffFailures` tests pass.
2. `npm run dev`, then `curl -H "Authorization: Bearer $CRON_SECRET" localhost:5173/api/cron/health`: returns 200 with every check `ok` (cron checks show as skipped until the first heartbeat).
3. Set `GEMINI_API_KEY` to a bogus value in `.env.local` and curl again: 503, gemini failing, and one 🔴 email arrives. Curl again: no second email. Restore the key and curl: ✅ recovery email.
4. `npm run check`: no new type errors.
5. After deploy, the Vercel dashboard → Cron Jobs shows `/api/cron/health` hourly, and its first run's logs show `ok: true`.
6. Note: if the ElevenLabs key is scoped without `user_read`, the subscription endpoint returns 401. Either widen the key's permissions or drop the usage threshold.
