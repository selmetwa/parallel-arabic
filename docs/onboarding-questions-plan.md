# Onboarding: challenges, daily time, reminder time, streak commitment

## Context
The user wants four question screens like the reference app (Speak-style): "What are your challenges?", "How much time can you study each day?", "When can you dedicate N minutes?" and "Commit to a streak". They should go **before the interactive Try-it exercises**. The time slider **replaces** the current Daily goal step (Light / Steady / Serious). The user doesn't want to spam people, so the reminder screen **moves the one existing daily reminder** to a time they choose. It adds no new emails or pushes.

The last 30 days of `onboarding_event` show the question screens cost little: welcome 78 → dialect 76 → goals 73 → level 72 → target 71. The real drop-off is inside Try it and the plan. Four short tap-only screens up front are low risk, and every answer is used later in the flow.

The first implementation step copies this plan into `docs/onboarding-questions-plan.md`, so it lives in the repo alongside the other onboarding plans.

## New flow (`src/lib/components/Onboarding.svelte`)
```
Welcome → Dialect → Why → Challenges* → Level → Target → Daily time* → Reminder* → Streak*
  → (submit) → Read → Conversation → Trace → Play → Building → Plan → Trial
```
- In `STEP`, add `CHALLENGES`, `DAILY_TIME`, `REMINDER` and `STREAK`, and renumber. Add them to `STEPPER_STEPS` and `stepInfo` so `onboarding_step_viewed` fires for each.
- Remove `DAILY_GOAL` from `TRY_STEPS` and `nextTryStep`. `DailyGoalPick.svelte` is no longer used; delete it.
- `nextStep()`: `GOAL` (target) now advances to `DAILY_TIME`. `handleSubmit()` moves to the end of `STREAK`. The Skip pill and `skipGoal` follow the footer range, which becomes `step >= DIALECT && step <= STREAK`. Skipping a new screen leaves its value null.
- `tried.goal` is set from the chosen minutes when the user submits, so the YourPlan checklist and the TrialOffer recap ("Every day: …") still work unchanged.

## The four screens (new components in `src/lib/components/onboarding/`)
Each screen reuses the card and `press` styles already used by the Reason and Dialect screens. They're all taps, with no typing.

1. **`ChallengesPick.svelte`**: multi-select grid, up to 6 options, with a Continue button.
   - Options: Listening, Speaking, Where to start, Staying motivated, Grammar, Too many words. Ids go in `src/lib/constants/onboarding-questions.ts`.
2. **`DailyTimePick.svelte`**: slider over 5 / 10 / 15 / 20 / 30 min.
   - Shows a label per stop ("light", "solid commitment"…) and an estimate chip ("~N new words a month", `N = minutes × 10`). That multiplier is a placeholder; confirm the claim before shipping.
   - CTA: "I'm committed".
   - `minutesToGoal()` in the same constants file maps minutes onto the existing `DailyGoal` presets: 5 → Light, 10–15 → Steady, 20–30 → Serious, using `GOAL_KINDS` from `src/lib/constants/daily-goal.ts`.
3. **`ReminderPick.svelte`**: "When can you fit in N minutes?" with Morning / Afternoon / Evening / Night, plus "No reminders".
   - Sub-copy: "One reminder at most, and only on days you haven't practised."
   - **iOS:** picking a time calls the existing `enablePush()` from `src/lib/helpers/push-notifications.ts` here, instead of on the plan screen. Remove that prompt from `YourPlan.svelte` and keep its snooze logic.
   - **Web:** this sets the window for the existing streak email.
4. **`StreakGoalPick.svelte`**: 7 / 14 / 30 / 50 days (Good / Great / Incredible / Unstoppable), defaulting to 7.
   - Note under the options: "Streak goals help you build a habit."
   - CTA: "Build my plan", which submits.

