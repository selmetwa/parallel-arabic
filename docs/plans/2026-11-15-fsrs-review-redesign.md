# FSRS + "Calm study desk" redesign of spaced repetition

## Context
Review today runs on a home-made SM-2 variant (`src/lib/helpers/spaced-repetition.ts`). It has three buttons with a reversed scale (1 = Easy, 3 = Hard) and a separate "Forgot" flow. It is also broken in practice:
- `is_learning` stays true until the interval reaches 30 days, and every due query ORs `is_learning`. Live DB: all 25,726 saved words are `is_learning`, 3,107 have been reviewed, and the max interval is 20 days. Result: every reviewed word is due every session.
- `mastery_level` is never written.
- `daily_review_limit` is ignored (hard-coded 20).
- The graduation modal shows the wrong intervals.

The user wants:
1. The algorithm replaced with **`@squeakyrobot/fsrs`** (FSRS v4.5, ratings 1–4 Again/Hard/Good/Easy).
2. **Every SRS screen** redesigned with the design skill in a **"calm study desk"** direction.
3. **Existing review history converted**, not reset.

**Package caveat:** the minimum interval is 1 day, so there are no same-day learning steps. When a card is rated **Again**, the API saves "due tomorrow" and the session also puts the card back 3–5 cards later for practice only (no second FSRS write). The user approved this.

Step 0 of implementation: copy this plan to `docs/plans/2026-11-15-fsrs-review-redesign.md`.

## 1. Database (user runs SQL; Supabase MCP is read-only)
Create `docs/sql/2026-11-15-fsrs.sql`. It is additive, so run it **before** deploying.

```sql
alter table saved_word
  add column fsrs_stability real,
  add column fsrs_difficulty real,
  add column fsrs_state smallint not null default 0,   -- 0 New 1 Learning 2 Review 3 Relearning
  add column lapses integer not null default 0;
alter table word_review
  add column rating smallint check (rating between 1 and 4),
  add column fsrs_stability real,
  add column fsrs_difficulty real,
  add column fsrs_state smallint,
  alter column difficulty drop not null,
  drop constraint word_review_difficulty_check;
-- backfill reviewed words: interval -> stability, ease 1.3..2.5 -> difficulty 8..4
update saved_word set
  fsrs_state = 2,
  fsrs_stability = greatest(interval_days, 1),
  fsrs_difficulty = least(10, greatest(1, 8 - (coalesce(ease_factor,2.5) - 1.3) * (4 / 1.2))),
  next_review_date = coalesce(next_review_date, (extract(epoch from now())*1000)::bigint)
where repetitions > 0;
```

- Insert paths (`save-word`, `import-words`, etc.) need no change; the new column defaults make words New.
- Legacy columns `ease_factor`, `interval_days` and `forgotten_in_session` are kept but no longer drive scheduling.
- `interval_days`, `repetitions` and `is_learning` are still written, because profile, tutor-memory and all-words read them.

## 2. Algorithm layer
- `npm i @squeakyrobot/fsrs`.
- New `src/lib/srs/fsrs.ts` (shared, so the client can preview intervals). It replaces `src/lib/helpers/spaced-repetition.ts`, which gets deleted.
  - A single `const fsrs = new FSRS({ enable_fuzz: false, request_retention: 0.9 })`. Fuzz is off so the button previews match what actually gets saved.
  - `rowToCard(row)` maps the DB to a `Card`: epoch ms → Date, `fsrs_state`, stability/difficulty, `repetitions` → reps, `lapses`, `interval_days` → scheduled_days.
  - `cardToRow(card)` maps back:
    - `next_review_date`, `last_review_date`, `fsrs_*`, `lapses`
    - `repetitions = reps`, `interval_days = scheduled_days`
    - `is_learning = stability < 21`, which is the "Learning vs Mastered" boundary used everywhere
    - `mastery_level` 0–5 bucketed from stability: new / <1d / <7 / <21 / <90 / ≥90
  - `previewIntervals(card, now)` returns `{1..4: days}` via `fsrs.repeat`.
  - `retrievability(card, now)`.
  - `formatInterval(days)` returns "1d", "3d", "2w", "4mo", "1.2y".
- New `src/lib/srs/fsrs.test.ts` (vitest). It covers:
  - Row ⇄ Card round-trip.
  - A New card rated Good gets scheduled ≥1 day out.
  - Again increments lapses and sets Relearning.
  - Previews satisfy Again ≤ Hard ≤ Good ≤ Easy.
  - Mastery buckets.
  - The SQL backfill mapping, mirrored as `legacyToCard()` and used by the tests only if it's needed in code. Otherwise this check is skipped.

