# Free Trial — Manual Verification Checklist

Everything here needs a human: a real Stripe dashboard, a real card form, a real device. The code is written and type-checks, but **nothing has been run end to end yet** — no trial created, no webhook delivered, no charge simulated.

Work top to bottom. Part 1 is a hard blocker; the app's subscribe button is broken until it's done.

---

## Part 1 — Blocker: add the database column

The Supabase MCP connection I have is read-only, so I couldn't apply this. Until it runs, `/?/subscribe` fails for every user with "Could not find your account", because the query names a column that doesn't exist.

- [ ] Supabase Dashboard → your project → **SQL Editor** → New query → run:

```sql
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS has_used_trial boolean NOT NULL DEFAULT false;
```

- [ ] Verify it landed (expect one row, default `false`):

```sql
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'has_used_trial';
```

- [ ] Confirm nobody is flagged yet (expect `0`):

```sql
SELECT count(*) FROM public."user" WHERE has_used_trial;
```

> Run this on the same database your local dev server points at. If local and prod share one Supabase project, this one migration covers both.

---

## Part 2 — Stripe test mode setup

Toggle **Test mode** (top right) for all of this. Nothing here touches live customers.

### 2a. Test-mode price
Your `PUBLIC_PRICE_ID` is a **live-mode** price and will be rejected by test-mode keys.

- [ ] **Product catalogue** → create a product "Parallel Arabic Premium (test)" → recurring, $10/month.
- [ ] Copy its price id (`price_…`).

### 2b. Local env
- [ ] In your **local** `.env` only, switch to test values:
  - `STRIPE_SECRET` → your test secret key (`sk_test_…`)
  - `PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_test_…`
  - `PUBLIC_PRICE_ID` → the test price id from 2a
- [ ] Do **not** change anything in Vercel yet.
- [ ] Write down the original values so you can put them back.

### 2c. Webhook forwarding
- [ ] Install and log in, if you haven't:
  ```bash
  brew install stripe/stripe-cli/stripe
  stripe login
  ```
- [ ] Start forwarding (leave this running in its own terminal):
  ```bash
  stripe listen --forward-to localhost:5173/api/stripe-webhook
  ```
- [ ] Copy the `whsec_…` it prints into your local `.env` as `PUBLIC_WEBHOOK_SECRET`, then restart `npm run dev`.

> The CLI forwards every event type, so you don't need to configure dashboard events for local testing. Part 5 covers the live endpoint.

---

## Part 3 — The core test runs

Start `npm run dev` with the CLI still listening. After each run, check the DB with:

```sql
SELECT id, email, is_subscriber, has_used_trial,
       subscriber_id,
       to_timestamp(subscription_end_date) AS access_until
FROM public."user"
WHERE email = 'YOUR_TEST_EMAIL';
```

Test cards: `4242 4242 4242 4242` succeeds · `4000 0000 0000 0341` attaches but fails the later charge · any future expiry, any CVC.

### Run 1 — New user through onboarding
- [ ] Sign up as a brand-new user and complete onboarding.
- [ ] **Expect:** after the speaking practice step, a new screen "Unlock everything free for 7 days" with a "Continue with the free plan" link below the button.
- [ ] Click the trial button → checkout page header reads **"Start Your Free Trial"** and says you won't be charged today.
- [ ] Pay with `4242…`.
- [ ] **Expect:** success page reads "Your Free Trial Has Started!" with a charge date 7 days out.
- [ ] **DB:** `is_subscriber = true`, `has_used_trial = true`, `subscriber_id` starts `sub_`, `access_until` ≈ 7 days from now.
- [ ] **Stripe** → Subscriptions: status **Trialing**, $0 invoiced, and a payment method **is** attached.

### Run 2 — Skip the trial
- [ ] New user → onboarding → click **"Continue with the free plan"**.
- [ ] **Expect:** lands in the app as before, `is_subscriber = false`, `has_used_trial = false`.
- [ ] Play audio 6 times → the 6th is blocked with the free-limit message (unchanged behaviour).
- [ ] Open any paywalled lesson/story → paywall modal appears, now headed "Try everything free for 7 days".

### Run 3 — Closing the tab (the orphan fix)
- [ ] Start a trial as a new user, and **close the tab immediately** after the card is accepted, before the success page loads.
- [ ] **Expect:** the CLI shows `checkout.session.completed` → your terminal logs the sync, and the DB row is still updated correctly.
- [ ] This is the case that, before this change, would have charged someone on day 7 with no premium access.

### Run 4 — Trial converts to paid
Test clocks only work on customers created inside the clock, so this one is set up by hand.

- [ ] Stripe → **Billing → Test clocks → New simulation**, start = now.
- [ ] Inside the clock, **Add customer**, then **Actions → Create subscription**:
  - price = your test price
  - **Add trial days: 7**
  - metadata: `user_id` = the `id` of a test user row (the `public.user.id` text id, not the auth UUID)
  - attach card `4242…`
- [ ] In the DB, set that user's `subscriber_id` to the new `sub_…` id.
- [ ] **Advance time → +8 days.**
- [ ] **Expect:** invoice paid, subscription **Active**, and `access_until` jumps to roughly one month out — **not** a date in the past.

> This run is the one that catches the bug I fixed mid-implementation: Stripe leaves `trial_end` set after conversion, and using it here would revoke access from every converted trial. If `access_until` comes back in the past, stop and tell me.

