# 7-Day Card-Up-Front Free Trial (Web first)

## Context

Revenue today comes from a freemium model with a $10/mo subscription behind `PaywallModal` / `SubscribeButton`. Goal: raise conversion by offering a **7-day free trial that requires a card up front** and charges automatically on day 7. Users who don't start a trial stay on today's free tier. The existing paywall infrastructure (`isPaywalled`, `FREE_TTS_LIMIT`, `checkUserSubscription`, etc.) is **unchanged**.

Decisions:
- The trial is offered at the **end of onboarding** (skippable) **and** on every paywall/subscribe CTA.
- **Web (Stripe) first.** iOS keeps today's exact "Subscribe" flow, with **zero regressions** (see the iOS section).
- Eligibility: **anyone not currently subscribed** who hasn't used a trial on this account (`has_used_trial`). No backfill.
- This supersedes the root `free-trial-migration-plan.md`, which assumed new free users get locked out (no longer wanted). On approval, save this plan to `docs/free-trial-plan.md`.

---

## How payments work today

**Web (Stripe)**
- Every CTA is `SubscribeButton.svelte` → form POST `/?/subscribe` (`src/routes/+page.server.ts:440`) → `StripeService.subscribe(priceId)` (`src/lib/services/stripe.service.ts:69`).
- That creates an embedded Checkout Session (`mode: 'subscription'`, no trial, **no `client_reference_id`/customer/email**). The client secret goes in a cookie → `/pricing/checkout` mounts it.
- The subscription is linked to the user **only** in `/pricing/subscribed/+page.server.ts`. That page requires `payment_status === 'paid'`, then writes `is_subscriber`, `subscriber_id` (`sub_…`), `subscription_end_date`.
- `api/stripe-webhook` handles only two events:
  - `customer.subscription.updated`: always sets `is_subscriber: true`, whatever the status.
  - `.deleted`: revokes access.
  - Handlers aren't awaited, and a bad signature returns HTTP 200.
- Cancel: `api/cancel-subscription` → `cancel_at_period_end`. The profile page reads live Stripe status.
- Entitlement checks:
  - `checkUserSubscription` (sync, layout).
  - `getUserHasActiveSubscription` (async, with provider fallback; already treats `trialing` as active).

**iOS (RevenueCat / Apple IAP)**
- The Capacitor app loads the live site (`capacitor.config.ts` `server.url`), so **every web deploy reaches iOS users immediately**. Any web change is also an iOS change unless it's gated on native.
- Native branch of `SubscribeButton`: RevenueCat `purchasePackage` → `api/verify-apple-purchase` writes `is_subscriber`, `subscriber_id` (Apple transaction id, never `sub_…`), `subscription_end_date`.
- `api/revenuecat-webhook` handles:
  - INITIAL_PURCHASE/RENEWAL: grant access.
  - CANCELLATION/BILLING_ISSUE: update the end date.
  - EXPIRATION: revoke access.
- There is no Android build.

### Gaps a trial exposes
1. **Trials break the return page.** A trial checkout returns `payment_status: 'no_payment_required'`, so users get sent to `/pricing/error`.
2. **Orphaned subscriptions.** If the user closes the tab before the return page loads, nothing links the subscription to them. They'd later be charged without premium access. Fix: `client_reference_id` plus a `checkout.session.completed` webhook.
3. **Failed charges still grant access.** A failed day-7 charge makes the subscription `past_due` → `subscription.updated` → the webhook sets `is_subscriber: true` again.
4. **`customer.subscription.deleted` has never been delivered.** Confirmed in the dashboard on 2026-09-18: the `parallel-arabic.com/api/stripe-webhook` destination subscribes to exactly one event, `customer.subscription.updated`. The `.deleted` handler in the code has therefore never run.
   - **Impact today is stale data, not leaked access.** When a subscription ends, the row keeps `is_subscriber: true` and its last `subscription_end_date`, but that date is in the past, so `checkUserSubscription` and `getUserHasActiveSubscription` both return false. A live count shows **16 Stripe and 6 Apple rows** in this state (versus 30 Stripe and 4 Apple genuinely active). Any query that treats `is_subscriber` alone as "paying" is overcounting by ~22.
   - **It matters more with trials**, because the H4 "cancel after retries" policy and trial cancellations both depend on `.deleted` to revoke promptly rather than waiting for the date to lapse. H1 fixes it.
   - Optional cleanup, once the webhook is fixed: `UPDATE public."user" SET is_subscriber = false WHERE is_subscriber AND subscription_end_date < extract(epoch FROM now());` Behavior doesn't change, since those users already get no access. Only do this after confirming none of the 22 has since resubscribed.

