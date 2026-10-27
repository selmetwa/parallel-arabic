# Plan: Address Zoë's feedback (grammar, dialect switcher, dictionary, conjugations, lesson bugs)

## Context
Zoë is an Egyptian learner on iOS (the Capacitor shell around the live site, so web fixes ship without an app release). She reported:
1. No grammar explanations in lessons and no grammar reference.
2. The conjugation reference is hidden and its terms are unexplained (Form III, hollow…).
3. Every section asks her to choose a dialect, even though she learns only one.
4. There is no dictionary.
5. Two lesson bugs.

The goal is to fix all of it. Decisions already made:
- **Dialect:** the chosen dialect is the default everywhere, with an override on each page. All 7 dialects can be selected.
- **Dictionary:** search the existing `word` table. When an entry is first opened, fill in its details lazily and cache them.
- **Grammar content:** I write it by hand for Egyptian, Levantine, Fusha and Darija. Articles share one topic list, with a separate body per dialect.
- **Lesson notes:** keyed by topic, stored in the repo, and only for topics that teach grammar.
- **Verbs:** about 200 per dialect, with a structured `form` field and explanations of the terms.

Step 0: copy this plan to `docs/plans/zoe-feedback.md` (repo convention).

Ship as separate PRs in this order. Each phase stands on its own. Nothing is gated behind a feature flag: each phase goes live to everyone when it merges. Sherif will write the reply to Zoë himself.

---

## Phase 1: Lesson bugs (small PR)

**Bug A: the overlay doesn't cover the screen and the tree behind it scrolls.** File: `src/lib/components/LessonPlayerV2.svelte`, `.overlay` at around lines 334–345.
- Copy the scroll-lock pattern from `src/lib/components/games/RoomHunt.svelte:182-188`. In an `$effect`, set `document.body.style.overflow='hidden'` and `documentElement.style.overscrollBehavior='none'`, and restore both on cleanup.
- On `.body`, add `overscroll-behavior: contain`.
- On the overlay, add `height: 100dvh` and padding of `env(safe-area-inset-top/bottom)`.
- Add `viewport-fit=cover` to the viewport meta in `src/app.html:27`. Then check the other fixed headers still sit correctly, because `contentInset: 'automatic'` already insets the web view in the iOS app.
- Apply the same lock to the legacy `LessonPlayer.svelte` (line 685, used by Darija).

**Bug B: the word definition shows raw JSON and runs off the page.** File: `LessonPlayerV2.svelte`, word modal at lines 305–327 and CSS at 726–778.
- Replace the inline `.word-modal` with the existing `src/lib/components/dialect-shared/sentences/DefinitionModal.svelte`. It already strips code fences, parses the JSON and renders the fields, and the legacy player and stories use it.
- `Modal.svelte` already caps the height at 90% and scrolls. Add `overflow-wrap:anywhere` if long strings still overflow.

Verify: on an iPhone-sized viewport (the user checks visually), confirm the tree doesn't scroll during a lesson and that tapping a word in a reading step shows the parsed definition inside the screen.

---

## Phase 2: Shared dialect module and header switcher

**One source of truth.** New file: `src/lib/constants/dialects.ts`.
- `DIALECTS: {value, label, flag, shortLabel, hasStructuredPath, hasConjugations, hasGrammar}[]` for all 7 dialects: `egyptian-arabic, levantine, darija, fusha, iraqi, khaleeji, saudi`.
- Helpers: `isDialect()` and `dialectLabel()`.
- Add `saudi` to the `Dialect` type in `src/lib/types/index.ts`.
- Have these use it, removing their local maps:
  - `src/params/dialect.ts`, which stays limited to content routes: it accepts the 4 dialects that have pages. The `/grammar` and `/dictionary` routes use their own matcher that covers all 7.
  - `src/lib/games/themes.ts` (`DIALECT_OPTIONS`)
  - The flag and name maps in `Navigation.svelte`, `profile/+page.svelte` and `lessons/structured/+page.svelte`
- Widen the validation in `api/onboarding/+server.ts`, `profile/+page.server.ts` (`updateTargetDialect`) and `onboarding/DialectPicker.svelte` to all 7.

**Switcher**
- New component `src/lib/components/DialectSwitcher.svelte`: a popover listing the 7 flags.
- Selecting a dialect POSTs to a new `src/routes/api/user-preferences/dialect/+server.ts`, which updates `target_dialect` (anonymous users: localStorage), then calls `invalidateAll()`.
- Mount it in `Navigation.svelte`, replacing the static flag and "Learning X". Also mount it at the top of `Sidebar.svelte` so desktop has it too; desktop currently shows no flag.

