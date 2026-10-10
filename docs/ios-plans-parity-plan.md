# iOS plan parity: annual, free trial, hard paywall

## Context
The web offers:
- **Monthly** at $10 and **annual** at $96 through Stripe (`src/lib/constants/pricing.ts`).
- A **7-day free trial** that needs a card up front, once per account (`user.has_used_trial`).
- A **hard paywall vs freemium A/B test** (`src/lib/server/paywall-experiment.ts`). Only web signups get a variant (`api/onboarding/+server.ts:81`, `platform === 'web'`).

iOS sells one product through RevenueCat/Apple: monthly, no trial, no experiment. `RevenueCatService.getCurrentOffering()` returns `availablePackages[0]`, so only one package can ever be bought.

The iOS app is a Capacitor WebView on the live site (`capacitor.config.ts` `server.url`). Every code change below ships to iOS on a web deploy, so **no new binary is needed**. The App Store Connect products still need Apple review.

## Rules that still apply
- **Never show Stripe prices, the Stripe trial or a Stripe checkout inside the app.** Doing so breaks App Store guideline 3.1.1 (external purchase). Native UI shows Apple's own products and prices only, read from StoreKit through RevenueCat.
- `isNative` stays `null` until mount, so SSR never flashes the wrong copy (risk R3 in `docs/free-trial-plan.md`).
- No regressions for current Apple subscribers. The existing monthly product ID and the `Parallel Arabic Premium` entitlement don't change.

## Phasing (recommended)
- **Phase 1:** annual product, the 7-day trial on both Apple products, a Restore button and the fixes listed below.
- **Phase 2:** put iOS signups in the hard paywall test.

Doing it in this order means the paywall test never runs on top of a brand-new trial flow. That way you can see what Apple trial conversion looks like before you gate the app on it.

---

## Phase 1 — Annual + free trial on iOS

### Human steps (you do these)

**App Store Connect**
1. Open the existing subscription group and add an auto-renewable subscription, e.g. `parallel_arabic_premium_annual`.
   - Duration: 1 year.
   - Price: the closest Apple price point to $96. Apple keeps 15% (Small Business Program) or 30%, so $99.99 is a fair choice.
   - Fill in the localized display name and description, and add a review screenshot.
2. Set the group ranking so **annual ranks above monthly**. Apple then treats switching from monthly to annual as an upgrade (it takes effect right away, prorated).
3. Add an **introductory offer: free, 7 days** to **both** the monthly and the annual products, for all territories.
4. Submit the new product for review. The app already has an approved subscription, so the new product can be submitted without a new app version.

**RevenueCat dashboard**
5. **Products:** import the annual product, then attach it to the `Parallel Arabic Premium` entitlement.
6. **Offerings → current offering:**
   - Make sure the existing monthly product is in the `$rc_monthly` package.
   - Add the annual product as `$rc_annual`.
7. **Webhooks:** no config change. Optionally use "Send test event" after the deploy (R-test 3 in `docs/free-trial-plan.md`).

