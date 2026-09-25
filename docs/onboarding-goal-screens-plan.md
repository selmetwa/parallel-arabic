# Onboarding: intro carousel + "where you are / where you want to get to" level sliders

**Status: implemented, pending the `goal_level` migration being applied to Supabase** (`docs/sql/2026-09-25-add-user-goal-level.sql`).

## Context

Onboarding today asks three questions as grids of tap-cards (dialect → why → current level), then drops the user into the scripted first conversation. Two problems this change addresses:

1. **The level question reads as a test, not a goal.** A 6-card grid of CEFR tags asks "what are you?" and nothing asks "what do you want?". Capturing a *target* level gives the user a reason to come back and gives us a column to personalise against later.
2. **Nothing sells the product before the questions start.** The user lands on a welcome hero and is immediately interrogated.

Modelled on the reference screenshots: a swipeable full-bleed value-prop intro, then two near-identical slider screens — "How strong is your Arabic right now?" and "Where do you want to get to in the next year?" — each a row of CEFR dots on a track with **a plain-English caption underneath that changes with the selection** ("I'm starting from scratch", "I want to hold conversations on familiar topics"). The caption is the point of the screen: the CEFR tag is jargon, the sentence under it is what the user actually recognises about themselves.

Decisions already made:
- **Scale stays A1–C2** (the DB CHECK, `normalizeCefrLevel`, `LEVEL_GUIDANCE`, `LEVEL_MIX` and every curriculum already branch on it). No A0.
- **The goal level is stored, not yet consumed.** New nullable `user.goal_level`, exposed on layout data and editable on the profile page. No change to lesson/tutor/story generation in this change.
- **No new webfont.** The handwritten caption becomes a large brand-coloured italic line in ReadexPro (the house idiom — 81 `italic` uses in `src/`), animated on change.

## Current shape (what we're editing)

Onboarding is one 553-line component, not a route: `src/lib/components/Onboarding.svelte`, mounted from `src/routes/+layout.svelte:407` when `showOnboarding` (`+layout.server.ts:27`). All answers live in local `$state` and are written once by `handleSubmit()` (`Onboarding.svelte:117`) to `POST /api/onboarding`. Steps are bare integers (`step === 3` etc.) used in ~12 places.

## Plan

### 1. Shared CEFR constant — `src/lib/constants/cefr-levels.ts` (new)

Every consumer currently re-declares the level list (`Onboarding.svelte:64`, `api/onboarding/+server.ts:23`, `profile/+page.server.ts:344`, `profile/+page.svelte:539`). Create one source for the onboarding path:

```ts
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CEFR_LEVEL_INFO: Record<CefrLevel, { label: string; now: string; goal: string }> = {
  A1: { label: 'Complete Beginner', now: "I'm starting from scratch",                  goal: 'I want to read the alphabet and greet people' },
  A2: { label: 'Elementary',        now: 'I know greetings and a few basic phrases',   goal: 'I want to order food, shop and handle the basics' },
  B1: { label: 'Intermediate',      now: 'I can get through simple everyday chats',    goal: 'I want to hold conversations on familiar topics' },
  B2: { label: 'Upper Intermediate',now: 'I can talk about most topics without effort',goal: 'I want to speak comfortably about almost anything' },
  C1: { label: 'Advanced',          now: 'I can handle complex discussions',           goal: 'I want to follow films and debates, and argue my point' },
  C2: { label: 'Proficient',        now: 'I can use Arabic like a native speaker',     goal: 'I want to pass for a native speaker' }
};
```

Import it in `Onboarding.svelte` (replacing the inline `proficiencyLevels` array) and in `api/onboarding/+server.ts` (replacing the inline `validLevels`). Leave the other ad-hoc pickers alone — out of scope.

### 2. `src/lib/components/onboarding/LevelSlider.svelte` (new)

The repo has **no slider, no `role="slider"`, no `aria-valuenow` anywhere** — this is the first. The interaction in the reference is *tapping a stop*, not dragging, so build it as a radio group, which matches existing precedent (`role="group"` + `aria-pressed` toggle rows in `tutor/+page.svelte:1673`, `ConversationMessage.svelte:60`) and gets keyboard support honestly.

```ts
interface Props {
  value: CefrLevel | '';
  onSelect: (level: CefrLevel) => void;
  variant: 'now' | 'goal';       // which caption set to read, and the fill colour
  minLevel?: CefrLevel;          // goal screen only: stops below this are locked
  hint: string;                  // "Tap on the level that best describes you"
}
```

