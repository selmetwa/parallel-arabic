# Hard paywall vs. freemium A/B test

## Context
We want to know whether a hard paywall (no free plan after signup) converts better than today's freemium. Half of new **web** signups get the hard paywall. The other half get the app exactly as it is today. The user stops the test manually.

Current numbers: about 130–160 signups/month and about 5–7% paying. Expect trial-start rate to be readable in about 4–6 weeks, and paid conversion in about 3–4 months.

Decisions already made:
- Web only. Native iOS signups are never assigned to a group.
- Logged-out SEO pages and prerendered pages stay open (accepted loophole).
- No automatic stop rule.

## Design

**Assignment point:** the `/api/onboarding` POST, which is the end of the profile questions, before the first conversation. This is the earliest point where the client knows whether it's running natively (`isNativeApp()`). The server can't tell, because the iOS app loads the live site with a stock WebView user agent. Everything before this point is identical for both groups, so assigning here doesn't bias the comparison. People who drop out before it aren't in the test.

**Gate:** in the root `+layout.server.ts` load, not in `hooks.server.ts`. A `redirect()` thrown from load works for both full page loads and client-side navigation. The load already reads `url`, so it reruns on every navigation. Prerendered pages and `/api/*` aren't gated; Pro APIs already check `isSubscribed` themselves.

## Changes

1. **SQL migration**: `docs/sql/2026-09-30-add-paywall-variant.sql`, for the user to run (the Supabase MCP is read-only).
   - `alter table public."user" add column paywall_variant text check (paywall_variant in ('hard','freemium')), add column paywall_variant_assigned_at bigint;`
   - Include the analysis query (step 7) in the same file.

2. **Experiment switch**: `src/lib/server/paywall-experiment.ts` (new, small).
   - `PAYWALL_EXPERIMENT` env var, read at runtime via `$env/dynamic/private` (same pattern as the runtime Stripe price IDs). `'on'` means new assignments happen. Anything else turns assignment off.
   - `assignVariant()` returns `Math.random() < 0.5 ? 'hard' : 'freemium'`.
   - `isPaywallExempt(pathname)` returns true for: `/paywall`, `/pricing*` (includes checkout and `/pricing/subscribed`), `/auth*`, `/login`, `/signup`, `/logout`, `/password-reset*`, `/support`, `/privacy`.
   - `isPaywalled(user, isSubscribed)` returns `user.paywall_variant === 'hard' && user.onboarding_completed && !isSubscribed`.

3. **Assign in `/api/onboarding`** (`src/routes/api/onboarding/+server.ts`).
   - Accept `platform: 'web' | 'native'` in the body.
   - Assign only when: the experiment is on, `platform === 'web'`, the user row's `paywall_variant` is null, the user isn't subscribed, and onboarding isn't already completed (new signups only).
   - Write `paywall_variant` and `paywall_variant_assigned_at` in the existing update, and return `{ success, variant }`.
   - The handler only has `user.id` from `locals.auth.validate()`. Read the needed fields from `locals.user`, which `hooks.server.ts:114` selects with `*`.

4. **Gate in the root layout** (`src/routes/+layout.server.ts`).
   - Before the try/catch (so the catch can't swallow it): `if (locals.user && isPaywalled(...) && !isPaywallExempt(url.pathname)) redirect(303, '/paywall')`.
   - `url.pathname` is only read for paywalled users. Reading it makes SvelteKit rerun the layout load on every client-side navigation, which everyone else shouldn't pay for.

5. **Pull the trial screen out into a component**: `src/lib/components/TrialOffer.svelte`.
   - Move the trial markup and styles (the feature grid from this session) out of `Onboarding.svelte`.
   - Props: `onSkip?: () => void`. The skip link renders only when `onSkip` is given. Also `dialectName`.
   - When `page.data.trialEligible` is false (trial already used or lapsed), the title becomes "Subscribe to keep learning" and the trial wording is dropped. `SubscribeButton` already switches its copy through `showTrial`.

6. **Use it in two places.**
   - `Onboarding.svelte`:
     - Send `platform: isNative ? 'native' : 'web'` in `handleSubmit`, and keep the returned `variant`.
     - In `handleConversationFinish`, keep the existing trial condition (`isNative === false && trialEligible`). Render `<TrialOffer onSkip={variant === 'hard' ? undefined : skipTrial} />`.
     - Track `trial_offer_shown` with `{ variant }`. `trackEvent` is a no-op today but the call sites already exist.
   - New `src/routes/paywall/+page.svelte` (+ `+page.server.ts`):
     - Full-screen `TrialOffer` without a skip link, plus a log-out link.
     - The server load redirects to `/` when the user isn't gated, e.g. a subscriber or someone in the freemium group.
     - Set `noindex`, and add `Disallow: /paywall` to `static/robots.txt`.

7. **Analysis query** (in the SQL file). Group by `paywall_variant` among assigned users, with cohorts limited by `paywall_variant_assigned_at` age:
   - assigned count
   - % `has_used_trial` (trial started)
   - % `is_subscriber` among users assigned at least 14 days ago (past the 7-day trial)
   - same at 30+ days
   - Optional breakdown by `target_dialect`.

## Edge cases
- **Hard user opens the iOS app later:** they're gated there too. `/paywall` renders `SubscribeButton`, which shows Apple IAP on native, so they can still buy. This is acceptable.
- **Hard user refreshes during the first conversation:** onboarding is already marked complete, so they land on `/paywall`. This is acceptable.
- **Stopping the test:** set `PAYWALL_EXPERIMENT` to off so new signups aren't assigned. Hard-group users stay gated until you run SQL, e.g. `update public."user" set paywall_variant = null where paywall_variant = 'hard'` to roll back, or ship the hard paywall to everyone if it wins.
- **Existing users:** `paywall_variant` stays null, so nothing changes for them.

## Verification
- `npx svelte-check`: no new errors (the baseline is 225), and the Svelte autofixer is clean on new or changed components.
- Locally, with `PAYWALL_EXPERIMENT=on`:
  1. Sign up a test account, finish onboarding, and set `paywall_variant='hard'` via SQL if the coin flip went the other way. Confirm: the trial screen has no skip link; navigating to `/`, `/stories` or `/tutor` redirects to `/paywall`; `/pricing` and `/support` load; prerendered `/alphabet` loads.
  2. Complete a Stripe test-mode trial checkout. `/pricing/subscribed` syncs, and the app opens normally.
  3. Set `paywall_variant='freemium'`. The skip link shows and the app behaves as it does today.
  4. Set the experiment off. A new signup gets a null variant.
- Run the analysis query against live data once there are assignments.
- Copy this plan to `docs/` (per the repo convention).