**Default plus override on each page.** Rule: the initial dialect is the URL `?dialect=` if present, otherwise `targetDialect`. Pickers shrink to a small "Dialect: 🇪🇬 Egyptian · change" control.
- New component `src/lib/components/DialectOverride.svelte` holds that control. Reuse `initialDialect()` from `themes.ts`, moved into `dialects.ts`.
- Pages to change:
  - `/lessons/custom`: remove the hard-coded `'egyptian-arabic'`
  - `/stories`: the filter defaults to the user's dialect instead of `'all'`
  - `/conjugations`, `/sentences`, `/speak`, `/tutor`, `/learn/game` (drop the separate `pa-game-dialect` localStorage in favour of the profile), `/self-study`, `/vocabulary` (stop hard-coding the server filter), `/anki-decks`, `/generate-lesson`, `/videos`
  - The review modals in `src/lib/components/review/*Modal.svelte`

**Lessons go straight to the user's dialect**
- In the Sidebar and MobileMenu, link "Lessons" to `/lessons/structured/{targetDialect}`. The `/lessons/structured` dialect picker stays reachable from the switcher.
- `last_content_*` holds only one last lesson. Add a `lastLessonByDialect` lookup that reads the most recent `structured_lesson_progress` row for each dialect. The tree page then auto-opens at the right topic after a switch, and the home "Continue" card in `routes/+page.server.ts` (~206-226) respects the active dialect.
- Iraqi, Khaleeji and Saudi have no structured path or conjugations. Sections that check `hasStructuredPath` and similar flags show a "Coming soon for {dialect}" state with links to what does exist (stories, word lists, phrases).

**Peek at another dialect:** keep the existing `otherDialects` blocks on word pages and the conjugation cross-links. Nothing new is needed.

---

## Phase 3: Navigation changes
In `Sidebar.svelte` and `MobileMenu.svelte`, whose duplicated `navSections` arrays I'll extract into `src/lib/constants/nav.ts`:
- **Learn:** Alphabet, Lessons, **Grammar** (new), **Dictionary** (new), **Verb Tables** (`/{dialect}/conjugations`), **Word Lists** (`/egyptian-arabic/vocabulary`; for other dialects, Dictionary filtered by category), Vocab Review
- **Practice:** as today. Rename "Conjugations" to "Conjugation Drill" so it isn't confused with Verb Tables.

Remove the dead `'Explore'` and `'Resources'` entries from `expandedSections`. Footer links stay as they are.

---

## Phase 4: Grammar reference

