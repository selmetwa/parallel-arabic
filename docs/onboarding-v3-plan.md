# Onboarding v3: from "you're set up" to "you've started"

**Status: implemented, pending `docs/sql/2026-10-14-onboarding-event.sql` being run in Supabase.**

Built from the Product Design Playbook cards in `docs/product-design-playbook/` (the Onboarding and Activation strategies). Agreed scope: **the onboarding flow plus the first session after it**. The paywall A/B test is not touched. The "why are you learning" answer gets used.

## Context

Live Supabase numbers for signups in the last 60 days (322 users):

| Stage | Users | |
|---|---|---|
| Never finished onboarding | 81 | 25% of signups |
| Finished onboarding | 241 | |
| …then never did anything tracked | 126 | **52% of those who finished** |
| …last seen on the day they finished onboarding | 72 | 30% |
| …active 7 or more days after onboarding | 13 | **5%** |

- Beginners (A1) are 43% of those who finish onboarding, and the fewest of them go on to do anything: 40% of A1 users are active afterwards, against 56% of A2 users.
- The median time from signup to finishing onboarding is about 35 seconds. The questions aren't the problem; what comes after them is.

**Where the playbook cards say we lose people.** Today's flow is: Welcome → Dialect → Reason → Level → Goal → scripted "Introducing yourself" conversation → trial offer → exit.

| Card | What's wrong today |
|---|---|
| Time to Value, Deep-link | The finish screen's "Go to a Lesson" goes to `/alphabet` or `/lessons/structured/{dialect}`. Both are **index pages**, so right after the first win the user has to make another choice. On the home page, "Start a lesson" goes to the same index. |
| Personalisation, Commitment, JTBD Copywriting | We ask four questions, and only the dialect has a visible effect. `learning_reason` is read only by tutor memory. `goal_level` is only read on `/profile`. The reason step promises "This helps us personalize your experience", and nothing follows through on it. |
| Momentum Bias, Success Moments, Gamified Progress | Finishing the onboarding conversation earns no XP and starts no streak. So someone who has just spoken Arabic lands on a home page reading "Streak 0 days · Words saved 0 · Due to review 0 words". |
| Empty States, Progressive Disclosure | A brand-new user's home page shows all-zero stats, four suggestions of equal weight (lesson, sentences, stories, game), then a menu of more than 10 tiles. There's no single "start here". |
| Permission Serve | On iOS, `PushPrompt` is a generic banner that shows up on whatever page the user is on after onboarding, including `/paywall`. It isn't tied to any moment where the user wants a reminder. |
| Insights & Metrics | `trackEvent` does nothing (`src/lib/analytics.ts`). We can't see which step the 25% quit at, or how many people skip the conversation. |
| (bug, confirmed) | Native sign-in (Google in the app, Apple) never sets `newSignup=true`. **All 29 Apple signups in the last 60 days skipped onboarding**, and with it the `hard_ios` paywall. |

## Plan

Everything ships in **one PR** on a new branch off `master`. The four phases below are just the order to build in. Onboarding gains one screen (`PLAN`, after the conversation and before the trial offer); this was checked with the user and is wanted. The SQL file for the event table has to be run before the PR is merged and deployed. Until then, `/api/onboarding/event` ignores insert failures, so nothing breaks.

### Phase 1: Measure, and fix the iOS onboarding gap (Insights & Metrics)

1. **Onboarding event log.** Add a `public.onboarding_event` table (`id`, `user_id`, `event text`, `props jsonb`, `created_at`, plus an index on `(event, created_at)`). The SQL goes in `docs/sql/2026-10-14-onboarding-event.sql` for the user to run, because the Supabase MCP connection is read-only. Add `POST /api/onboarding/event`: it requires a session, checks `event` against an allow-list, and inserts the row.
2. **Wire `trackEvent` to it, for onboarding events only.** In `src/lib/analytics.ts`, send events whose names start with `onboarding_` or `trial_offer_` to that endpoint with `navigator.sendBeacon` (or `fetch` with `keepalive`), fire-and-forget. All other events stay no-ops. The existing calls in `OnboardingConversation.svelte` and `Onboarding.svelte` then start recording. Add `onboarding_step_viewed {step}` from an `$effect` on `step` in `Onboarding.svelte`, plus `onboarding_exit {destination}`.
3. **Funnel query.** Write it into the plan doc: steps viewed, then onboarding completed, then conversation finished or skipped, then destination chosen, then first `user_daily_activity` within 24 hours and within 7 days, broken down by `paywall_variant` and `proficiency_level`.
4. **iOS sign-in gap.** First confirm it on a device or in the simulator with a fresh Apple ID or Google account. If it's real: have `/api/auth/sync` return `{ isNew }`, based on whether the user row was created in that call or still has `onboarding_completed=false`. Then the native callers in `signup/+page.svelte:72` and `login/+page.svelte:136-159` should `goto(withNewSignup(next))` (from `src/lib/helpers/safe-next.ts`) when it's set. Do the same in `auth/apple-callback/+server.ts`. `+layout.server.ts:38` already opens onboarding when `newSignup` is set and onboarding isn't done. Also send the welcome email from these paths; native and Apple signups don't get it today.

