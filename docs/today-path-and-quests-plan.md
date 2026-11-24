# Today path + daily quests

First step when implementing: copy this plan to `docs/today-path-and-quests-plan.md` (repo convention).

## Context

People who can use the app come back at a healthy rate. Of the Oct 18 – Nov 16 signups who subscribed or started a trial, 30 of 49 returned on a later day. Usage is still shallow, though: of 258 people active in the last 28 days, only about 30 were active on 4 or more days. The regulars use lessons, the tutor, games and review. Newcomers face a home page with about 10 sections of equal weight.

Two Duolingo mechanics address this:
1. **One path, one button.** The home page leads with a short ordered list of today's steps and a single Continue button. Finishing a step hands the learner straight to the next one.
2. **Daily quests.** Three small objectives the app picks each day, with a reward, to give a reason for "one more".

This is for subscribers and trial users. New signups have hit a hard paywall since Oct 18, and conversion is a separate project.

What already exists and gets reused:
- **Daily goal.** `src/lib/constants/daily-goal.ts` defines `GOAL_KINDS`, `goalProgress` and `parseGoal`, and the goal is stored in `user.daily_goal`. 240 of the 276 people active this month have one set.
- **Activity counting** since local midnight: `countActivity()` in `src/lib/server/activity.ts`, with `localDayStart()` from `src/lib/helpers/streak.ts`.
- **Home page server load:** `src/routes/+page.server.ts`. It already works out `inProgressLesson`, `cappedReviewCount`, `firstRun` and the `suggestions` list.
- **Lessons:** `getCurriculumV2()` in `src/lib/data/curriculum-v2.ts` gives the lesson order, and `firstLesson()` in `src/lib/helpers/first-lesson.ts` gives the starting point.
- **Today's game:** `/learn/game/today` (Daily Root plus `gameOfTheDay()` in `src/lib/games/today.ts`).
- **End screens:** the review `sessionComplete` block in `src/routes/review/+page.svelte`, `GameResults.svelte` (shared by 15 games), and `onLessonComplete` in `LessonPlayerV2.svelte` (used by `src/routes/lessons/structured/[dialect]/+page.svelte`).
- **XP:** `awardXp()` in `src/lib/helpers/award-xp.ts` and `XP_AWARDS` in `src/lib/helpers/xp-levels.ts`.
- **Streak freezes:** `FREEZE_EVERY = 7`, `MAX_FREEZES = 2` in `streak.ts`, stored in `user.streak_freezes`.
- **Event tracking:** `trackEvent()` and `RECORDED_PREFIXES` in `src/lib/analytics.ts`.

Branch: start a new branch from `origin/master`, `today-path`. Don't build on `push-diagnostics`, which holds uncommitted diagnostics work: commit or set that aside first.

---

## Part 1: Today path

### Building the path (server)

New file `src/lib/server/today-path.ts`, exporting `buildTodayPath(user, counts, ctx)`. It is pure apart from the lesson lookup, so it can be tested.

- **Which steps:** the learner's own `daily_goal` items. With no goal set, use the default: review 10 (only if any words are due) + lesson + game.
- **Order:** review → lesson → game → speak → tutor → story.
- **Each step** is `{ kind, label, href, done, target, complete }`, where `done` comes from `countActivity`. The link is specific, not a hub page:
  - **review** → `/review`. The label uses the capped due count, e.g. "Review 10 words".
  - **lesson** → the `inProgressLesson` deep link if there is one. Otherwise the first topic in `getCurriculumV2(dialect)` with no completed `structured_lesson_progress` row, starting from the learner's level module (the same rule as `firstLesson`). Dialects without a v2 curriculum, such as Darija, fall back to `/lessons/structured/{dialect}`. If every lesson is done, the step turns into a story step.
  - **game** → `/learn/game/today`.
  - **speak / tutor / story** → the existing `GOAL_KINDS[kind].href`.
- **Review with nothing due:** if the goal includes review but nothing is due and no reviews were done today, drop the step rather than show something that can't be done. Count the path as done without it.
- **Returns** `{ steps, next, completed, allDone }`, where `next` is the first incomplete step.

In `src/routes/+page.server.ts`:
- Return `todayPath` in place of `dailyGoal`, from the `countActivity` call it already makes.
- The `firstRun` case stays as it is. The "Start here" card already is a one-step path for brand-new learners.

New endpoint `src/routes/api/today/+server.ts` (GET): returns the same `buildTodayPath` result for the signed-in user. The end screens use it to show the next step.

### Today card (home page)

New `src/lib/components/TodayPath.svelte` goes at the top of the signed-in home page, above the week strip. It replaces both "Jump back in" and the `DailyGoal` ring:

```
┌ Today ─────────────────────── 1 of 3 ┐
│ ✓ Review 10 words                    │
│ ▶ Lesson: Ordering at a café         │
│ ○ Today's game: Word Scramble        │
│        [ Continue → ]                │
│                       Edit goal      │
└──────────────────────────────────────┘
```