**Trial eligibility (you can't control this)**
- Apple decides who gets the free trial: one intro offer per Apple ID per subscription group.
- So `has_used_trial` can't stop someone who already had a Stripe trial from getting an Apple trial too.
- Closing that gap would need trial-less duplicate products and a second offering, picked per user. **Decision: accept the leak.** It's small and has a limit: one extra trial per Apple ID.

### Code changes (Claude does these)

#### 1. `src/lib/services/revenuecat.service.ts`
- Replace `getCurrentOffering()` with `getPackages()`.
  - It returns `{ monthly, annual }` from `current.monthly` / `current.annual`, each `PurchasesPackage | null`.
  - If `current.monthly` is empty, fall back to `availablePackages[0]` so current users never get stuck.
- Add `checkTrialEligibility(productIds)`, which wraps `Purchases.checkTrialOrIntroductoryPriceEligibility`. It returns a map of `productId → boolean`, true only for `INTRO_ELIGIBILITY_STATUS_ELIGIBLE`.

#### 2. `src/lib/components/SubscribeButton.svelte`, native branch only
- After mount, when `isNative`, load the packages and trial eligibility. The web `{:else}` branch stays byte-for-byte unchanged.
- **Only render the Monthly | Annual toggle when the annual package exists.** The code can then deploy before Apple approves the product. Until approval, the UI stays exactly as it is today.
- **Prices come from `pkg.product.priceString`** (localized, from StoreKit), never from `PLANS`.
  - The annual "per month" figure is `product.pricePerMonthString`, when the plugin version exposes it. Otherwise leave it out.
  - Leave out "Save X%" unless it's computed from the two StoreKit prices.
- **Trial copy only when Apple says the user is eligible** for that product and the product has an intro price (`product.introPrice`):
  - Button: "Start 7-day free trial".
  - Line under the button: "Free for 7 days, then {priceString}/{period}. Cancel anytime in Settings."
  - Otherwise use the current label and "{priceString}/{period}".
- `handleApplePurchase` buys the selected package. The verify call, reload and cancel handling stay as they are.
- Add a **"Restore purchases"** text button under the subscribe button on native:
  1. It calls `RevenueCatService.restorePurchases()`, then the same `/api/verify-apple-purchase` call.
  2. It shows "No purchases to restore" when the entitlement isn't active.
- **This button is required by Apple and is missing today.** `restorePurchases()` exists, but nothing calls it.
- Run `svelte-autofixer` until clean.

#### 3. `src/lib/components/TrialOffer.svelte` (current bug)
- **The problem:** the kicker "7-day free trial" / "Unlock everything free for 7 days" (lines 24-26) only checks `page.data.trialEligible`, which is the Stripe flag.
- **Who sees it:** a hard-group web user who opens the iOS app. Today they see Stripe trial wording above an Apple button.
- **The fix:** add the same `isNative` gate.
  - Web: as today.
  - Native, Phase 1: show the trial heading only when Apple reports the user eligible. SubscribeButton can expose this through a bindable prop or callback, or TrialOffer can call `checkTrialEligibility` itself.
  - Native, eligibility unknown or false: show "Subscribe to unlock everything".

#### 4. `src/routes/pricing/+page.svelte`, Apple disclosure (lines ~150-170)
- **The problem:** it's hard-coded to "1 month, auto-renewing". Guideline 3.1.2 needs the title, length, price and trial terms for every option on sale.
- **The fix:** render one line per available package, using StoreKit `priceString`s.
- Add the trial sentence when eligible: "Free trial for 7 days. If you don't cancel at least 24 hours before it ends, your subscription renews automatically at…"
- Keep the EULA and privacy links.
- The header at line 87 says "Monthly Subscription" on native. Change it to "Premium" when the annual package exists.

#### 5. `src/routes/api/verify-apple-purchase/+server.ts`
- **The problem:** `resolveFromRevenueCatRest` takes `Object.keys(subscriptions)[0]`. With two products, a user who switched plans or has an old expired product can resolve to the wrong transaction id.
- **The fix:** pick `subscriptions[entitlement.product_identifier]`.
- The entitlement's `expires_date` is already right for trials: it's the trial end.

#### 6. `src/routes/api/revenuecat-webhook/+server.ts`
- On `INITIAL_PURCHASE` with `period_type === 'TRIAL'`, also set `has_used_trial: true`. Otherwise someone whose iOS trial runs out can start a Stripe trial on web (web `trialEligible` = not subscribed && !has_used_trial).
- **No other change needed:**
  - Trial start = `INITIAL_PURCHASE` (expiration = trial end).
  - Conversion = `RENEWAL`.
  - Cancel during the trial = `CANCELLATION` → `EXPIRATION`.
  - Monthly↔annual = `PRODUCT_CHANGE`.
  - All of these are already handled.

#### 7. `src/routes/profile/+page.svelte` (minor)
- Today the plan and amount come from Stripe only. For Apple subscribers, show "Managed through the App Store", plus a link to `https://apps.apple.com/account/subscriptions` if it isn't there already.
- No plan or price is stored for Apple users, and the plan is optional, so no new column.

#### 8. Docs and comments
- `src/lib/constants/pricing.ts` header: "Stripe plans. iOS sells its own monthly and annual products through Apple. Never render these prices in the WebView."
- `docs/annual-plan-web-only-stripe.md`: add a note pointing to this doc.

### Not changing
- Web/Stripe checkout, `PLANS`, the Stripe webhook, `stripe-link.ts`.
- `checkUserSubscription` / `getUserHasActiveSubscription`. Apple trial rows have `is_subscriber` true and an end date in the future, so they're already treated as active.
- About page and FAQ copy ("$10 a month"). Apple's monthly price stays the same.

### Phase 1 verification
1. `npm run check`: no new type errors.
2. Web, as a fresh user: the toggle, the Stripe trial and checkout behave exactly as before.
3. **Before Apple approves the product**, on iOS: one subscribe button, no toggle, same copy as today. A purchase still works.
4. **Sandbox, after the products are set up**, on a fresh sandbox Apple ID:
   - Both options show localized prices and "Start 7-day free trial".
   - Buying annual turns on premium. The DB row has `is_subscriber` = true, `subscription_end_date` ≈ now + 7 days and `has_used_trial` = true.
   - The webhook log shows `INITIAL_PURCHASE`.
5. Sandbox renewal (Apple speeds up time in sandbox: a 7-day trial lasts minutes): `RENEWAL` arrives and the end date moves about a year out.
6. Sandbox Apple ID that already used its trial: no trial copy, with the plain price instead.
7. Restore on a reinstalled app or a second device turns premium back on. A user with no purchases sees "No purchases to restore".
8. You check visually in the app: no Stripe prices, no "$96", no "Save 20%" unless computed, and no web trial copy anywhere (pricing, paywall, TrialOffer, onboarding).
9. An existing Apple monthly subscriber is still active and sees no change.

---

## Phase 2 — Hard paywall on iOS

> **As built (2026-10-09):** every new iOS signup gets the hard paywall, with no freemium group. iOS users are stored as `paywall_variant = 'hard_ios'` (not `'hard'`), so the web A/B test's numbers stay web-only. No new column, just a wider check constraint (`docs/sql/2026-10-09-paywall-variant-hard-ios.sql`). The assignment doesn't depend on `PAYWALL_EXPERIMENT`. In onboarding, iOS signups see the trial offer step with Apple's plans. `/profile` is reachable from the paywall so users can delete their account (guideline 5.1.1(v)). The decisions below are kept for reference.

### Decisions to make first
- **One experiment or two?** Recommendation: **keep it as one A/B test, but record the platform** (`paywall_variant_platform`, `'web' | 'native'`). That way each platform's results can be read separately in PostHog. Apple trials and Stripe card-up-front trials convert differently, so pooled numbers would hide the effect.
- **Apple guideline 5.1.1:** a hard paywall right after a required signup is allowed. The paywall must also offer Restore (Phase 1) and a way to log out, which TrialOffer already has through `onLogout`.

### Human steps
1. Supabase: add `paywall_variant_platform text null` to `user` (a `docs/sql/*.sql` file will be provided).
2. PostHog: add the platform as a breakdown on the existing experiment insights.

### Code changes
1. `src/routes/api/onboarding/+server.ts:81`: allow `platform === 'native'` as well as `'web'`, and write `paywall_variant_platform`.
2. `src/lib/server/paywall-experiment.ts`: update the header comment. `isPaywalled` and the exempt paths stay the same.
3. `/paywall` → `TrialOffer` → `SubscribeButton` already renders the Apple button on native. With the Phase 1 fixes in place, the copy is correct. No new UI.
4. Check that `isPaywallExempt` covers every route the native app needs before subscribing: `/login`, `/signup`, `/auth`, `/privacy`, `/support`, `/pricing`. Also any Capacitor-specific auth callback, if one exists.

### Phase 2 verification
1. With the experiment on, a fresh native signup gets a variant, and the row has `paywall_variant_platform = 'native'`.
2. Hard group on iOS: after onboarding it lands on `/paywall` with Apple prices, the trial (if eligible), Restore and Log out. Buying in sandbox unlocks the app.
3. Freemium group on iOS: the app works as it does today.
4. Users assigned on web who then open iOS keep their variant (assignment never changes).

---

## Rollout order
1. Phase 1 code: safe to deploy before App Store Connect is set up, because the toggle only shows once the annual package exists.
2. App Store Connect + RevenueCat setup → Apple approves the product.
3. Sandbox verification (Phase 1, steps 4-7), then a check on a real device.
4. Let it run for a few weeks to get a baseline for Apple trial starts and conversion.
5. Phase 2.