### Phase 2: The first conversation fits why they're learning (Personalisation, JTBD Copywriting)

1. **Choose the scenario from the reason.** Add to `OnboardingConversation.svelte` a `learningReason` prop, passed through from `Onboarding.svelte`. Map reasons to scenarios: Travel → `ordering-coffee`, Heritage → `talking-about-family`, and everything else (Work, Academic, Interest, Other) → `introducing-yourself`. If the chosen scenario has no dialog for the selected dialect, fall back to `introducing-yourself`.
2. **Content.** Write the dialogs myself, in the same format and transliteration rules as the existing ones. Extend `ordering-coffee` and `talking-about-family` in `src/lib/constants/tutor-scenarios.ts` to 5 lines, the same length as the onboarding dialog. Add `darija` dialogs for both; today only `introducing-yourself` has darija. Flag the darija lines for a native speaker to check, as the last plan did.
3. **Copy on the reason step** (`Onboarding.svelte:421-422`). Change the title to "What do you want Arabic for?" and the subtitle to "We'll start you on a conversation you'd actually have." It now tells the truth about what the answer does.

### Phase 3: The first win continues straight into the first lesson (Success Moments, Momentum Bias, Commitment, Permission Serve, Deep-link)

1. **The first lesson, as a deep link.** Add a helper `src/lib/helpers/first-lesson.ts`: `firstLessonHref(dialect, level)` returns:
   - A1: `/alphabet/learn`.
   - v2 dialects (`getCurriculumV2` in `src/lib/data/curriculum-v2.ts`): `/lessons/structured/{dialect}?lessonId={first topic of the module for that level}`. That page already auto-opens a lesson from `?lessonId=` (`lessons/structured/[dialect]/+page.server.ts:22`).
   - Darija, which has no v2 curriculum: today's index page.
   It also returns a title, such as "Lesson 1: Greetings". The same helper is reused in three places: the onboarding exit, the home page's "start-lesson" suggestion (`src/routes/+page.server.ts:343-351`), and `getCtaUrl` in the onboarding-nudge cron.
2. **Make the first win count.** When the conversation finishes (not on skip), POST to `/api/award-xp` with a new `XpEventType` called `onboarding_conversation`: add it to `VALID_EVENT_TYPES` and to `XP_AWARDS` in `src/lib/helpers/xp-levels.ts`. That endpoint already calls `touchStreak`, so the user leaves onboarding with a 1-day streak and the day marked on the week strip. Show `showXpToast` (`src/lib/helpers/toast-helpers.ts:391`).
3. **A new `PLAN` step** goes between `CONVERSATION` and `TRIAL`, in a new component `src/lib/components/onboarding/YourPlan.svelte`. It's one screen:
   - **Path:** `{current level} → {goal level}` on the existing `LevelSlider` look, read-only, with the `CEFR_LEVEL_INFO` goal caption. This is the first place `goal_level` gets used.
   - **A checklist with the first item already done (Momentum Bias):**
     - ✓ First conversation
     - ○ `{first lesson title}`
     - ○ Today's challenge
   - **Commitment and reminder, together:** "Practise a little every day?" with a single button, "Remind me daily".
     - iOS: call `enablePush()` from `src/lib/helpers/push-notifications.ts`, the native dialog that shows once. Then set the `PushPrompt` snooze key so the generic banner doesn't ask again.
     - Web: an already-ticked "Email me a daily reminder" checkbox bound to `email_notifications_enabled`.
     - "Not now" is always there. No new DB columns.
   - **One primary button:** "Start {first lesson title}". Below it, a secondary "Talk to the tutor instead".
   - The conversation's own finish screen (`OnboardingConversation.svelte:281-305`) is reduced to the celebration plus a single "Continue" button that moves on to `PLAN`.