---

## Human work — step by step

Do everything in **Stripe test mode first** (toggle "Test mode" top-right in the dashboard). Repeat steps H1–H4 in **live mode** right before the production deploy.

### What's safe to do in live mode before the code ships

| Step | Safe early? | Why |
| --- | --- | --- |
| H1 webhook events | **Yes** | The current handler switches on `event.type` with an empty `default:` and returns 200 (`api/stripe-webhook/+server.ts:117`). The two new events are ignored until the code ships. |
| H2 trial reminder email | **Yes** | No trials exist yet, so it can't fire. |
| H2 receipt / payment emails | **Wait** | Customer-visible immediately, and Mailgun already sends your own mail. Check what's on today before flipping anything. |
| H2 statement descriptor | **Verify only** | Don't change it as part of this work. |
| H2 "trial ends without payment method → cancel" | **Yes** | No trials exist yet. |
| H3 customer portal | **Yes** | Provisioning it changes nothing until an email links to it. Cancels there set `cancel_at_period_end`, exactly what `/api/cancel-subscription` already does, and the existing `.deleted` handler covers period end. |
| H4 Smart Retries | **Yes** | Applies to future invoices only. |
| H4 "cancel after all retries fail" | **Wait — do on deploy day** | Live behavior change on its own. Today `customer.subscription.updated` sets `is_subscriber: true` for **any** status, so a subscriber sitting in `past_due` keeps access indefinitely. Switching the end behavior to "cancel" makes those subscriptions reach `.deleted`, which revokes access — correct, but it would start affecting today's subscribers before any trial code exists. |
| H4 failed-payment emails | **Wait** | Same reason as the H2 email toggles. |
| H5 products | n/a | Nothing to change. |
| H6 column | **Yes** | Metadata-only on Postgres, so milliseconds. `hooks.server.ts` selects `*`, so the row just carries one extra ignored field, and no insert in the codebase lists the column. Only the generated TS types go stale, which isn't a runtime issue. |
| H7 test mode | **Yes** | No live impact at all. |

**Safe early batch: H6 → H1 → H3**, plus all test-mode setup. Everything else goes with the deploy.

### H1. Stripe webhook events (~5 min) — must be done BEFORE deploying code
1. Stripe Dashboard → **Workbench → Webhooks → Event destinations**. There are two destinations:
   - `https://datafa.st/api/websites/…/webhook/stripe` — Datafast analytics, 10 events. **Leave it alone.** Changing its events breaks revenue analytics.
   - `https://www.parallel-arabic.com/api/stripe-webhook` — the app. Currently **1 event**.