## Saving (`src/routes/api/onboarding/+server.ts` + SQL)
- New file `docs/sql/2026-10-25-onboarding-questions.sql`. The user runs it, because the Supabase MCP is read-only. It adds these columns to `public."user"`:
  - `learning_challenges text[]`
  - `daily_minutes smallint`
  - `reminder_window text` (null means evening, today's behaviour)
  - `streak_goal smallint`
- `/api/onboarding` accepts and validates the four fields against the constants. It writes `daily_goal = minutesToGoal(daily_minutes)` in the same update, so there's no separate `/api/daily-goal` call.
- Events: `onboarding_challenges_chosen`, `onboarding_minutes_chosen`, `onboarding_reminder_chosen` and `onboarding_streak_goal_chosen`. These pass `isRecordedEvent` as they are.

## Reminder timing, with no extra sends
- Move the hard-coded `EVENING = [16, 23]` into `src/lib/helpers/streak.ts`, which both files already import from. Make it `REMINDER_WINDOWS` with morning `[6,13]`, afternoon `[11,18]`, evening `[16,23]` and night `[20,3]` (wraps midnight). Add a helper `inReminderWindow(hour, window)`.
  - The windows stay 7 hours long, so the existing 4 runs (00/06/12/18 UTC) still reach every time zone. No new crons are needed.
- `src/lib/helpers/push-plan.ts:39` and `src/routes/api/cron/send-streak-reminders/+server.ts` use the user's `reminder_window`, defaulting to evening. `'off'` skips the streak email and push; the weekly recap is unchanged.
  - Add `reminder_window` and `streak_goal` to both selects.
  - The 12-hour resend guard and the "one push a day" rule stay as they are, so a learner still gets at most one reminder a day.
- The comeback emails keep the evening window, which is unchanged.

## Using the answers later
- **`buildingLines`** (Building screen) gets "Focusing on speaking and listening" from the first two challenges. **`YourPlan.svelte`** shows "Day 1 of your N-day streak goal".
- **`TrialOffer.svelte` `benefits`**: lead with the benefit that matches their first challenge. For example, speaking → "Speak … with live corrections", too many words → "Words that come back…". Pass `challenges` in from Onboarding.
- **Streak reminder copy** (`sendStreakReminderEmail` and push `copy('streak')`): mention the goal when it's set, e.g. "Day 6 of your 14-day goal".

## Out of scope (note it, don't build)
- Choosing a new streak goal once one is reached.
- Showing the goal in Navigation streak widgets.
- Hourly-precise reminder times.

## Verification
- Unit tests in `src/lib/constants/onboarding-questions.test.ts` covering `minutesToGoal` (and that its output passes `parseGoal`) and `inReminderWindow`, including night wrapping past midnight and every UTC offset getting at least one of the 4 runs in each window.
- `rtk proxy npx vitest run`, and `rtk proxy npx svelte-check --threshold error --output machine`: the error count must stay ≤ 224 with none in the changed files.
- Svelte MCP autofixer on each new component.
- Manual check by the user (no browser MCP): run the new SQL. Then, on web and on iOS, go through onboarding:
  - choose answers, then skip each new screen once
  - confirm the `user` row has the four columns and a `daily_goal`
  - confirm the iOS push prompt appears on the Reminder screen and no longer on the plan screen
  - call `/api/cron/send-streak-reminders` with a test user whose `reminder_window` is `morning` and whose local time is 09:00, and confirm one email or push and no second send

## Follow-up: acting on "What's hardest for you?"
`challengeHelp()` in `src/lib/constants/onboarding-questions.ts` maps each challenge to a feature screenshot and a short pitch, a daily-goal item, the Try-it step that tackles it, and optionally a first destination. It's used in four places:
1. **Help screen** (`STEP.HELP`, straight after Challenges): up to three cards, with screenshots from `FEATURES`. It's skipped when nothing was picked.
2. **Daily goal**: `buildGoal(minutes, challenges, dialect)`. The minutes set how many items; the challenges, in the order picked, set which ones, topped up from the old presets. Used by both `/api/onboarding` and `tried.goal`.
3. **Try-it tag**: Read, Conversation and Play each show "You said X is hardest…" when they match a challenge.
4. **Plan screen**: the first stop goes to the place for their first challenge that has one:
   - speaking → tutor
   - understanding people → stories, only for dialects that have stories
   - grammar → verb tables

   Otherwise it's the first lesson.