4. **Trial step is unchanged.** It still appears after `PLAN` for the same users as today. It just carries the destination chosen on `PLAN` through `pendingDestination`. The paywall test isn't changed.

### Phase 4: A home page for the first session (Empty States, Progressive Disclosure)

1. **Detect a first-run user** in `src/routes/+page.server.ts`: no lessons, stories, reviews or saved words, and no in-progress lesson or game. Return `firstRun: { lessonHref, lessonTitle, conversationDone }`. `conversationDone` is true if the user has the `onboarding_conversation` XP event or `current_streak > 0`.
2. **In `src/routes/+page.svelte`, when `firstRun` is set:**
   - Replace the "Jump back in" panel with a "Start here" card that shows the same 3-item checklist as `PLAN` and one primary button to the first lesson.
   - Hide the all-zero stats ribbon. The week strip stays, because the streak from Phase 3 lights up today.
   - Leave the rest of the page (Scenarios, challenge, Learn and Practice grids) as it is, below that card.
3. **Push banner:** suppress the generic `PushPrompt` on the session where onboarding just finished. `PLAN` has already asked, and asking twice wastes the one-time iOS dialog.

## Not in this plan

- Changing when the paywall appears, or the hard/freemium split. Phase 1's funnel will measure activation for each paywall group.
- The unused `IntroCarousel.svelte` and the `onboarding-dialect-map` branch. Revisit once Phase 1 data shows where people quit before finishing onboarding.
- A daily-minutes goal column and custom reminder times. Phase 3 asks for a commitment without adding any schema.
- Using `goal_level` in lesson, tutor or story generation.

## Files

| File | Change |
|---|---|
| `docs/sql/2026-10-14-onboarding-event.sql`, `src/routes/api/onboarding/event/+server.ts` | new: event table and endpoint |
| `src/lib/analytics.ts` | send `onboarding_*` and `trial_offer_*` events to the endpoint |
| `src/routes/api/auth/sync/+server.ts`, `signup/+page.svelte`, `login/+page.svelte`, `auth/apple-callback/+server.ts` | new-user flag, so native signups go through onboarding (only if confirmed) |
| `src/lib/components/Onboarding.svelte` | step events, reason copy, new `PLAN` step, pass `learningReason` |
| `src/lib/components/onboarding/OnboardingConversation.svelte` | scenario chosen from reason, award XP, simpler finish screen |
| `src/lib/components/onboarding/YourPlan.svelte` | new |
| `src/lib/constants/tutor-scenarios.ts` | 5-line `ordering-coffee` and `talking-about-family`, plus darija for both |
| `src/lib/helpers/first-lesson.ts` | new, shared by onboarding, home page and nudge email |
| `src/lib/helpers/xp-levels.ts`, `src/routes/api/award-xp/+server.ts` | new `onboarding_conversation` XP event type |
| `src/routes/+page.server.ts`, `src/routes/+page.svelte` | first-run "Start here" card, deep-linked "start lesson" |
| `src/routes/+layout.svelte` | don't show `PushPrompt` right after onboarding |
| `src/routes/api/cron/onboarding-nudge/+server.ts` | link the email's button to the first lesson |
| `docs/onboarding-v3-plan.md` | this plan |

## Verification