### Run 5 — Trial conversion fails
- [ ] Repeat Run 4 in a fresh test clock with card `4000 0000 0000 0341`.
- [ ] Advance +8 days.
- [ ] **Expect:** subscription **past_due**, `is_subscriber = false`, paywalls return for that user.
- [ ] Advance +2 more weeks (past the retry window): subscription cancels, `.deleted` fires, `subscriber_id` clears.

### Run 6 — Cancelling during a trial
- [ ] As the Run 1 user, go to **/profile**.
- [ ] **Expect:** the card reads "Free Trial" and "first charge $10 on {date}".
- [ ] Click cancel → the confirmation says "You won't be charged. Premium access ends {date}."
- [ ] **Expect in Stripe:** subscription shows "Cancels {trial end date}", and no invoice is ever charged.

### Run 7 — No second trial
- [ ] Take a user with `has_used_trial = true` and start checkout again.
- [ ] **Expect:** buttons read "Subscribe Now" (no trial wording), checkout header is "Complete Your Subscription", and $10 is due immediately.

---

## Part 4 — iOS regression tests

The Capacitor app loads the live site, so a web deploy reaches iOS users instantly. These confirm nothing leaked through. Run them against a build pointing at your deployed preview/prod.

- [ ] **R1 — Onboarding:** new sandbox account on device → onboarding ends **without** any trial screen and lands where it always did.
- [ ] **R2 — Purchase:** open paywalled content → modal shows "$10/month" and "Subscribe Now", with **no** trial wording anywhere → sandbox purchase completes → premium unlocks. DB: `subscriber_id` is a numeric Apple id (not `sub_…`), `has_used_trial` still `false`.
- [ ] **R3 — Webhook:** RevenueCat → Integrations → Webhooks → **Send test event** returns 200, and Vercel logs show `[RC webhook] … DONE`.
- [ ] **R4 — Copy:** `/pricing` and `/profile` in the app still show the Apple disclosure block and "Open Apple Subscriptions", with no Stripe or trial text.
- [ ] **R5 — Apple guard:** in test mode, set a test user to `is_subscriber = true`, `subscriber_id = '2000000123'`, future end date. Trigger a Stripe `checkout.session.completed` carrying that user's id. **Expect:** the row is completely unchanged and the log shows the skip warning.

> If **any** trial wording appears inside the app, stop before shipping — App Store rule 3.1.1 treats it as an external purchase link.

---

## Part 5 — Live deployment

Only after Parts 1–4 pass.

### 5a. Restore local env
- [ ] Put your original live keys and `PUBLIC_PRICE_ID` back in `.env`, including the original `PUBLIC_WEBHOOK_SECRET`.

### 5b. Live webhook events (do before deploying)
Stripe → **Workbench → Webhooks → Event destinations**.

- [ ] Leave the `datafa.st/...` destination completely alone.
- [ ] Open `https://www.parallel-arabic.com/api/stripe-webhook` — it currently has **1 event**.
- [ ] Set it to these **four**:
  - `customer.subscription.updated` (already there)
  - `customer.subscription.deleted` ← missing today; this is the pre-existing bug
  - `checkout.session.completed`
  - `customer.subscription.created`
- [ ] Save, and confirm the row now reads "4 events".

### 5c. Billing settings
- [ ] **Settings → Billing → Customer portal:** enable cancel ("at end of billing period") and payment method updates. Activate.
- [ ] **Settings → Billing → Subscriptions and emails:** turn on the trial-ending reminder email; point its link at the customer portal. Set "trial ends without payment method" → cancel.
- [ ] **Settings → Billing → Revenue recovery:** Smart Retries on; **"if all retries fail" → cancel the subscription**.
- [ ] Turn on the failed-payment emails.

> The retry end-behaviour and the email toggles are deliberately saved for now: flipping them earlier would change behaviour for today's subscribers before any trial code existed.

### 5d. Deploy and smoke test
- [ ] Deploy.
- [ ] Start one real trial on your own card, confirm the DB row, then cancel from `/profile` and confirm Stripe shows "Cancels {date}" with no charge.
- [ ] Re-run iOS R1–R4 against production.

### 5e. Optional cleanup
Only after 5b is live, and only once you've confirmed none of these users has resubscribed. This clears the 22 stale rows left behind by the missing `.deleted` event (16 Stripe, 6 Apple). Behaviour doesn't change — they already get no access — but subscriber counts stop being inflated by ~40%.

```sql
-- Look first
SELECT id, email, subscriber_id, to_timestamp(subscription_end_date) AS ended
FROM public."user"
WHERE is_subscriber AND subscription_end_date < extract(epoch FROM now());

-- Then, if it looks right
UPDATE public."user"
SET is_subscriber = false
WHERE is_subscriber AND subscription_end_date < extract(epoch FROM now());
```

---

## What to watch after launch

- [ ] **Stripe → Subscriptions**, filter Trialing, to count active trials. After 7+ days compare Active vs Canceled — that's your conversion rate.
- [ ] **Stripe → Disputes** in month one, for "unrecognised subscription" chargebacks.
- [ ] Compare subscribe-click → paid rate against the old flow.

---

## Tell me if you see any of these

- `access_until` in the past after Run 4 → the conversion date bug is back.
- Trial wording anywhere inside the iOS app → App Store risk, don't ship.
- "Could not find your account" on subscribe → Part 1 didn't run, or didn't run on the DB your app uses.
- A user ending up with two trials → eligibility check isn't reading `has_used_trial`.
