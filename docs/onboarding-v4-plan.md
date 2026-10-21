# Onboarding v4: show more of the app before the hard paywall

## Context

Every new signup hits the hard paywall as soon as they leave onboarding (`isPaywalled()` in `src/lib/server/paywall-experiment.ts` gates once `onboarding_completed` is set). Right now the only part of the product they see first is one scripted conversation. The last 14 days of `onboarding_event` data cover 44 users: 39 reached the conversation, **20 skipped it**, and 0 reached the lesson the plan screen offers them. That leaves the trial offer with little to recap and no reason to pay.

The paywall stays exactly where it is. Instead, onboarding grows a short **"Try it"** section where every step uses the same sentence, so it reads as "you learned this", not five separate demos. Every step can be skipped:

1. **Read**: the opening of the dialog in their dialect, with Arabic, transliteration, English and the *literal* word-by-word meaning, plus audio.
2. **Conversation**: cut to 3 lines, *you → them → you*, starting with the line they just read. This is the pronunciation step.
3. **Trace**: one very short word from the dialog, 2–3 letters (أنا, سكر, أخ).
4. **Play**: Sentence Scramble on the two lines they said in the conversation (changed from Memory Pairs during the build).
5. **Daily goal**: pick a daily goal (the existing item-based goal, saved via `/api/daily-goal`).

Then, as today: Building → Your plan → Trial offer. Both of these now recap what they actually did.

**Literal meanings were tried and dropped.** A first pass added a hyphenated "Literally:" line per sentence, then word-by-word glosses; both had too many edge cases (joined words like وأخت, idioms, vocative يا), so onboarding shows Arabic, transliteration and English only.

## Flow and state (`src/lib/components/Onboarding.svelte`)

- Add steps to `STEP`: `READ`, `TRACE`, `PLAY`, `DAILY_GOAL`. New order after `handleSubmit()`: `READ → CONVERSATION → TRACE → PLAY → DAILY_GOAL → BUILDING → PLAN → TRIAL`. `handleSubmit` goes to `STEP.READ` instead of `STEP.CONVERSATION`, and `handleConversationFinish` goes to `STEP.TRACE`.
- Add a second, small stepper over `TRY_STEPS = [READ, CONVERSATION, TRACE, PLAY, DAILY_GOAL]`. It reuses the existing stepper markup and styles, driven by a different array.
- Replace `conversationDone: boolean` with one record of what they did:
  ```ts
  let taste = $state({ read: false, spoke: false, traced: false, played: false, goal: null as DailyGoal | null });
  ```
  `conversationDone` becomes `taste.spoke`. Add `stepInfo` entries for the new steps so `onboarding_step_viewed` keeps firing for each one.
- Each new step calls `onDone()` or `onSkip()`. A shared `advance(key, done)` helper sets `taste[key]`, fires `onboarding_try_done` or `onboarding_try_skipped {step}` (the `onboarding_` prefix already passes `isRecordedEvent` in `src/lib/analytics.ts`), and moves to the next step.
- `onboarding_completed` stays where it is, set in `/api/onboarding` on submit. The whole section runs inside the modal with no navigation, so the layout gate can't fire during it. (In chat I'd suggested moving the flag. I'm dropping that: users who quit mid-flow would never be gated.)

## Content (`src/lib/constants/tutor-scenarios.ts` + new `src/lib/constants/onboarding-try.ts`)

- **Conversation lines.** Change `ONBOARDING_LINES` to 3 lines that start on the student's first line:
  - `introducing-yourself: [0, 1, 4]` (unchanged, already you → them → you)
  - `ordering-coffee: [1, 2, 3]` ("I'd like a coffee" → "With sugar?" → "No sugar, thanks")
  - `talking-about-family: [1, 2, 3]` ("I have a brother and a sister" → "Where do they live?" → "They live with my parents…")
  - Check every dialect's dialog has this shape before relying on it.
- **New `onboarding-try.ts`.** Keyed by scenario id, then dialect. The content is written by me, using the existing transliteration rules:
  ```ts
  interface TryContent {
    readLines: number[];        // dialog indices shown on Read: [0] intro; [0, 1] coffee & family (their question, your answer)
    trace: { arabic: string; transliteration: string; english: string };  // 2–3 letters, appears in the dialog
  }
  export function tryContent(scenario: TutorScenario | undefined, dialect: Dialect): TryContent | undefined
  ```
  That's 3 scenarios × 4 dialects. Flag the Darija entries for a native speaker to check. If there's no content for a dialect, `tryContent` returns `undefined` and those steps skip themselves.
- `Onboarding.svelte` works out `scenario = onboardingScenario(learningReason, targetDialect)` once and passes it down, so Read, Conversation, Trace and Play all use the same dialog.

## New components (`src/lib/components/onboarding/`)