1. `npm run check`, `npm run lint` and `npm run test` all pass. Add unit tests for `firstLessonHref` (A1, v2 dialect, darija fallback) and for the reason-to-scenario mapping, including the dialect fallback. Run the Svelte MCP `svelte-autofixer` over `YourPlan.svelte` and the edited components until it returns nothing.
2. Phase 1: after the user has run the SQL, reset a test account (`onboarding_completed=false`, via an SQL file the user runs) and go through onboarding on `/?newSignup=true`. Then `select event, props from onboarding_event where user_id = …` should show each step, the conversation events and the exit, in order.
3. iOS: sign up with a fresh Apple ID and a fresh Google account in the simulator. Confirm the onboarding modal opens, a `paywall_variant` of `hard_ios` is saved, and the welcome email is sent.
4. Phase 2: reason Travel with Egyptian should give the café dialog. Reason Heritage with darija should give the new family dialog. Reason Work should give "Introducing yourself".
5. Phase 3: finish the conversation and check the XP toast, then confirm `current_streak = 1` and today's row in `user_daily_activity`. On `PLAN`, the checklist's first item should be ticked. "Start lesson" should open the actual lesson (an A1 user lands on `/alphabet/learn`; a B1 Levantine user lands on a lesson opened from `?lessonId=`). Users eligible for the trial still see it after `PLAN`, and users in the hard group still can't skip it.
6. Phase 4: a fresh account's home page should show "Start here" without the zero-stats ribbon, and the week strip should mark today. After finishing one lesson, the normal home page should come back.
7. The user checks the screens themselves, in light, dark and dim themes and at 375px width. Per the standing preference, I won't take browser screenshots.
8. Two weeks after shipping, re-run the funnel query from the Context section and compare the 52% "never active" and 5% "active at day 7" figures against the new numbers.

## As built: differences from the plan

- **iOS sign-in fix:** confirmed from data, not a simulator. `/api/auth/sync` now returns `needsOnboarding`, which is true for new accounts and for older ones that never finished onboarding, so the 29 Apple users get onboarding on their next sign-in. The three native callers (Google on `/signup`, Google and Apple on `/login`) add `newSignup=true` when it's set. `auth/apple-callback` was left alone because nothing calls it. Sync also sends the welcome email to brand-new native accounts.
- **Scenario dialogs** are 6 lines rather than 5, so the café and family conversations end on the learner speaking: other, student, other, student, other, student.
- **XP for the first conversation** is shown inline on the finish screen ("+20 XP", "Streak started"), not as a toast. The server only awards it within 1 hour of `onboarding_completed_at`, so it can't be claimed again later.
- **The reminder on the plan screen** is a push opt-in on iOS only, shown while iOS can still display its one-time dialog. On the web the screen just says email reminders are on and can be turned off in the profile. Email reminders already default to on, so a checkbox would have changed nothing.
- **Push banner:** no change to `+layout.svelte` was needed. `PushPrompt` mounts only once onboarding closes and reads its snooze date then, so the plan screen sets that date (`snoozePushPrompt` in `push-notifications.ts`) whichever answer the user gives.
- **First lesson for free accounts:** only the first lesson of a curriculum is free (`lessons/structured/[dialect]/+page.svelte:77`). So `firstLesson()` sends subscribers to the first lesson at their level and everyone else to lesson one. A1 learners go to `/alphabet/learn`, and darija learners go to the lesson path page.

## Funnel query

Run this once `onboarding_event` has collected data. Timestamps on `user` are epoch milliseconds.

```sql
with e as (
  select user_id,
    bool_or(event = 'onboarding_step_viewed' and props->>'step' = 'dialect') saw_dialect,
    bool_or(event = 'onboarding_step_viewed' and props->>'step' = 'practice') reached_conversation,
    bool_or(event = 'onboarding_conversation_finished') finished_conversation,
    bool_or(event = 'onboarding_conversation_skipped') skipped_conversation,
    bool_or(event = 'onboarding_step_viewed' and props->>'step' = 'plan') saw_plan,
    bool_or(event = 'onboarding_exit') exited
  from onboarding_event
  where created_at > now() - interval '30 days'
  group by user_id
)
select u.paywall_variant, u.proficiency_level,
  count(*) started,
  count(*) filter (where reached_conversation) reached_conversation,
  count(*) filter (where finished_conversation) finished_conversation,
  count(*) filter (where skipped_conversation) skipped_conversation,
  count(*) filter (where saw_plan) saw_plan,
  count(*) filter (where exited) exited_to_app,
  count(*) filter (where exists (
    select 1 from user_daily_activity a where a.user_id = u.id
      and a.activity_date > u.onboarding_completed_at + 86400000)) active_after_day_1,
  count(*) filter (where exists (
    select 1 from user_daily_activity a where a.user_id = u.id
      and a.activity_date >= u.onboarding_completed_at + 7 * 86400000)) active_after_day_7
from e join public."user" u on u.id = e.user_id
group by rollup (u.paywall_variant, u.proficiency_level)
order by 1, 2;
```
