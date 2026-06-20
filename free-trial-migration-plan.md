# Migration Plan: Freemium → Card-Up-Front 7-Day Free Trial

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Existing non-paying users | **Grandfather** — keep today's freemium limits forever |
| Access during trial | **Full premium** (reverse trial) |
| Platforms in scope now | **Web (Stripe) first**; iOS/Apple IAP deferred |
| Trial length | **7 days** |
| Card required up front | **Yes** — collected at trial start, auto-charged at day 7 |

---

## Current State (what we're migrating from)

**Freemium model** — anyone can use the app; specific things are metered/gated for non-subscribers:
- `FREE_TTS_LIMIT = 5` audio plays — `src/routes/api/text-to-speech/+server.ts`
- `isPaywalled` content sections — `src/lib/constants/levantine-sections.ts`, stories, tutor, lessons, etc.
- Gate logic: `checkUserSubscription()` (sync, `src/lib/helpers/subscription.ts`, used in `+layout.server.ts`) and `getUserHasActiveSubscription()` (async with provider fallback, `src/lib/helpers/get-user-has-active-subscription.ts`). Both key off `user.is_subscriber` + `user.subscription_end_date`.

**Billing**
- Web → Stripe embedded checkout, `mode: 'subscription'`, **no trial** — `src/lib/services/stripe.service.ts` (`subscribe()`); form action in `src/routes/+page.server.ts`.
- iOS → RevenueCat / Apple IAP — `src/lib/components/SubscribeButton.svelte`, `src/routes/api/verify-apple-purchase/+server.ts`.
- Webhook handles only `customer.subscription.updated` / `.deleted` — `src/routes/api/stripe-webhook/+server.ts`.
- Post-checkout confirmation — `src/routes/pricing/subscribed/+page.server.ts`.

**Key advantage:** `getUserHasActiveSubscription` **already** treats `trialing` as an active status (line ~49). The entitlement model mostly supports trials already; the work is in the checkout, webhook, and gating layers.

---

## Phase 0 — Stripe Dashboard Setup (pre-step, do before code)

### Required