**Content** (written by me), in `src/lib/data/grammar/`:
- `topics.ts` holds the shared list: `{slug, title, level, summary, related: slug[]}`.
- `{dialect}/{slug}.md` holds the body for each of the 4 dialects. Each body is markdown with Arabic examples in a fenced block format (`ar | translit | en` rows) that renders as example cards.
- Transliteration follows the rules in the existing `dialect-rules-v2.ts`.
- Initial topics, about 18:
  1. Pronouns
  2. Demonstratives
  3. Noun gender
  4. Plurals (sound and broken)
  5. Dual
  6. Possessive suffixes and their other uses (object, preposition)
  7. iḍāfa (possession)
  8. Adjective agreement
  9. Numbers 1–10
  10. Numbers 11+ and counted nouns (3–10 take a plural, 11+ take a singular; this answers Zoë's exact question)
  11. Present tense and the b- prefix
  12. Past tense
  13. Future
  14. Negation
  15. Imperative
  16. Verb roots and patterns: Forms I–X
  17. Verb classes: sound, hollow, defective, doubled, hamzated
  18. Question words
  19. Conditional
  20. Comparatives
- Loader: `src/lib/data/grammar/manifest.ts`, using `import.meta.glob` (the same pattern as `src/lib/data/vocab/manifest.ts`). Render with the markdown already in the repo, or add `marked` if there isn't one.

**Routes**
- `src/routes/grammar/+page.svelte`: redirects to `/grammar/{targetDialect}`.
- `src/routes/grammar/[dialect]/+page.svelte`: the topic index, grouped by level.
- `src/routes/grammar/[dialect]/[slug]/+page.svelte`: the article. It has a "Compare dialects" toggle that shows the same section from another dialect's file, plus related links. Prerendered, SEO-friendly.
- Iraqi, Khaleeji and Saudi get the "coming soon" state.

---

## Phase 5: Grammar notes inside lessons

**Data**
- `src/lib/data/grammar/lesson-notes.ts` is a map from `topicId` (v2 `eg-a1-u06`, base topic ids, legacy `m*-t*` for Darija) to `{dialect: {title, bullets: string[], examples[], articleSlug}}`.
- Notes are written only for grammar-bearing topics: pronouns, demonstratives, numbers, plural, tenses, imperative, question words, conditional, preferences, wishes, and certainty.
- Vocab topics get a `articleSlug`-only link where one is relevant.

**UI** in `LessonPlayerV2.svelte` and `LessonPlayer.svelte`:
- If a note exists, show it as a "Grammar" intro card before step 1. It's dismissible and marked as seen.
- Add a header button (📖 "Grammar") that opens a bottom sheet with the same note and a link to the full article, which opens in a new view without leaving the lesson.
- The lesson-tree node also shows a small "grammar" chip.

**Custom lessons:** in `CreateLessonModal.svelte`, link the `learningTopicOptions` chips to the matching grammar articles, and add a "Practise this" button on each article that pre-fills the custom-lesson modal. That brings together the scattered grammar that Zoë mentioned.

---

## Phase 6: Dictionary

**Database** (handed over as `docs/sql/word_details.sql`; the Supabase MCP is read-only):
```sql
create table word_details (
  word_id uuid primary key references word(id) on delete cascade,
  pos text, gender text, plural_arabic text, plural_translit text,
  root text, verb_present text, conjugation_slug text,
  examples jsonb not null default '[]', created_at timestamptz default now()
);
create index word_search_idx on word using gin (... trigram on arabic_word, english_word, transliterated_word);
```
The index needs `pg_trgm`. Include `create extension if not exists pg_trgm`.

**Endpoints**
- `src/routes/api/dictionary/search/+server.ts` (GET `q`, `dialect`, `limit`):
  - Runs an `ilike`/trigram search across Arabic (also with the diacritics stripped), English and transliteration.
  - Ranks exact matches first, then by `frequency`.
  - Deduplicates by Arabic within the same dialect.
- `src/routes/api/dictionary/[id]/+server.ts`:
  - Returns `word` joined to `word_details`.
  - On a cache miss it calls Gemini with a small schema (`pos, gender, plural, root, presentForm, examples[2]`) and stores the result.
  - Uses `config:` rather than `generationConfig`, per the known bug, and keeps the schema flat, because a complex schema returns a 400.
  - Takes example sentences from the `src/lib/data/words/{dialect}` story examples where they exist, and only asks Gemini for the missing ones.
  - Links `conjugation_slug` when a verb matches the verb tables.

**Pages**
- `src/routes/dictionary/+page.svelte`: redirects to `/dictionary/{targetDialect}`.
- `src/routes/dictionary/[dialect]/+page.svelte`: a search box with debounced results (Arabic, translit, English, POS chip) and a category filter. The category filter also replaces the hidden word lists for non-Egyptian dialects.
- `src/routes/dictionary/[dialect]/[id]/+page.svelte` shows:
  - The word with audio (`audio_url`)
  - The English meaning
  - Gender and plural for nouns
  - The root, with a link to `daily-root/roots.json` where it matches, and a link to the verb table for verbs
  - Examples
  - The `SaveButton` (`className=""`)
  - "In other dialects", from `otherDialects`
- Copy avoids the word "AI".

---

## Phase 7: Verb tables, explanations and expansion

**Discoverability:** handled by the sidebar "Verb Tables" item in Phase 3, plus a persistent breadcrumb and back link in `src/routes/[dialect=dialect]/conjugations/[verb]/+page.svelte`.

**Structured form**
- Add `form: 'I'..'X'` to `VerbConjugationData` in `src/lib/types/index.ts:118`.
- Backfill it into all existing JSON files with a one-off script that parses the "Form X" text in `notes` and checks the result by hand. Default to I.

**Explanations**
- New `VerbGlossary.svelte`: a collapsible "What do these mean?" panel at the top of the index, with one paragraph per form and per class.
- Tapping a form or class badge on a verb page opens a popover with the same text and a link to grammar articles 16 and 17.

**Expansion to about 200 per dialect**
- Build the verb list from the Egyptian `verbs.json` vocab topic (412 entries, ranked by frequency) and match it across dialects.
- Run `npm run generate:conjugations` in batches. Before running, check that the script uses `config:` rather than `generationConfig`.
- Spot-check the output and regenerate `index.json`.
- Link dictionary verbs to their tables through `conjugation_slug`.

---

## Verification
- Run `npm run check` and `npm run lint` after each phase. Run the svelte-autofixer on every new or changed `.svelte` file.
- **Phase 1:** the user checks visually on iOS (no browser-MCP screenshots).
- **Phase 2:**
  - Switch dialect in the header, then visit Lessons, Stories, Conjugation Drill, Sentences, Game and Vocabulary. Each should default to the new dialect, and the override should still work.
  - Iraqi should show the "coming soon" states.
  - Confirm `target_dialect` changed with a read-only `execute_sql`.
- **Phase 4/5:** `npm run build` prerenders every grammar route. Open lessons eg-a1-u06 (numbers) and m*-t* (Darija) and confirm the intro card and the 📖 sheet appear.
- **Phase 6:** after the user runs the SQL, search "apple", "تفاح" and "tuffaḥ". Open an entry twice: the second load should come from the cache with no Gemini call, which shows in the server logs.
- **Phase 7:** 128 new verbs per dialect (`scripts/verb-conjugations/new-verbs.ts`), bringing each dialect to 200.
  - About 640 tables came from `generate-more.ts` (Gemini, using each dialect's existing tables as a style reference) before the project hit its spend cap.
  - The remaining 250 were written by hand in `content/verbs/batch2/<dialect>.txt` and expanded by `write-tables.ts`, which applies each dialect's regular negation, present and future markers. Use this path for future content, so bulk generation doesn't consume the production Gemini key.
  - English glosses and the file shape come from `engine.ts`.
  - Verb forms live in `forms.json`. Run `generate-more.ts --merge-forms` after adding tables.
  - The hand-built pipelines keep these tables in `index.json`.
