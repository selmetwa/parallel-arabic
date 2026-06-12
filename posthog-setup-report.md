<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into Parallel Arabic. Client-side analytics is initialised in `hooks.client.ts` (with session replay support and automatic exception capture), a reverse proxy is wired into `hooks.server.ts` to avoid ad blockers, and `svelte.config.js` has been updated with `paths.relative: false` as required for session replay with SSR. A server-side PostHog singleton (`src/lib/server/posthog.ts`) is used across 10 API and server files to capture key business events, and `posthog.identify()` / `posthog.reset()` are called in the root layout to correlate client and server activity for each user.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | New account created via email/password | `src/routes/signup/+page.server.ts` |
| `user_signed_up` | New account created via Google OAuth | `src/routes/api/auth/google/callback/+server.ts` |
| `user_logged_in` | Successful email/password login | `src/routes/login/+page.server.ts` |
| `user_logged_in` | Successful Google OAuth login | `src/routes/api/auth/google/callback/+server.ts` |
| `user_logged_out` | User logged out | `src/routes/auth/logout/+server.ts` |
| `onboarding_completed` | User finished onboarding (dialect, level, reason) | `src/routes/api/onboarding/+server.ts` |
| `subscription_started` | Payment confirmed, user subscribed | `src/routes/pricing/subscribed/+page.server.ts` |
| `subscription_cancelled` | User cancelled their subscription | `src/routes/api/cancel-subscription/+server.ts` |
| `lesson_started` | User started a structured lesson | `src/routes/api/structured-lessons/start/+server.ts` |
| `word_saved` | User saved a vocabulary word to their deck | `src/routes/api/save-word/+server.ts` |
| `word_reviewed` | User completed a spaced-repetition word review | `src/routes/api/review-word/+server.ts` |
| `tutor_session_saved` | User saved an AI tutor conversation session | `src/routes/api/tutor-save-session/+server.ts` |
| `server_error` | Server-side unhandled error | `src/hooks.server.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/467800/dashboard/1705934)
- [New signups over time](https://us.posthog.com/project/467800/insights/LfUKungQ)
- [Signup to subscription conversion funnel](https://us.posthog.com/project/467800/insights/KVvWoksM)
- [Subscription churn trend](https://us.posthog.com/project/467800/insights/UKfq6nbA)
- [Learning engagement over time](https://us.posthog.com/project/467800/insights/4WhbUeOu)
- [Tutor session saves over time](https://us.posthog.com/project/467800/insights/3TLAS3x9)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