2. Open the `parallel-arabic.com` row → **⋯ → Update details**, and use the **All events** tab to add to the selection.
3. The endpoint must end up with **four** events. Today it only has the first one:
   - `customer.subscription.updated` (already selected)
   - `customer.subscription.deleted` — **missing today; this is the pre-existing bug in gap 4**
   - `checkout.session.completed`
   - `customer.subscription.created`
   The picker groups by resource: `checkout.session.completed` is under **Checkout** (not the `async_payment_*` ones, which are for delayed payment methods you don't use), and the three `customer.subscription.*` events are under **Customer**. The search box filters by name.
4. **Save destination.** The signing secret doesn't change, so `PUBLIC_WEBHOOK_SECRET` stays as it is. Confirm the row then reads "4 events".
   - Adding `.deleted` is safe to do now and is an improvement on its own: it makes ended subscriptions clear `is_subscriber` promptly instead of relying on the date lapsing.
5. For local testing, install the Stripe CLI (`brew install stripe/stripe-cli/stripe`), run `stripe login`, then `stripe listen --forward-to localhost:5173/api/stripe-webhook`. Copy the printed `whsec_…` into your **local** `.env` as `PUBLIC_WEBHOOK_SECRET`. Local only; don't change the Vercel value.

### H2. Trial & subscription email settings (~10 min)
1. **Settings (gear) → Billing → Subscriptions and emails**.
2. Under **Manage free trial messaging** / "Customer emails":
   - Turn on **"Send a reminder email 7 days before a free trial ends"**. Stripe sends it at the earliest possible point for a 7-day trial. Card network rules (Visa/Mastercard) require a reminder before a trial converts.
   - **Check, don't flip yet:** note whether the **receipt / successful payment** emails are already on. Leave them as they are until deploy day, since Mailgun already sends your own mail and a new receipt stream is immediately customer-visible.
   - Set the **link in the reminder** to "Stripe-hosted page (Customer portal)". This needs H3.
3. Under **"Trials" → "If a free trial ends without a payment method"**: select **Cancel subscription**. This is a backstop; code also forces card collection.
4. **Settings → Business → Public details:** confirm the business name, support email and statement descriptor are set. These appear in trial emails and on card statements ("PARALLEL ARABIC"), which reduces chargebacks from people who forget the trial.

### H3. Customer portal (~5 min)
1. **Settings → Billing → Customer portal**.
2. Enable **"Cancel subscriptions"** → "Cancel at end of billing period". Enable **"Update payment methods"**.
3. Disable "Switch plans" (there is only one plan).
4. Business information: add links to Terms (`/terms` if it exists, else the site) and Privacy (`https://www.parallel-arabic.com/privacy`).
5. Click **Save**, then **Activate test link** / **Activate** in live mode.

### H4. Failed payment handling (~5 min)
1. **Settings → Billing → Revenue recovery → Retries** ("Manage failed payments" in older UI).
2. Turn on **Smart Retries**: 4 retries within **2 weeks**, the recommended default.
3. **Deploy day only:** **"If all retries for a payment fail"** → **Cancel the subscription**. This fires `customer.subscription.deleted`, which revokes access. During retries the subscription is `past_due`, and the new code treats that as no access. Don't set this early: today's webhook grants access on any status, so `past_due` subscribers currently keep access indefinitely, and flipping this alone would start cutting them off before the trial code exists.
4. **Deploy day only:** under **Emails**, turn on **"Send emails when card payments fail"** so the customer can fix their card. Point it at the Customer portal.

### H5. Nothing to create in Products
- **No new Product or Price.** The trial is set per Checkout Session in code (`trial_period_days: 7`), so `PUBLIC_PRICE_ID` and every Vercel env var stay the same.
- Don't add a trial to the Price itself. That would also trial users who aren't eligible.

### H6. Supabase migration (~2 min)
Supabase is the schema source of truth (`schema.sql` in the repo is stale, so ignore it). I checked the live `public.user` table on 2026-09-13:
- Subscription columns: `is_subscriber` (bool, not null), `subscriber_id` (text), `subscription_end_date` (bigint, seconds).
- There is **no** trial or Stripe-customer column yet.
- `list_migrations` is empty, so schema changes are applied directly, not through tracked migrations.

Steps:
1. Supabase Dashboard → project → **SQL Editor** → New query. Or I can apply it via the Supabase MCP `apply_migration` once you approve.
2. Run:
   ```sql
   ALTER TABLE public.user ADD COLUMN IF NOT EXISTS has_used_trial boolean NOT NULL DEFAULT false;
   ```
3. Verify:
   - `SELECT column_name, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='user' AND column_name='has_used_trial';` → one row, default `false`.
   - `SELECT count(*) FROM public.user WHERE has_used_trial;` → 0.
4. Run it **before** deploying the code that reads the column. `hooks.server.ts` selects `*`, so the column reaches `locals.user` automatically.
5. Existing inserts (signup, Google callback) don't list this column, so the default covers them.

### H7. QA with test clocks (~1–2 hrs, see Verification)
1. **Billing → Subscriptions → Test clocks → New simulation**. Name it and set the start time to now.
2. **Add customer** inside the clock, using the email of a local test account.
3. Test clocks only work on customers created inside the clock, and checkout creates its own customer, so split testing in two:
   - **Checkout flow (no time travel):** run the real checkout locally to test steps 2, 3, 6 and 7 of Verification.
   - **Trial end (time travel):** in the clock's customer → **Actions → Create subscription** → the same price → **Add trial days: 7** → metadata `user_id` = your test user's `user.id` → attach a test card. Then in the DB set that user's `subscriber_id` to the new `sub_…` id. Click **Advance time** +8 days to see the conversion (or failure with the failing card). The Stripe CLI forwards the clock's webhook events, so confirm the DB row updates.
4. Test cards:
   - `4242 4242 4242 4242`: succeeds.
   - `4000 0000 0000 0341`: attaches fine, but the charge fails at trial end.
   - `4000 0025 0000 3155`: requires 3DS.

### H8. Live launch checklist (~15 min)
1. Repeat H1–H4 in **live mode**. Test-mode settings don't carry over. H6/H1/H3 can already be done (see the safety table); on deploy day finish the held items: the H4 retry end behavior, the H4 failed-payment emails and the H2 receipt emails.
2. Run H6 on production Supabase.
3. Deploy.
4. Do one real trial on your own card in production. Confirm the DB row, then **cancel from the profile page** and confirm in Stripe that it shows "Cancels {trial end date}" and no charge.
5. **iOS smoke test** on a real device (see iOS section, R-tests).

### H9. After launch
- **Stripe → Billing → Subscriptions**, filter Status = Trialing to count active trials. After 7+ days, compare how many converted to Active vs Canceled.
- PostHog funnel: `trial_offer_shown` → `trial_started` → paid (Stripe). Compare subscribe-button click → paid rate before and after.
- Watch **Stripe → Disputes** for "subscription canceled / unrecognized" chargebacks in the first month.

---

## Code changes

### 1. Schema
There's no repo file to change: the column is added in Supabase directly (H6). Don't touch `schema.sql`; it's stale.

### 2. Checkout session — `src/lib/services/stripe.service.ts`
Change `subscribe(priceId)` to `subscribe(priceId, { userId, email, withTrial })`:
```ts
client_reference_id: userId,
customer_email: email,
subscription_data: {
  metadata: { user_id: userId },
  ...(withTrial && {
    trial_period_days: 7,
    trial_settings: { end_behavior: { missing_payment_method: 'cancel' } }
  })
},
payment_method_collection: 'always',
```
**Do not upgrade the `stripe` SDK / API version.** `current_period_end` moves off the subscription in newer API versions.

### 3. Subscribe action — `src/routes/+page.server.ts` (`subscribe`)
Load the user's `id, email, has_used_trial`. Set `withTrial = !has_used_trial && !checkUserSubscription(user)`, pass it through, and put `trial=1` on the checkout redirect for copy.

### 4. Shared Stripe linking helper (new, `src/lib/server/stripe-link.ts`)
`syncStripeSubscription(subscriptionId, userIdHint?)`:
1. Retrieve the subscription.
2. Resolve the user: the `subscriber_id = subscriptionId` match first, then `userIdHint` / `metadata.user_id`.
3. **Apple guard (see R1):** if the user resolved via hint/metadata has a `subscriber_id` that is set and doesn't start with `sub_`, and `checkUserSubscription(user)` is true, **do nothing** and log a warning. Never overwrite or revoke an active Apple subscription from a Stripe event.
4. `trialing` / `active` → `is_subscriber: true`, `subscriber_id`, `subscription_end_date = trial_end ?? current_period_end`.
5. `past_due` / `unpaid` / `incomplete_expired` / `canceled` → `is_subscriber: false`. **Only** when the user's `subscriber_id === subscriptionId`.
6. If `trial_end` is set → `has_used_trial: true`.

Use it from the return page and the webhook, replacing their duplicate update blocks.

### 5. Return page — `src/routes/pricing/subscribed/+page.server.ts`
- Accept `payment_status` `'paid'` **or** `'no_payment_required'`, then call the helper.
- Return `isTrial` / `trialEnd`. `+page.svelte` shows "Your free trial is active — you'll be charged $10 on {date}. Cancel anytime from your profile."

### 6. Webhook — `src/routes/api/stripe-webhook/+server.ts`
- `checkout.session.completed` → `syncStripeSubscription(session.subscription, session.client_reference_id)`. This fixes the orphan gap.
- `customer.subscription.created` / `.updated` → the helper (status-aware; fixes gap 3). Keep the `.deleted` handler, which matches on `subscriber_id`, so it can't touch Apple users.
- `await` the handlers. Return a real 400 on a bad signature.
- **Behavior change for existing web subscribers:** a failed renewal card now removes access while Stripe retries. Access comes back automatically if a retry succeeds.

### 7. Trial eligibility — `src/routes/+layout.server.ts`
Return `trialEligible = !!user && !isSubscribed && !user.has_used_trial`. This is server data only. Every consumer also checks "not native" on the client (R2).

### 8. CTAs (web only)
All of these use a local `isNative` state: `null` until mount, set with `isNativeApp()` from `src/lib/helpers/is-native-app.ts`. Trial copy renders **only when `isNative === false && page.data.trialEligible`**. SSR and first paint show today's copy, so the native WebView never flashes trial wording.
- **`SubscribeButton.svelte`:** the `{:else}` web form branch only. Label "Start 7-day free trial" plus a small line "$0 today, then $10/month. Cancel anytime." The `{:else if isNative}` branch and `handleApplePurchase` stay **byte-for-byte unchanged**.
- **`PaywallModal.svelte`:** header "Try everything free for 7 days" / "$0 today, then $10/month" under the same condition. Otherwise today's markup.
- **`src/routes/pricing/+page.svelte`:** the trial line in the Premium header under the same condition. The Apple disclosure block is unchanged.
- **`src/routes/pricing/checkout/+page.svelte`:** "Start your free trial" / "You won't be charged today" when `?trial=1`. This page is web-only; native never reaches it.

### 9. Onboarding trial step — `src/lib/components/Onboarding.svelte`
- After the conversation step (`step = 4`), before `finishOnboarding(destination)`, add the step **only if `!isNativeApp() && page.data.trialEligible`**. Otherwise call `finishOnboarding` exactly as today.
- Content:
  - Heading: "Unlock everything free for 7 days"
  - The benefit bullets from `PaywallModal`
  - `<SubscribeButton />`
  - A "Continue with the free plan" link → `finishOnboarding(destination)`
- Copy rule: no "AI" in copy (only "AI Tutor").

### 10. Profile — `src/routes/profile/+page.svelte`
- Only in the Stripe branch (`subscriptionProvider === 'stripe'`) with `status === 'trialing'`: show "Free trial — first charge $10 on {date}". The cancel confirmation reads "You won't be charged. Premium access ends {date}."
- The Apple branch is untouched. The server sets its `status` to `'active'`, so it can't match.

### 11. Analytics
Using `trackEvent` from `src/lib/analytics.ts`:
- `trial_offer_shown` / `trial_offer_skipped` in the onboarding step.
- `trial_started` on the subscribed page when `isTrial`.

Note (no change): several pages import `PUBLIC_PRICE_ID` without using it (e.g. `src/routes/speak/+page.svelte`). Left alone.

---

## iOS / RevenueCat — no-regression guarantees

**Files that must NOT change:**
- `src/lib/services/revenuecat.service.ts`
- `src/routes/api/verify-apple-purchase/+server.ts`
- `src/routes/api/revenuecat-webhook/+server.ts`
- `src/lib/helpers/get-user-has-active-subscription.ts`
- `src/lib/helpers/subscription.ts`
- `capacitor.config.ts`
- anything under `ios/`

The code review for this PR should confirm the diff doesn't touch them.

**Risks and how the plan closes them:**

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | A Stripe event resolved via `client_reference_id`/metadata overwrites or revokes a user who is currently an **active Apple** subscriber (e.g. an old Stripe sub ending, or someone who subscribed on both). | Helper step 3 guard. Revocations only when `subscriber_id === subscriptionId`, and Apple ids never start with `sub_`. |
| R2 | The live site shows Stripe trial CTAs inside the iOS app. That's an App Store 3.1.1 violation (external purchase) and could get the app rejected or pulled. | Every trial UI is gated on `isNative === false` after mount. The native `SubscribeButton` branch is unchanged. The onboarding trial step is skipped on native. |
| R3 | SSR renders trial copy before the client knows it's native, so it flashes in the WebView. | Default `isNative = null` → render today's copy until mount. |
| R4 | The new `has_used_trial` column breaks Apple writes. | The column has a default and is `NOT NULL DEFAULT false`. Apple paths never write it. No other schema change. |
| R5 | The status-aware revocation (`past_due` → false) affects Apple users. | It only lives in the Stripe helper. The RevenueCat webhook's BILLING_ISSUE/EXPIRATION logic is untouched. |
| R6 | Onboarding flow changes break native signup. | On native, `nextStep` after step 4 calls `finishOnboarding` exactly as today (explicit branch). |
| R7 | The `trialEligible` layout field changes any native logic. | It's an additive field. Only the gated web branches read it. |

**iOS regression tests (run before merging and again after the prod deploy):**
- **R-test 1:** TestFlight/sandbox build on a device, a new sandbox account → sign up → onboarding completes with **no trial step** and lands where it does today.
- **R-test 2:** Open a paywalled item → `PaywallModal` shows "$10/month" and "Subscribe Now" (no trial wording) → the sandbox purchase succeeds → "Subscription activated" → reload → premium content is unlocked. DB: `subscriber_id` is not `sub_…`, and `has_used_trial` is still false.
- **R-test 3:** RevenueCat Dashboard → Project → **Integrations → Webhooks → your endpoint → "Send test event"** returns 200. The Vercel logs show `[RC webhook] ... DONE`.
- **R-test 4:** `/pricing` and `/profile` in the app: the Apple disclosure block and "Open Apple Subscriptions" still show, with no Stripe/trial text.
- **R-test 5 (R1 guard):** in Stripe test mode, give a test user an active Apple-style row (`is_subscriber=true`, `subscriber_id='2000000123'`, future end date). Then `stripe trigger checkout.session.completed` with `client_reference_id` = that user, or manually delete a Stripe sub carrying their `metadata.user_id`. The row is unchanged.

## iOS trial later (not in this build)
- **Human:** App Store Connect → My Apps → Parallel Arabic → **Subscriptions** → the subscription group → the product → **Subscription Prices → Introductory Offers (+)**. Pick all territories, Type **Free**, Duration **1 week**, no end date. RevenueCat needs no change: same product, offering and entitlement.
- **Code:**
  - `Purchases.checkTrialOrIntroductoryPriceEligibility` plus `pkg.product.introPrice` for the native copy.
  - Update the Apple disclosure block with trial terms.
  - Enable the onboarding step on native using the native button.
- The RevenueCat webhook already handles trials: INITIAL_PURCHASE fires with the trial expiry, then RENEWAL on conversion.

---

## Verification (Stripe test mode)
1. `stripe listen --forward-to localhost:5173/api/stripe-webhook` and `npm run dev`.
2. **New web user → onboarding:** the trial step appears. Pay with `4242…` → the return page shows trial copy. DB: `is_subscriber=true`, `has_used_trial=true`, end date ≈ +7d. Stripe shows the subscription `trialing` with a payment method and $0 charged.
3. **Close the tab on the checkout success screen before the redirect:** `checkout.session.completed` still links the user.
4. **Test clock +7d:** invoice paid → `active` → `subscription_end_date` ≈ +1 month.
5. **`4000 0000 0000 0341` + test clock +7d:** `past_due` → `is_subscriber=false` → paywalls return. After retries (+2 weeks) → `.deleted`.
6. **Cancel from profile during the trial:** Stripe shows "Cancels {trial end}", no charge, access ends at trial end.
7. **The same user subscribes again:** no trial in checkout, $10 charged now, CTAs show "Subscribe Now".
8. **Skip in onboarding:** free-tier limits (TTS 5 plays, `isPaywalled` sections) behave exactly as today.
9. **iOS R-tests 1–5** pass.
10. `git diff --stat` confirms none of the "must NOT change" iOS files are touched. `npm run check` passes. Run svelte-autofixer on the edited components.