- **`ReadSentence.svelte`**: props `{ lines: ScenarioLine[], literal: string[], dialect, onDone, onSkip }`. One card per line, showing Arabic (`font-arabic`, `dir="rtl"`), transliteration, English, and a muted "Literally: …" row. Each card gets `AudioButton` with `bypassPaywall` (as in `OnboardingConversation.svelte:253`). The CTA is "Say it yourself →".
- **`TraceWord.svelte`**: props `{ word, onDone, onSkip }`. A large, faint Arabic glyph rendered as SVG `<text>`, with a freehand drawing layer on top. It uses `perfect-freehand` `getStroke` with the same options and `getSvgPathFromStroke` as `src/lib/components/Canvas.svelte`. Pull that helper into `src/lib/helpers/freehand.ts` and have `Canvas.svelte` import it. There's no accuracy scoring: "Done" turns on once there's enough ink (roughly ≥ 40 points in total). Clear button, `touch-action: none`. No keyboard.
- **`TryScramble.svelte`**: a header and skip link around the game's own `SentenceScramble.svelte`, which gains two optional props: `onFinish` (called after the last sentence, in place of the results screen) and a `literal` line under the English prompt. The sentences come from `scrambleSentences()` in `onboarding-try.ts`: the learner's lines from the conversation. `SentenceScramble` has no free-round gate, so nothing is used up.
- **`DailyGoalPick.svelte`**: three preset cards built from `GOAL_KINDS` labels in `src/lib/constants/daily-goal.ts`:
  - Light: `[{review, 10}]`
  - Steady: `[{review, 10}, {game, 1}]`
  - Serious: `[{review, 20}, {game, 1}, {lesson, 1}]`
  Picking one POSTs `{ goal }` to `/api/daily-goal` (validated by `parseGoal`) and calls `onDone(goal)`. Skip saves nothing.

## Conversation (`OnboardingConversation.svelte`)

- Accept `scenario` as a prop instead of deriving it, so the parent and child agree on the dialog. Lines still come from `onboardingLines(scenario, dialect)`.
- Change the intro copy: the first line is now one they've already read ("You just read this. Now say it.").
- XP award, streak, skip and listen mode stay unchanged.

## Recap

- **`YourPlan.svelte`**: replace the `conversationDone` prop with `taste`. Checklist: "Your first sentence: read, said, written" (done if any of read, spoke or traced is done), then the lesson, then "Today's goal: {describeGoal(taste.goal)}" when a goal was set, otherwise "Today's challenge" as now.
- **`TrialOffer.svelte`**: replace `conversationDone` with an optional `taste` prop. `hasRecap` is true if any taste field is set or `goalLevel` is set. Add recap rows for the traced word (show the Arabic), the scramble and the daily goal, next to the existing conversation row. `/paywall` doesn't pass `taste`, so it renders as today.

## Files

- Modified: `src/lib/components/Onboarding.svelte`, `src/lib/components/onboarding/OnboardingConversation.svelte`, `src/lib/components/onboarding/YourPlan.svelte`, `src/lib/components/TrialOffer.svelte`, `src/lib/constants/tutor-scenarios.ts`, `src/lib/components/games/SentenceScramble.svelte`, `src/lib/games/sentence-scramble.ts`, `src/lib/components/Canvas.svelte`
- New: `src/lib/constants/onboarding-try.ts`, `src/lib/helpers/freehand.ts`, `src/lib/components/onboarding/{ReadSentence,TraceWord,TryScramble,DailyGoalPick}.svelte`
- Copy this plan to `docs/onboarding-v4-plan.md` (repo convention).
- No SQL: `daily_goal` and `onboarding_event` already exist.

## Verification

1. **Unit tests** (vitest, next to `src/lib/helpers/first-lesson.test.ts`):
   - `onboardingLines` returns 3 lines starting with `speaker: 'student'` for every scenario × dialect.
   - `tryContent` exists for all 12 combinations. Each trace word is ≤ 3 letters and appears in the dialog. Every Read and conversation line has a `literal`.
   - `scrambleSentences` gives 2 sentences per combination, each with a literal meaning and at least 2 different words.
2. `npm run check` adds no new type errors. Run `svelte-autofixer` on every new or changed `.svelte` file until it's clean.
3. **Manual pass** (done by the user, per the visual-verification preference): sign up fresh on web and on mobile width, then:
   - Run all four reasons × dialects you care about.
   - Skip each step once.
   - Confirm the trace works by finger on a phone.
   - Confirm the trial offer recap shows what was done.
4. **Funnel, after deploy**: run `select props->>'step', event, count(distinct user_id) from onboarding_event where event in ('onboarding_try_done','onboarding_try_skipped') group by 1,2`. It shows which steps people complete. Then compare `trial_offer_shown` → `paywall_checkout_started` rates before and after.
