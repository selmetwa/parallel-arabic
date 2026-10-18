# Conversion and premium positioning

Built from the Conversion Optimisation and Premium Positioning strategies in `docs/product-design-playbook/`.

Decided with the user (2026-10-17/18):
- **Every new signup gets the hard paywall** (see `docs/paywall-ab-test-plan.md`).
- **Paywalled users are left out of the weekly recap and comeback emails**, whose links would only lead back to `/paywall`.
- **Not built yet:** trial-focused follow-up emails for people at the wall, and a different `/paywall` for returning visitors.

## What changed

1. **`/pricing` rebuilt** (The Paywall, JTBD Copywriting).
   - **Premium comes first:** three outcomes, the annual price shown as "$8/mo billed yearly", the trial, and the full feature list behind a toggle (`FeatureGrid`, shared with the trial offer).
   - **No free column:** new signups get the hard paywall, so the second card explains the trial instead (today full access, day 7 the plan starts, cancel any time). It's hidden in the app when Apple's product has no trial.
   - **Fixed:** web visitors no longer see Apple's "charged to your Apple ID" terms. Web shows Stripe terms; the app shows Apple's, with StoreKit prices.
2. **Social proof** at the trial offer (end of onboarding and `/paywall`) and on `/pricing`.
   - **Live numbers:** learners and words saved in the last 30 days, from `/api/social-proof`. Rounded down to the hundred and cached for an hour.
   - **Real quotes:** from `src/lib/constants/testimonials.ts`, the same ones `/signup` and `/login` use. The one that says "your AI" is left out.
3. **Shorter onboarding conversation that's harder to skip** (Time to Value, Momentum Bias).
   - **Shorter:** 3 or 4 lines instead of 5 or 6, cut where the exchange still ends naturally (`onboardingLines`, tested).
   - **Listen instead:** an option for people who can't or won't speak yet.
   - **Quieter skip:** "Skip for now" is a small link under the main action instead of at the top.
   - **Tracking:** the event log records `onboarding_conversation_listen_mode`, and `onboarding_conversation_finished` now has a `mode`.
4. **"Building your plan"** (Perceived Effort Delay, Loading Feedback). About 3 seconds of narrated steps between the conversation and the plan: dialect and levels, the focus that matches their reason, their first lesson.
5. **Narrated story creation:** the create-story modal shows each step the server actually does, using the same `NarratedSteps` component as the plan screen.
6. **Signature moment** (Small Quirk): at the end of a lesson, the lesson's first new word writes itself out in Arabic (`SignatureWord`).
7. **Haptics** (Micro Interactions) in the iOS app: a light tap on a right answer, and a success buzz at the end of a game round, a lesson or the onboarding conversation. It needs a new app build; older builds ignore the calls.

## Measuring

```sql
-- Onboarding conversation: finished (and how), listened, or skipped.
select event, props->>'mode' mode, count(distinct user_id)
from onboarding_event
where event in ('onboarding_conversation_started','onboarding_conversation_finished',
                'onboarding_conversation_skipped','onboarding_conversation_listen_mode')
  and created_at > '2026-10-18'
group by 1, 2 order by 1;
```

The baseline from Oct 14 to 17 was 18 started, 6 finished and 10 skipped. Trial starts and subscriptions can be compared before and after with query 1 in `docs/retention-daily-goal-plan.md`.