Structure — a 6-column grid, one column per stop, with the rail drawn behind:
- label row (`A1 … C2`), dot row, then the caption.
- Rail: a 2px line absolutely positioned across dot centres (inset by half a column), `background: var(--tile5)`. Fill: a second line whose `left`/`width` are `$derived` from `startIndex` and `selectedIndex` over `n - 1`. On `variant="now"` the fill runs from A1 to the selection in `var(--brand)`; on `variant="goal"` it runs from `minLevel` to the selection, stops below `minLevel` render muted-and-disabled ("already there"), stops above the selection stay grey.
- Dots are real `<button type="button" role="radio" aria-checked={...}>` inside `role="radiogroup" aria-label={hint}`; selected = hollow ring in the accent, reached = filled accent, unreached = `var(--tile6)`.
- Roving tabindex (only the selected stop is `tabindex="0"`) + `onkeydown` for ArrowLeft/Right/Up/Down/Home/End, following the `Enter`/`Space` + `preventDefault` idiom in `ReviewCard.svelte:481`.
- Caption underneath, wrapped in `{#key value}` with `in:fly={{ y: 8 }}` so it swaps visibly: `text-xl sm:text-2xl italic text-brand text-center`, min-height reserved for two lines so the layout doesn't jump between short and long captions.
- Close the `<style>` block with `@media (prefers-reduced-motion: reduce)`, as every animated component in the repo does.

House style to match: `src/lib/components/lesson-v2/LessonMcqStep.svelte` — `interface Props` above `$props()`, callback props (no `createEventDispatcher`), `$derived`, `onclick`, scoped CSS on raw `var(--brand)` / `var(--tile*)` tokens.

### 3. `src/lib/components/onboarding/IntroCarousel.svelte` (new)

Three full-bleed slides, `onDone: () => void` as its only prop. Per slide: a large headline, a supporting line with two or three key words wrapped in an accent `<strong>`, and a big low-opacity Arabic glyph as the illustration — reuse the `Rakkas` watermark technique already in `LessonPlayerV2.svelte:356` (`Rakkas` is loaded non-blockingly in `src/app.html:24`; there is no illustration set in this repo and this change should not add one).

Copy (no "AI" in body copy except the "AI Tutor" product name, per house convention):
1. **"Arabic isn't one language"** — Learn **Egyptian**, **Levantine**, **Moroccan** or **Fusha**, not a blend of all four.
2. **"All it takes is one conversation a day"** — Practice **speaking** or **writing** with the AI Tutor, and get corrected as you go.
3. **"Nothing you learn slips away"** — Every story and lesson feeds your **review deck**, so the words come back before you forget them.

Advance on: swipe (`pointerdown`/`pointerup`, ~40px horizontal threshold), tap/click anywhere, ArrowRight/ArrowLeft, or clicking a dot. Dots + "Swipe to continue" (swap to "Tap to continue" when `window.matchMedia('(hover: hover)')` matches). Past the last slide, call `onDone()`.

### 4. `src/lib/components/Onboarding.svelte` (modify)

**Replace the bare step integers with a named map** before inserting anything — two new steps shift every index and there are ~12 magic-number comparisons:

```ts
const STEP = { WELCOME: 0, INTRO: 1, DIALECT: 2, REASON: 3, LEVEL: 4, GOAL: 5, CONVERSATION: 6, TRIAL: 7 } as const;
```

Then:
- **`stepInfo` must gain entries for the two new steps** — `stepInfo[step].subtitle` at `:280` throws on a missing index. Give it one entry per step; mark which steps appear in the header stepper.
- **Stepper** (`:247-276`): `totalSteps` goes 4 → 5 (Welcome, Dialect, Reason, Level, Goal). Hide the whole header on `INTRO` (the carousel has its own dots), and on `CONVERSATION` / `TRIAL` as today. The dots stay jump-back buttons (`if (i < step) step = i`) — verify jumping back from GOAL to LEVEL doesn't leave a goal below the new current level (see below).
- **LEVEL step** replaces the card grid at `:420-467` with `<LevelSlider variant="now" value={proficiencyLevel} onSelect={...} hint="Tap on the level that best describes you" />` under the heading "How strong is your Arabic right now?" / "We'll meet you where you are — this shapes your lessons and your tutor."
- **GOAL step** (new) — "Where do you want to get to in the next year?" / "Pick a level and we'll build your path towards it.", `<LevelSlider variant="goal" value={goalLevel} minLevel={proficiencyLevel} hint="Tap on your goal level" />`.
- **No auto-advance on these two steps.** `selectLevel`'s `setTimeout(nextStep, 400)` (`:112`) is wrong for a slider — people explore the stops. Both steps get an explicit primary **Continue** pill (reuse the "Get Started" button styling at `:331-343`), disabled until a stop is chosen. `selectDialect` / `selectReason` keep auto-advancing.
- **Default the goal** when the user first lands on GOAL: `goalLevel ||= ` two stops above `proficiencyLevel` (clamped to C2), so the screen is never empty and the fill reads as a journey. Changing the current level backwards re-clamps `goalLevel` up to at least `proficiencyLevel`.
- **`nextStep()`** (`:82`): submit moves from `step === 3` to `step === STEP.GOAL`; `handleSubmit()` then sets `step = STEP.CONVERSATION`.
- **`handleSubmit()`** (`:117`) sends `goal_level: goalLevel || null` alongside the existing three fields.
- **Footer** (`:525`): the `step > 0 && step < 4` gate becomes `step >= STEP.DIALECT && step <= STEP.GOAL`. Note the existing bug that **Skip calls the guarded `nextStep()` and so does nothing on an unanswered step** — for GOAL specifically, Skip should genuinely skip (submit with `goal_level: null`), since the column is nullable. Keep the existing behaviour on the other steps rather than fixing it here.
- `trackEvent` is a no-op stub since PostHog was removed (`src/lib/analytics.ts:5`) — add calls for consistency if you like, but don't plan on reading them.