- **One main button**, pointing to `next.href`. Each step's link carries `?from=today`.
- **"Edit goal"** opens the existing goal picker. Move the picker out of `DailyGoal.svelte` into `GoalPicker.svelte` so both can use it.
- **When everything is done:** "Done for today ✓" with the streak, plus one optional extra (practise more → `/learn/game`).
- **Rest of the home page:** lower sections stay in their current order beneath Today. The stats ribbon folds into the week strip to cut one section. Remove "Jump back in" and its `suggestions` code once nothing uses it.

### Handing off between steps

New `src/lib/components/TodayNext.svelte`:
- Shows only when the URL has `from=today`. It fetches `/api/today` and shows "Next: {next.label} →", or "Today's path is done 🎉 → Home" when everything is complete.
- It goes in three places:
  1. the review `sessionComplete` block,
  2. `GameResults.svelte`, through its `children` slot or directly, which covers 15 games at once,
  3. the lesson completion screen in `LessonPlayerV2`.
- **Carrying `from=today`:** lesson and game pages may change their URL during play. In that case, record it on entry in a `sessionStorage` flag (`todayFlow`), wrapped in try/catch. `TodayNext` checks the flag as well as the URL.
- **Speak, tutor and story** have no clear end screen, so they get no handoff for now. The home card picks them up when the learner returns.

### Tracking

- Add `'today_'` to `RECORDED_PREFIXES`.
- Events:
  - `today_step_started` `{ kind }`, when the button or a step is clicked,
  - `today_next_clicked` `{ kind }`, from `TodayNext`,
  - `today_path_done` `{ steps }`, the first time the card shows `allDone` that day, de-duplicated with a `localStorage` key per local date.

---

## Part 2: Daily quests

Build this after Part 1 has run for about 2 weeks.

### Picking quests

New `src/lib/constants/quests.ts`:
- **The pool**, with each quest's counter:

  | Quest | Counted from |
  |---|---|
  | Review 15 words | `word_review` |
  | Save 3 new words | `saved_word.created_at` |
  | Say 5 sentences out loud | `activity_event` speak |
  | Play 2 games | `activity_event` game |
  | Finish a lesson | `structured_lesson_progress`, in seconds |
  | Send 6 messages to your tutor | `tutor_message` where role = user, joined to `tutor_conversation.user_id` |
  | Read a story | `user_story_completion` |
  | Finish today's path | `buildTodayPath().allDone` |

- **`pickQuests(userId, localDayKey, eligibility)`:** a seeded hash picks 3 quests, so the same user gets the same quests all day with nothing stored.
- **Eligibility:** no review quest when nothing is due; no save quest with no saved words in the last 14 days and no lesson access; no lesson quest when the curriculum is finished. Avoid repeating a quest that is already part of the learner's goal, so quests add variety.

In `countActivity`, add `saved` and `tutorMessages` counts and widen the type. Add those fields to `ActivityCounts` without making them goal kinds.

### Rewards

New table `quest_claim (user_id text references "user"(id) on delete cascade, day_key text, claimed_at bigint, primary key (user_id, day_key))`.
- Deliver it as `docs/sql/2026-11-24-quest-claim.sql`. Supabase MCP is read-only, so you run it.
- Enable RLS with no policies, as it's only accessed through the service role, like the other tables.

New endpoint `POST /api/quests/claim`:
1. Recompute the quests and counts on the server. Never trust the client.
2. If all 3 are complete and no row exists for today, insert one and call `awardXp(userId, 'quests_bonus')`. Add `quests_bonus: 30` to `XP_AWARDS`.
3. **Freeze reward:** count claims in the last 7 days. If this claim makes the 5th, add a streak freeze up to `MAX_FREEZES`.
4. Return `{ xpAwarded, freezeEarned }`.

### Quests card

New `src/lib/components/DailyQuests.svelte`, placed just below the Today card:
- Shows three compact rows, each with a progress bar (e.g. "2/5").
- When all 3 are done, it claims automatically on load, shows a brief celebration using the existing `hapticSuccess` and confetti style if there is one, then "Come back tomorrow for new quests".
- Shows weekly progress toward the freeze: "3 of 5 days this week → earn a streak freeze".
- The home page loader returns `quests` (definitions + progress + claimed) next to `todayPath`.

Monthly badge: left for a later version and not built now.

Tracking: `quest_completed` `{ id }` and `quests_claimed` `{ freezeEarned }`. Add `'quest'` to `RECORDED_PREFIXES`.

---

## Tests

- Unit tests (vitest, next to `src/lib/constants/daily-goal.test.ts`):
  - `buildTodayPath`: ordering, the default path, the no-due review drop, the lesson fallback chain, `allDone`.
  - `pickQuests`: the same seed gives the same quests, eligibility filters work, no repeats from the goal.
  - The claim rules: no double claim, the freeze on the 5th claim in 7 days, the cap at `MAX_FREEZES`.