1. **Webhook events** — Developers → Webhooks → existing `/api/stripe-webhook` endpoint. Endpoint and signing secret (`PUBLIC_WEBHOOK_SECRET`) already wired. Add the event types Phase 4 needs (currently only `updated`/`deleted`):
   - `customer.subscription.created`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end` (only if sending the reminder)

2. **Failed-payment / dunning policy** — Settings → Billing → Manage failed payments. Defines what `invoice.payment_failed` means for us: number of Smart Retries, over how many days, and end behavior (cancel, etc.). This is the **revocation-timing decision** — set it here so the webhook handler matches.

3. **Trial end behavior** — Settings → Billing → Subscriptions and emails.
   - Set "if no payment method at trial end" → **cancel** (backstop; `payment_method_collection: 'always'` already guarantees a card).
   - `trial_will_end` fires 3 days before by default — fine for a 7-day trial.

### Optional but recommended

4. **Trial-end & payment emails** — same Settings page. Decide whether Stripe auto-sends "trial ending soon" / "payment failed" emails or we send via Mailgun. Avoid double-sending.

5. **Customer Portal** — Settings → Billing → Customer portal, if users should self-serve card updates / cancellation instead of routing through the `cancel` action.

### NOT needed

- **No new Product or Price.** Trial lives on the checkout session (`trial_period_days: 7`), so existing `PUBLIC_PRICE_ID` is unchanged. (Alternative: bake trial into the Price and drop `trial_period_days` — keeping it in code keeps trial length in version control.)
- No new env vars.

### For testing

- **Test clocks** (Billing → test clocks) to fast-forward a trial to its end and verify charge + webhook fire — the only reliable way to test trial→paid without waiting 7 days.
- `stripe trigger invoice.payment_failed` (and other events) via Stripe CLI to exercise each webhook branch.

---

## Phase 1 — Data model (grandfathering + abuse guard)

Add to the `user` table (Supabase migration):
- `is_legacy_free boolean default false` — **backfill `true` for all existing rows** in the same migration. New signups default `false`.
- `has_used_trial boolean default false` — prevents re-triggering a trial on the same account.

**Verify:** existing rows all `is_legacy_free = true`; a fresh signup row is `false`.

---

## Phase 2 — Stripe checkout = trial with mandatory card

In `src/lib/services/stripe.service.ts` → `subscribe()`, update `checkout.sessions.create`:

```ts
mode: 'subscription',
payment_method_collection: 'always',          // forces card even with a trial
subscription_data: {
  trial_period_days: 7,
  trial_settings: { end_behavior: { missing_payment_method: 'cancel' } }
},
```

- Card collected and validated up front; first charge fires at trial end.
- If `has_used_trial = true`, issue a no-trial checkout (straight subscription) instead.

**Verify:** Stripe test checkout creates a subscription in `trialing` status with a `default_payment_method` attached and `$0` due now.

---

## Phase 3 — Fix post-checkout confirmation (currently broken for trials)

`src/routes/pricing/subscribed/+page.server.ts` (line ~30) redirects to `/pricing/error` unless `payment_status === 'paid'`. **A trial checkout returns `payment_status: 'no_payment_required'`**, so today it would wrongly error out. Must ship with Phase 2.

- Accept `'paid'` **or** `'no_payment_required'`.
- Set `is_subscriber = true`, `subscriber_id`, `subscription_end_date = subscription.trial_end ?? current_period_end`, and `has_used_trial = true`.

**Verify:** completing a trial checkout lands on the success page; user row flips to subscriber with an end date 7 days out.

---

## Phase 4 — Webhook coverage

`src/routes/api/stripe-webhook/+server.ts` handles only `updated`/`deleted`. Add:
- `customer.subscription.created` → mark trialing-as-active (belt-and-suspenders alongside Phase 3).
- `invoice.payment_failed` → trial-to-paid charge bounced; revoke per the Phase 0 dunning policy by setting `is_subscriber = false`.
- `customer.subscription.trial_will_end` (optional) → send "trial ends in 3 days" email (Mailgun/nodemailer already in deps).

**Verify:** trigger each via `stripe trigger` and confirm the user row updates correctly.

---

## Phase 5 — Gating logic (the freemium → paywall switch)

Add one helper, e.g. `getAccessTier(user)` → `'premium' | 'legacy-free' | 'locked'`:
- subscriber / trialing → `premium`
- else `is_legacy_free` → `legacy-free`
- else → `locked`

Apply at each existing gate:
- **TTS** (`api/text-to-speech/+server.ts`): `premium` → unlimited; `legacy-free` → keep `FREE_TTS_LIMIT = 5`; `locked` → block with "Start your free trial" message.
- **`isPaywalled` content** (stories, tutor, lessons, levantine sections, etc.): `premium` / `legacy-free` behavior unchanged; `locked` → redirect to trial CTA.

This keeps every legacy path byte-for-byte the same and only adds the `locked` branch.

**Verify:** legacy test user sees today's exact behavior; brand-new user with no trial is blocked everywhere premium content lives.

---

## Phase 6 — Signup / paywall UX

- After signup, route new users to a "Start your 7-day free trial" screen (reuse onboarding; `showOnboarding` already exists in `+layout.server.ts`).
- Update `/pricing` and `SubscribeButton` copy: "Start 7-day free trial — then $X/mo. Cancel anytime."
- Add a persistent "X days left in trial" indicator for trialing users.
- **Copy guardrail:** keep user-facing copy free of "AI" framing (use "personalized" / "sentence mining"; "AI Tutor" branding is the only allowed exception).

**Verify:** new-account walkthrough lands on trial CTA; trialing user sees days-remaining; copy reviewed.

---

## Phase 7 — iOS (deferred, NOT done)

Apple requires its own intro-offer/trial config via RevenueCat + App Store Connect; Stripe's card-up-front model doesn't apply. Out of scope for now — but ensure Phase 5's `locked` tier does **not** strand native users before their IAP flow exists. The `Capacitor.isNativePlatform()` branch in `SubscribeButton.svelte` already separates them; verify `locked` gating doesn't block native users prematurely.

---

## Key Risks / Call-Outs

1. **Phase 3 is the silent live-breaker** — trial checkout returns `no_payment_required`, not `paid`. Must ship with Phase 2.
2. **Trial abuse** — `has_used_trial` stops same-account repeats but not new-email signups. Acceptable for v1; add card-fingerprint dedupe later if needed.
3. **Legacy boundary** — purely the backfilled `is_legacy_free` flag, not signup date. Clean and auditable.
4. **Revocation timing** on failed first charge — policy choice (immediate vs. after Stripe retries). Decided in Phase 0; webhook handler must match.

---

## Suggested Build Order

1. Phase 0 (Stripe dashboard) — unblocks testing.
2. Phase 1 (migration).
3. Phases 2 + 3 together — risky interdependent pair.
4. Phase 4 (webhooks).
5. Phase 5 (gating).
6. Phase 6 (UX/copy).
7. Phase 7 deferred.
