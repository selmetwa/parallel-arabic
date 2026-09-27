# Annual plan (web only)

## Context
Parallel Arabic has one Stripe price: $10/month (`PUBLIC_PRICE_ID`). We want to add a web-only annual plan at **$96/yr** (20% off; "$8/mo billed yearly, save $24") so people commit for longer. It gets the same 7-day free trial as monthly. The monthly/annual toggle goes inside `SubscribeButton`, so every upsell shows it on web.

The iOS app is a Capacitor WebView that loads the live site and sells through Apple/RevenueCat. The annual option must never render there. `SubscribeButton` already shows only the Apple button when `isNative` is true, and `isNative` stays `null` until mount, so a toggle placed in the web `{:else}` branch is web-only automatically.

## Human steps (you do these)
1. **Stripe Dashboard → Product catalog.** Open the existing Premium product and add a second price to it: **$96.00 USD, recurring, yearly**. Using the same product keeps reporting clean. Do this in **test mode** and again in **live mode**, and copy both `price_…` IDs.
2. **Env vars.** Add `STRIPE_ANNUAL_PRICE_ID` (server-only) to `.env.local` (test price) and to Vercel production (live price). Also add `STRIPE_MONTHLY_PRICE_ID`, set to the current `PUBLIC_PRICE_ID` value, in both places.
3. **Webhook.** No changes needed. The existing endpoint already receives `checkout.session.completed` and `customer.subscription.*`, and the handler doesn't depend on the price.
4. **Stripe emails and receipts.** Optionally check that the product name and description read well for a yearly charge. Consider turning on "upcoming renewal" reminder emails (Settings → Billing → Subscriptions → *Send emails about upcoming renewals*). Several US states expect this for annual auto-renewals.
5. **After deploy.** Do one live annual checkout, check that it appears in the Dashboard and on /profile, then refund and cancel it.
6. **App Store / RevenueCat.** Nothing to do. Annual stays web-only.

## Code changes

### 1. Plan config: new `src/lib/constants/pricing.ts`
A single source for display copy:
```ts
export type PlanId = 'monthly' | 'annual';
export const PLANS = {
  monthly: { label: 'Monthly', price: 10, perMonth: 10, interval: 'month', cta: '$10/month' },
  annual:  { label: 'Annual',  price: 96, perMonth: 8,  interval: 'year',  cta: '$96/year', savings: 'Save 20%' }
} as const;
```
Only the copy that `SubscribeButton` and the pricing pieces render comes from this file. Static marketing copy stays inline and is edited directly (see step 5).

### 2. Server resolves the price: `src/routes/+page.server.ts` `subscribe` action (~410)
- Read `form.get('plan')`, which is `'monthly' | 'annual'`, and default to monthly. Map it to `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_ANNUAL_PRICE_ID` from `$env/static/private`.
- Stop trusting a raw `price_id` from the client. This also fixes the existing issue that any price ID is accepted. For one release, keep accepting a legacy `price_id` if it equals the monthly ID, in case a cached page posts it.
- Trial logic is unchanged (`withTrial` applies to both plans). `StripeService.subscribe` (`src/lib/services/stripe.service.ts:79`) already takes `priceId`, so it needs no change. Optionally add `plan` to `subscription_data.metadata`.

### 3. `SubscribeButton.svelte`: toggle in the web branch only
- Add `let plan = $state<PlanId>('annual')`. Annual is the default because the goal is to push annual; it could default to monthly instead.
- In the `{:else}` (web) branch, render a two-option segmented control, Monthly | Annual with a "Save 20%" badge, above the submit button. Replace `<input name="price_id">` with `<input type="hidden" name="plan" value={plan}>`.
- Trial sub-copy becomes plan-aware: "$0 today, then $96/year" or "$0 today, then $10/month". Without a trial, show the price under the button.
- Remove the `PUBLIC_PRICE_ID` import. Optionally add a `compact` prop for tight placements such as in-lesson paywalls.
- Run `svelte-autofixer` until it comes back clean.

### 4. Profile shows the real plan: `src/routes/profile/+page.server.ts` (~41-93) + `+page.svelte` (~651)
- The Stripe subscription is already fetched. Also return `interval` and `amount` from `subscription.items.data[0].price` (`recurring.interval`, `unit_amount`).
- Replace the hard-coded "first charge $10" with the real amount, and show "Annual plan" or "Monthly plan". No DB column is needed, because the webhook stores `subscription_end_date = current_period_end`, which is already one year out for annual.

### 5. Copy updates (hard-coded "$10/month")
- `src/routes/pricing/+page.svelte:86-89`: the card header shows both options ("$10/month or $96/year"), or relies on the toggle inside SubscribeButton. Keep the Apple disclosure (148-163) as monthly only. It describes the in-app purchase.
- `src/lib/components/PaywallModal.svelte:33,37`, `Onboarding.svelte:521`, `src/routes/about/+page.svelte:713-724`: add "or $96/year (save 20%)".
- `src/lib/constants/features.ts` FAQ (121, 183, 286): mention the annual option and that it's billed on the website only.
- Only on web: anything shown in the WebView must not advertise the Stripe annual price. The about/FAQ pages load in the app, so wrap the annual mention in the existing `isNative === false` pattern, or keep those pages monthly-only if that's simpler. (I'll check each one during implementation.)

### 6. Cleanup
The PUBLIC_PRICE_ID imports in the stories/review/darija/levantine pages (listed in `docs/free-trial-plan.md:230`) are unused. Leave them alone for now, since `PUBLIC_PRICE_ID` stays defined. Remove `PUBLIC_PRICE_ID` in a follow-up once nothing references it.

## Not changing
- Webhook / `src/lib/server/stripe-link.ts`: access depends on status plus period end, so it doesn't need to know the price.
- `checkUserSubscription`, `getUserHasActiveSubscription`: no changes.
- RevenueCat / Apple path: no changes.
- Plan switching (monthly→annual): no switching UI for now. A cancel-then-resubscribe works. A Stripe Billing Portal could be added later.

## Verification
1. `npm run check` produces no new type errors.
2. With test keys on the web (`npm run dev`) as a fresh user, choose Annual, finish embedded checkout with `4242…`, and confirm Stripe shows a trialing sub on the $96/yr price. Confirm `/pricing/subscribed` sets `is_subscriber`, `subscription_end_date` ≈ trial end, and the profile shows "Annual plan, first charge $96".
3. The monthly path still works, and a user with `has_used_trial` gets no trial on either plan.
4. Tampering: POST `plan=foo` or an arbitrary `price_id` → it falls back to monthly or is rejected. An arbitrary Stripe price is never used.
5. Use `stripe trigger` / test clock to advance past the trial and confirm the webhook keeps `is_subscriber` true with an end date about a year out.
6. You check the iOS build or WebView visually: no toggle and no annual copy in the Apple purchase button, pricing, paywall or onboarding.