- `npm run check`: no new errors in the files this touches. There are 216 errors in other files already.

## Verification (end to end)

1. `npm run dev`, signed in as a subscriber with a goal set (review + lesson + game), and some words due:
   - The Today card lists 3 steps, and Continue goes to `/review?from=today`.
   - Finishing the review session shows "Next: Lesson: …". Clicking it opens the right lesson.
   - Finishing the lesson shows "Next: Today's game". The game's results screen shows "Today's path is done".
   - Back on the home page: "Done for today ✓".
2. A user with no goal gets the default path. A user with nothing due loses the review step. A Darija user's lesson step falls back to their lessons page.
3. Quests, after running the SQL file: complete all 3. A `quest_claim` row appears and XP goes up by 30. Reloading doesn't claim again. Insert 4 earlier claims by hand, claim a 5th, and `streak_freezes` goes up.
4. You check it visually in the browser. I won't take screenshots.
5. After deploy, check with SQL: the counts of `today_path_done` and `quests_claimed` events per day, against active days per week for subscribers (baseline about 30 users active 4+ days in 28 days).

---

## Implementation notes (Part 1, 2026-11-24)

Where the build differs from the plan above:

- **No `?from=today` query param.** A `sessionStorage` flag for today's date (`src/lib/helpers/today-flow.ts`) marks the flow. It's set when a step or Continue is clicked on the Today card, so the links stay clean and survive pages that rewrite their URL.
- **The stats ribbon wasn't folded into the week strip.** That's a visual change best judged in the browser. The Today card leads the page, and "Jump back in" plus the goal ring are gone. `DailyGoal.svelte` became `GoalPicker.svelte`.
- **Today's challenge now counts as a game.** Its games never logged rounds, so "Play a game" ignored it. `/api/daily-game-challenge` now logs one `game` activity on a successful claim.
- **Free learners.** The lesson step only offers lesson one. Once that's done, the step becomes "Read a story".
- **End screens.**
  - The lesson-complete screen saves the lesson before moving on, because completion is only recorded on "Finish".
  - Review counts the desk as cleared, because reviews sync to the server in the background.
- **New goal: "Practice writing"** (Write 3/5/10 sentences → `/sentences`). A sentence counts when it's typed correctly. `/api/award-xp` logs an `activity_event` of kind `write` on each `sentence_correct` award, so it also counts writing steps inside lessons. It comes after "speak" in the path, and the weekly recap email lists "sentences written".

## Implementation notes (Part 2, 2026-11-24)

Built straight after Part 1, at the user's request, instead of waiting 2 weeks.

- **Code.**
  - `src/lib/constants/quests.ts`: the pool, seeded `pickQuests`, `questProgress` and `weekStartKey`.
  - `src/lib/server/quests.ts`: `loadQuests` and `claimQuests`.
  - `POST /api/quests/claim`.
  - `DailyQuests.svelte`, placed under the Today card.
- **"Play 2 different games" became "Play 2 games",** because rounds aren't logged per game. "Write 3 sentences" was added to the pool.
- **Freeze rule:** the 5th claim in a local Monday-to-Sunday week earns a freeze, up to `MAX_FREEZES`. The card shows "N of 5 quest days this week".
- **The card claims automatically** when the home page loads with all three done. `quests_bonus` (30 XP) isn't in `/api/award-xp`'s allowlist, so only the claim endpoint can pay it.
- **Before `docs/sql/2026-11-24-quest-claim.sql` runs,** the card shows and counts progress, but claiming fails with "Try again".

## Merge + quest tracker (2026-11-24)

The path and quests looked like two checklists of the same activities, so they're now one card using WoW's split.

- **Home card, `TodayQuests.svelte`:**
  - **Main quest:** the learner's goal steps, in order, with the Continue button and "Edit main quest".
  - **Side quests:** three picked by the app, with the reward.
  - It replaces `TodayPath.svelte` and `DailyQuests.svelte`. "Finish today's path" left the side-quest pool.
- **Tracker on every page, `QuestTracker.svelte`:**
  - **Layout:** a collapsible panel, bottom-left, mounted in `+layout.svelte` for signed-in learners. It shows the next main-quest step and the side quests.
  - **Hidden** on home, the paywall, pricing and auth pages, and during onboarding.
  - **Collapsed state** is remembered in `localStorage`.
  - It sits under the lesson player and full-screen games (z-index 40 < 60).
- **Shared state, `src/lib/stores/today-quests.svelte.ts`:** feeds both views.
  - **Refreshes:**
    - from `GET /api/quests`, 1.5s after any successful non-GET to an endpoint that moves a quest (saving words, XP, activity, speech, reviews, tutor, lesson complete, daily challenge), via a one-time `window.fetch` wrapper,
    - after each navigation,
    - when the tab becomes visible.
  - **Toasts:** "Side quest done: …", "Main quest: … ✓", "Main quest complete 🎉".
  - **Reward:** claimed as soon as the last side quest completes, on whatever page that happens.