### 5. Database — one migration

No migrations directory exists; `schema.sql` is a stale dump (not the source of truth). The Supabase MCP connection here is read-only, so this has to be run by hand in the Supabase SQL editor — the SQL lives at `docs/sql/2026-09-25-add-user-goal-level.sql`:

```sql
alter table public."user" add column goal_level text;
alter table public."user" add constraint user_goal_level_check
  check (goal_level is null or goal_level in ('A1','A2','B1','B2','C1','C2'));
```

Nullable — 614 existing users have no `proficiency_level` at all, so the goal must tolerate absence everywhere it's read.

### 6. Server + profile (small)

- `src/routes/api/onboarding/+server.ts`: import `CEFR_LEVELS`; accept `goal_level`; reject it if present and not in the list, or if its index is below `proficiency_level`'s; add it to `updateData` only when non-null.
- `src/routes/+layout.server.ts:44`: add `goalLevel: user?.goal_level || null`, and pass it through `src/routes/+layout.ts:69` next to `proficiencyLevel`.
- `src/routes/profile/+page.server.ts`: add `goal_level` to the select at `:32`, return `goalLevel` at `:205`, and extend the existing `updateProficiencyLevel` action (`:331-377`) to also read and write an optional `goal_level`.
- `src/routes/profile/+page.svelte:518-555`: a second `<select>` beside the existing level one, labelled "Goal level", options from `CEFR_LEVELS` plus a blank "Not set".

### 7. Docs

Copy this plan into `docs/onboarding-goal-screens-plan.md` as part of the change (the repo keeps its plans under `docs/`), updating the status line once implemented.

## Files

| File | Change |
|---|---|
`src/lib/constants/cefr-levels.ts` | new — levels, type, labels, both caption sets |
`src/lib/components/onboarding/LevelSlider.svelte` | new — tap-a-stop CEFR slider + changing caption |
`src/lib/components/onboarding/IntroCarousel.svelte` | new — 3 swipeable value-prop slides |
`src/lib/components/Onboarding.svelte` | modify — `STEP` map, two new steps, Continue buttons, `goal_level` in submit |
`src/routes/api/onboarding/+server.ts` | modify — accept + validate `goal_level` |
`src/routes/+layout.server.ts`, `src/routes/+layout.ts` | modify — expose `goalLevel` |
`src/routes/profile/+page.server.ts`, `src/routes/profile/+page.svelte` | modify — show/edit goal level |
| Supabase | migration — `user.goal_level` + CHECK |
`docs/onboarding-goal-screens-plan.md` | new — this plan |

## Verification

1. `npm run dev`. Reset a test account: `update public."user" set onboarding_completed = false, proficiency_level = null, goal_level = null where email = '…'` via Supabase MCP, then open `/?newSignup=true`.
2. Walk the flow: Welcome → carousel (swipe on a touch device / phone-width browser, arrow keys and dot clicks on desktop, confirm it exits after slide 3) → Dialect → Reason → **Current level**: confirm tapping each stop fills the rail up to it and swaps the caption, and that Continue is disabled until something is picked.
3. **Goal level**: confirm it opens pre-filled two stops ahead, stops below the current level are locked, and the fill runs from the current level to the goal. Go Back, pick a *higher* current level, return, and confirm the goal re-clamps instead of showing a goal below the current level.
4. Finish → confirm the scripted conversation still runs, then check the row: `select proficiency_level, goal_level, onboarding_completed from public."user" where email = '…'`.
5. Repeat and press **Skip** on the goal step → row saved with `goal_level` null and the flow still reaching the conversation.
6. Keyboard + a11y: tab to the slider, move with arrow keys, confirm `aria-checked` follows and the caption updates; confirm the locked stops are not reachable.
7. Themes and width: check light / dark / dim (the tile tokens invert) and at 375px width — the caption is the most likely thing to overflow.
8. `npm run check` and `npm run lint` clean. Run the Svelte MCP `svelte-autofixer` over both new components until it returns nothing.
9. Profile page: change level and goal, save, reload, confirm both persist.

## Not in this change

- Feeding `goal_level` into tutor/lesson/story prompts, or a "here's your path" preview screen between the goal and the conversation.
- Replacing the dot stepper with the continuous progress bar from the reference screenshots.
- Backfilling `goal_level` for the 894 existing users.
