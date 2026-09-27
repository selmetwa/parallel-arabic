# Redesign /lessons to match /speak and /sentences

## Context

`/speak`, `/sentences`, the games, `/about` and `/lessons/structured` share one visual language: scoped CSS on theme tokens (`--text1/2`, `--tile1–6`, `--brand`), a large 600-weight hero title, numbered `step-head` sections, "pressable" cards with a solid bottom edge in an `--accent`/`--deep` colour pair, pill chips, a segmented control, `press` buttons, and a `pop` entrance animation. Every other page under `/lessons` still uses older utility-class Tailwind styling: native `<select>` filters, flat hover-shade cards, hardcoded badge colours (`bg-green-100 text-green-800`), `font-black` headings, and a separate glow-and-calligraphy look on the learning path. The goal is to bring every page under `/lessons` onto the same system. Behaviour, data and routes stay the same.

Decisions: **keep the winding path and restyle it**, and **include `/lessons/[id]`**.

## Approach

Follow the codebase idiom: each page owns its scoped `<style>` block, copying the token patterns from `src/routes/speak/+page.svelte` (`.hero-title`, `.step-head`/`.step-num`/`.step-tag`, `.pick` + `.is-on`, `.chip`, `.seg-wrap`/`.seg`, `.press`, `.msg-*`, `@keyframes pop`, reduced-motion guards). Reuse `src/lib/components/games/PressButton.svelte` for primary buttons. Do not introduce a shared UI library; that would be a bigger refactor than the request.

Shared rules for every page:
- Page wrapper `max-w-3xl`/`860px`, `pt-8`, `.back` link styled as on `/lessons/structured` (`← Lessons`).
- Title: `.hero-title` (clamp 2.2–3.2rem, 600, -0.035em) plus `.hero-sub`.
- Dialect accents come from one map (Egyptian amber `#f59e0b/#b45309`, Darija rose `#f43f5e/#9f1239`, Fusha violet `#8b5cf6/#6d28d9`, Levantine emerald `#10b981/#047857`), matching `/lessons/structured`. Level badges use the tokenised `.levels` pill from `GameCard.svelte` (`color-mix(accent 16%, tile3)`), not Tailwind colour classes.
- Remove `bg-*-100 text-*-800`, `font-black`, `bg-tile-400 hover:bg-tile-500` card patterns and the commented-out watermark blocks in the files touched.

## Pages