## 3. Due query: one helper, one meaning
- New `src/lib/server/srs-due.ts` with `dueFilter(nowMs)`, which returns `next_review_date.is.null,next_review_date.lte.${now}`. No `is_learning`.
- Use it in all 5 copies:
  - `api/review-words`
  - `review/+page.server.ts`
  - `routes/+page.server.ts`
  - `lib/server/push-reminders.ts`
  - `api/review-words-list`
- Also update the status logic in `api/review-words-all` (L58-75): new / learning / due / scheduled / mastered from state, stability and due date.

## 4. API
- **`api/review-words` GET**
  - Order: due review cards first (`fsrs_state != 0`, by `next_review_date` asc), then New cards (by `created_at`).
  - Limit: `user.daily_review_limit` (default 20).
  - Return the FSRS fields (`stability`, `difficulty`, `state`, `lapses`, `reps`, `lastReviewDate`, `nextReviewDate`) so the client can preview intervals.
  - Add `counts: { due, new }` for the header.
  - Drop the `forgottenWords` query.
- **`api/review-word` POST**
  - Body becomes `{ saved_word_id, rating: 1|2|3|4 }`. Validate it.
  - Load the row → `rowToCard` → `fsrs.scheduleWithGrade` → `cardToRow` → update.
  - Insert a `word_review` row with `rating`, the `fsrs_*` snapshot, `interval_days` and `repetitions`. Also fill `dialect`, which was never written before.
  - Paywall logic stays as is.
- Delete `api/mark-word-forgotten` and `api/clear-forgotten-words`. Only the old Forgot flow uses them; check with grep before deleting.

## 5. Design: "calm study desk"
**Concept:** a quiet writing desk at night. The Arabic word is the only loud thing on screen, set like calligraphy on paper. Everything else is hushed, with plenty of space, and nothing appears until it's needed.

**Theme:**
- Built only on the existing tokens (`tile-*`, `text-*`, `brand`, `--green1`, `--red1`), so light, dark and dim all work.
- New CSS vars in `app.css`: `--srs-again` (from `--red1`), `--srs-hard` (amber, hsl at brand saturation), `--srs-good` (`--brand`), `--srs-easy` (`--green1`). Each theme defines its own values.

**Type:**
- Add **Amiri** (Google Fonts, in `app.html` next to Rakkas) for the hero Arabic. It's a naskh face that handles tashkeel well.
- Add a `font-arabic-display` Tailwind family.
- Latin UI text stays ReadexPro.
- Small-caps letter-spaced labels for metadata (dialect, "NEW", "AGAIN").

**Texture:**
- Very faint ruled-paper lines on the card (`repeating-linear-gradient` with `--tile5` at low alpha).
- A hairline border and a long soft shadow.
- No emojis in the session UI. Use inline SVG icons instead.

### 5a. Session `src/routes/review/+page.svelte` (rewrite the session state)
- **State:** one `queue: ReviewWord[]` plus `index`. On **Again**, splice the card back in at `index + 4` (or at the end if that's past it), flagged `practice: true`.
  - For a practice card, rating it Good or Easy just advances, without POSTing. Again requeues it once more.
  - Hard counts as passing too.
  - Drop the forgotten-words arrays and branches.
  - Keep the localStorage resume, simplified to `{ queueIds, index, stats }` and reconciled against the loaded words.
- **Header:**
  - A small-caps line: `14 due · 3 new · 2 again`.
  - A 2px progress hairline in brand along the top of the card column, replacing the chunky gradient bar.
  - A "?" opens a rewritten **"How scheduling works"** modal using the shared `Modal`. It explains Again/Hard/Good/Easy, memory strength and "~90% recall target" without promising fixed intervals.
- **Keyboard:**
  - `Space`/`Enter` reveals, `1–4` rates, `R` replays audio.
  - The handler ignores keystrokes while a modal is open or an input has focus.
  - Faint key hints sit on the buttons and are hidden on touch devices (`@media (hover: hover)`).
- **Done screen:**
  - "Desk cleared." A summary row: reviewed, % recalled (not Again), new learned.
  - A 7-day **due forecast** as small inline-SVG bars. It comes from a new `forecast` field in the `review-words` response (counts of `next_review_date` per day for the next 7 days).
  - Then a quiet row of the three add-material actions: Generate words, Generate sentences, Import.
  - The empty-deck state uses the same layout with different copy.
- **During the session**, the add-material row moves into a quiet footer link ("Add words"), so it doesn't compete with the card.
- **Paywall box:** restyle it to the desk palette using the existing `SubscribeButton`, replacing the yellow-50 block.

### 5b. Card `src/routes/review/components/ReviewCard.svelte`
- **Front:**
  - Small-caps dialect at top left. A state chip at top right: NEW, AGAIN, or a retrievability dot.
  - The Arabic word large (`clamp(3rem, 10vw, 6rem)`) in Amiri, keeping the drag-to-define behavior.
  - A quiet icon row: Listen, Hint, Stats.
  - A full-width "Show answer" (Space).
- **Reveal:**
  - Replace the 3D flip with a vertical unfold: a divider draws in, then transliteration and English rise 8px and fade in. It respects `prefers-reduced-motion`.
  - Compare Dialects becomes a text link.
- **Rating bar:**
  - Four equal buttons: Again / Hard / Good / Easy. Each shows its next interval underneath, from `previewIntervals`.
  - A 3px top accent in its `--srs-*` color on a tile background, which fills on hover or press. Not full traffic-light blocks.
  - Mobile: 4 columns at 44px+ height.
- Remove the "Forgot – Review Again" button and the "Your Progress" panel; stats live in the modal.
- Props: `onRate(rating: 1|2|3|4)` and `previews`.

### 5c. Stats modal `WordStatsModal.svelte`
- A **memory curve**: an inline-SVG retrievability decay `R(t)` from the last review to 2× the interval, with a "today" marker and a 90% line.
- Below it, a 2×3 grid: Memory strength (stability, e.g. "12 days"), Difficulty (1–10 shown as a 10-tick bar), Recall now (R%), Reviews, Lapses, Next due.

### 5d. My words `src/routes/review/all-words/+page.svelte`
- **Rows:** Arabic in Amiri, English and transliteration muted, a **memory-strength bar** (5 segments = mastery_level) and a due label ("today", "in 3d", "new").
- **Filters:** chips for New / Learning / Due / Mastered; the counts come from the API status.
- **Sort:** recently added / weakest first (stability asc) / next due.
- Keep search and delete. Same desk styling.

### 5e. Profile `src/routes/profile/components/ReviewWordsStats.svelte` (+ `profile/+page.server.ts` L120-135)
- Tiles: Total / Due now / Learning / Mastered (stability ≥ 21).
- Replace the mastery bar with a 5-segment strength distribution, using the same segment component as My words.
- Keep the dialect breakdown and restyle it.
- The due count uses `dueFilter`.

### Shared pieces (only what's reused 2+ times)
- `src/lib/components/review/StrengthBar.svelte`: 5 segments; used in My words, the profile and the stats modal.
- `src/lib/components/review/DueForecast.svelte`: done screen and profile.

## 6. Other cleanups that follow from the change
- `src/lib/utils/tutor-memory.ts` L274-304 now gets real `mastery_level` values. Check its thresholds against the 0–5 buckets.
- The `review_word_answered` analytics event sends `rating` and `correct: rating > 1`.
- Remove the unused `getWordsDueForReview` and `getNewWords`; they're deleted along with the helper file.

## Execution order
1. Copy the plan to docs and write `docs/sql/2026-11-15-fsrs.sql`. Tell the user to run it.
2. Install the package and write `src/lib/srs/fsrs.ts` with tests → `npm run test:unit` passes.
3. `srs-due.ts` and the API changes → `npm run check` shows no new errors.
4. UI for 5a–5e. Run every `.svelte` file through the svelte-autofixer until it's clean. On new `SaveButton` call sites pass `className=""` (memory note).
5. Delete the dead forgot endpoints and the old helper → grep shows no references → `npm run check` and `npm run build`.

## Verification
- `npm run test:unit`: the fsrs tests pass and the existing daily-goal, push-plan and retention-email tests still pass.
- `npm run check` and `npm run build`: no new errors compared with the baseline taken before starting.
- **After the SQL runs**, using a read-only MCP query: reviewed rows have `fsrs_state = 2` and non-null stability. The due count per user drops from "every reviewed word" to the ones actually due.
- **Manual (user verifies visually, per the no-browser-screenshot memory):** on `/review`, in light, dark and dim:
  - Reveal with Space and rate with 1–4.
  - Again brings the card back about 4 cards later, and only one `word_review` row is written.
  - The button intervals match `next_review_date` in the DB afterwards.
  - The done screen shows the forecast.
  - My words shows strength bars and the "weakest first" sort works.
  - The stats modal shows the curve.
  - The profile card shows the new tiles.
  - The free-tier paywall still triggers at 5 reviews.