### 1. `/lessons` hub (`src/routes/lessons/+page.svelte`, `+page.server.ts`)
- Rebuild as hero plus two large pressable path cards (Structured, sky/brand accent; Custom, violet accent), in the same shape as `.foundation` on `/lessons/structured`: icon tile, title, note, a feature-pill row, and a `…-go` pill CTA. Keep the `trackEvent('lessons_path_selected')` calls.
- Add a short "What's in a lesson" row of three `.how-card`s, as on `/speak` (audio, exercises, dialect comparison). This replaces the commented-out strip.
- **Cleanup:** the page computes `userGeneratedLessons`, filters and sorts it, but never renders any of it, and `+page.server.ts` calls `getAllLessons()` on every visit just to feed that. Delete the dead state and badge helpers from the page, and drop the lessons query from the load (keep `session`, `isSubscribed`, `user`). This speeds up the hub. (Checked: `/lessons/custom` has its own load for this data, so nothing depends on the hub's.)

### 2. `/lessons/structured` (`src/routes/lessons/structured/+page.svelte`)
Already on the new system. Only align it: change the `.hero p` copy "Designed by professionals." to a real line such as "A step-by-step path from A1 in your dialect." Keep everything else.

### 3. Learning path (`src/routes/lessons/structured/[dialect]/+page.svelte`)
Keep the layout maths (`STEP_HEIGHT`, `lessonPositions`, `segments`, `goal`), the players (`LessonPlayer` / `LessonPlayerV2`), the auth and paywall flow, and the auto-open logic. Restyle only:
- Remove the fixed "atmosphere" layer (radial glow and the six drifting letters) and the `bg-tile-100` override, so the page sits on the standard background like `/speak`.
- Header: `.back` link, `.hero-title` with the dialect name, and the Arabic glyph as a small accent-coloured kicker instead of a 5xl brand glyph. The progress bar is restyled to the tile track plus accent fill from the `/speak` loading bar, with an accent colour per dialect.
- Nodes: turn the round buttons into pressable discs with `border: 2px solid var(--tile5)`, `box-shadow: 0 6px 0 var(--deep)`, hover lift and active press, using the `.pick` transitions. States:
  - completed: accent fill with a white check
  - active: accent ring plus a gentle `pop` on mount
  - locked: `--tile4` fill with `--text2` lock and no lift
  
  This replaces the `nodeClasses()` Tailwind strings with `class:` state classes in scoped CSS.
- Trail: keep the SVG. Map strokes to tokens: groove `var(--tile4)`, done `var(--accent)`, next the accent dashed flow, ahead `var(--tile5)`.
- Module dividers and tooltips: tooltip becomes a `--tile3` card with a 2px `--tile5` border and a 1.1rem radius, and the module label becomes a `.step-tag`-style pill.
- Goal node: a pressable disc in the amber accent pair instead of the gradient and custom shadow. Keep 🏆 and "Fluency".
- Keep the `rise`/`flow` animations and their reduced-motion guard.

### 4. Custom lessons list (`src/routes/lessons/custom/+page.svelte`)
- Header: `.back`, `.hero-title` "Custom lessons", `.hero-sub`.
- **Step 1, "Create a lesson":** dialect `.pick` cards (a 2×2 grid with flags, the same accents as `/speak`) replacing the `<select>`, followed by the existing `CreateLessonModal` trigger. Restyle the trigger button inside `CreateLessonModal.svelte` as a `.press`. That is its only change.
- **Step 2, "Browse lessons":**
  - The All / My private toggle becomes the `/speak` `.seg-wrap` segmented control. Keep the `trackEvent` calls.
  - Filters: a search input restyled to tile tokens (2px `--tile5` border, 1rem radius), then chip rows for Dialect and Level (the `.chip.is-on` pattern), and a small sort `.seg` or chip row replacing the three selects. Keep the `trackEvent` calls on change.
  - The results count stays as a small `--text2` line.
- Lesson cards become pressable cards in the lesson's dialect accent: dialect pill, level pill, title (2-line clamp), and a meta row (📄 sub-lessons, ⏱ minutes) above a hairline. Keep `handleLessonClick` auth gating.
- The three empty states use `/speak`'s `.msg-emoji`/`.msg-title`/`.msg-body` inside a dashed `--tile5` card.

### 5. Single custom lesson (`src/routes/lessons/[id]/+page.svelte`)
**Changed during implementation.** All 39 stored custom lessons turned out to be step-based and open straight in `LessonPlayer`, and `/api/create-lesson` only generates that format, so the page's sub-lesson layout never rendered. Instead of restyling it, it was deleted (agreed with the user), along with the components only it used: `InteractiveExercise`, `ReviewCarousel` and `PronunciationTestModal`. The page renders the player once mounted, "Loading lesson…" before that, and a `/speak`-style message when the lesson is missing.

## Order
1. Hub (+ load cleanup) → 2. `/lessons/structured` copy → 3. Custom list (+ modal trigger) → 4. Path → 5. `[id]` page. Commit after each page so each can be reviewed or reverted on its own.

## Verification
- `svelte-autofixer` on every changed `.svelte` file until clean, and `npm run check` with no new errors in `src/routes/lessons/**` or `CreateLessonModal.svelte`.
- `npx vitest run src/lib` still passes (regression check; no existing test covers these pages).
- `curl` each route on the dev server for a 200 and a sanity check that the markup renders (`/lessons`, `/lessons/structured`, `/lessons/structured/egyptian-arabic`, `/lessons/custom`, and one `/lessons/<id>` from the custom list).
- Per the project memory, don't take browser screenshots. You check it visually in light, dim and dark themes and at phone width. Check in particular: path nodes locked/active/completed, lesson auto-open, the auth modal on custom lesson click when signed out, private-lessons toggle, filters and sort.
- After approval, copy this plan to `docs/lessons-redesign-plan.md`, per the project convention.
