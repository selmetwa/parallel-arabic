# Add Iraqi, Khaleeji and Saudi Arabic

## Context

Parallel Arabic teaches four varieties: Egyptian, Levantine, Darija and Fusha. We're adding three more, with full content parity at launch and no Beta label:

| Key | Display name | Variety | Speech-to-text locale |
|---|---|---|---|
| `iraqi` | Iraqi Arabic | Baghdadi (Mesopotamian) | `ar-IQ` |
| `khaleeji` | Gulf Arabic (Khaleeji) | Emirati/Kuwaiti Gulf koine | `ar-AE` |
| `saudi` | Saudi Arabic (Hijazi) | Hijazi (Jeddah/Mecca) | `ar-SA` |

The codebase is about halfway there:
- The `Dialect` type already includes `iraqi` and `khaleeji`, as do the ~20 `Record<Dialect, …>` name maps, `voice-config.ts` (placeholder voices) and a few prompt configs.
- About 130 other places hard-code the four current dialects:
  - validators, the route matcher, onboarding, games, SEO, the sitemap and pickers
  - 6 database CHECK constraints
  - all the static content folders
- No database rows exist yet for the new dialects.

**Content:** Claude hand-writes all of it, in the exact formats the `generate:*` scripts produce (per the [[claude-writes-content]] memory). It uses full tashkeel and the usual transliteration rules (3=ع, 7=ح, 2=ء; no accents). Uncertain lines are flagged for native review.

**Voices:** the user supplies the ElevenLabs voices.

**Hiding until launch:** each dialect stays out of the user-facing pickers until its content is complete. Then one final PR makes all three selectable, so users only ever see complete dialects.

Step 0: copy this plan into the repo as `docs/iraqi-khaleeji-saudi-plan.md`, per the user's preference.

---

## Phase 1: Plumbing (code only; the dialects stay hidden)

### 1.1 A single dialect registry
- **New file `src/lib/constants/dialects.ts`.** Holds the `DIALECTS` array: key, display name, short name, flag emoji, speech-to-text locale, and `selectable: boolean`.
  - It exports `ALL_DIALECTS`, `SELECTABLE_DIALECTS` and `isDialect()`.
  - The three new dialects start with `selectable: false`.
- **Add `saudi` to the `Dialect` union** in `src/lib/types/index.ts:52`, and add all three to `DialectName` (`:76`).
  - The type-checker will then error on every `Record<Dialect, …>` that lacks `saudi`. Use those errors as the checklist.
- **Point the hard-coded allowlists at the registry.** They accept `ALL_DIALECTS` so APIs and URLs work while a dialect is hidden; only the pickers filter on `selectable`.
  - `src/params/dialect.ts`
  - `src/hooks.server.ts:8` and its regex
  - `api/onboarding/+server.ts:27`, `profile/+page.server.ts:241`, `api/user-preferences/last-content/+server.ts:28`
  - `stories/+page.server.ts:14`, `history/+page.server.ts:24`
  - the zod enum and alias map in `api/import-words-csv/_helpers.ts:11,251`
  - `scripts/lib/word-dialects.ts:18`, `scripts/seed-word-of-the-day.ts:44`
- **Untyped name/flag/colour maps** (~30, e.g. `Navigation.svelte:21`, `stories/+page.server.ts:140`, `vocabulary/+page.svelte:171`, `toast-helpers.ts:410`): add the entries, and type each as `Record<Dialect, …>` while editing it so future dialects get caught by the compiler.
- **Check why two maps compile without the new keys:** `CreateLessonModal.svelte:312` and `CreateStoryModal.svelte:542`.

### 1.2 Database (the user runs the migration)
- **New file `docs/sql/add-iraqi-khaleeji-saudi.sql`.** The Supabase MCP is read-only, so the user runs this.
  - Drop and re-add the 6 CHECK constraints with the three new values:
    - `user.target_dialect` and `user.last_content_dialect`
    - `generated_lesson.dialect`
    - `structured_lesson_progress.dialect` (keep `'alphabet'`)
    - `game_progress.dialect`
    - `word_of_the_day.dialect`
  - Add the columns `word_of_the_day.example_iraqi`, `example_khaleeji` and `example_saudi`.
- **Update the Word of the Day readers:** `WordOfTheDay.svelte:34` and `+page.server.ts:49,79`.

### 1.3 Audio (the user fills in the voices)
- **`src/lib/utils/voice-config.ts`:**
  - Replace the iraqi/khaleeji placeholders and add `saudi`.
  - Add an explicit `gender` per voice. Today gender is guessed from the voice *name* (`:66-72`), which breaks once voices are IDs.
  - Voices the user needs to supply:

| Dialect | Primary voice (gender) | Second voice (gender) | Room Hunt NPC m / f |
|---|---|---|---|
| iraqi | ? | ? | ? / ? |
| khaleeji | ? (`Ghawi` today) | ? | ? / ? |
| saudi | ? | ? | ? / ? |

- **Room Hunt NPC voices:** add them to `NPC_VOICE` in `scripts/generate-room-hunt-audio.ts:47`.
- **Optional:** per-dialect pronunciation fixes in `api/text-to-speech/+server.ts:33` (`TTS_PRONUNCIATION_FIXES`), added after listening to samples.

### 1.4 Speech and pronunciation
- **`api/speech-to-text/+server.ts:24`:** add `iraqi: 'ar-IQ'` and `saudi: 'ar-SA'`; khaleeji is already there. First check that Google `chirp_3` supports those locales in the `us` region. If it doesn't, fall back to the nearest supported locale and note it.
- **`src/lib/utils/spoken-match.ts`:**
  - Add `NUMBERS` tables for the three dialects (Iraqi تنين/ثلاثة…, Gulf ثنين…, Hijazi اتنين/تلاتة…).
  - Add letter folding for sounds speech-to-text writes in the standard spelling: Iraqi/Gulf چ↔ك and گ↔ق, Gulf/Iraqi ج↔ي where it applies, Hijazi ث→ت and ذ→د.
- **`src/lib/utils/speech-spelling.ts:81`:** add respellings so the voices say the dialect forms.
- **`src/lib/constants/dialect-accents.ts`:** add an accent colour for each new dialect.

### 1.5 Generation prompts
- **`src/lib/data/dialect-rules-v2.ts`:** add `DIALECT_PHONOLOGY`, `MSA_TO_DIALECT` and `DIALECT_EXAMPLES` for all three, and add `saudi` to `DIALECT_DISPLAY_NAMES`. Every generator already reads these through `getDialectSystemInstruction()` (PR #225).
- **Story routes:**
  - Add cultural context for the three dialects in `api/create-story/+server.ts` (Baghdad/Basra, Dubai/Kuwait City, Jeddah/Mecca; local currency, food and people).
  - The cultural blocks already in `create-story-egyptian:378-397` show the format.
  - New dialects already go to `/api/create-story` (`CreateStoryModal.svelte:405`), so no routing change is needed.
- **Add the three dialects to the per-route config maps:**
  - `generate-words`, `generate-game-sentences`, `create-lesson`, `generate-sentences` (saudi only)
  - the guide in `generate-conjugations:12` and `generate-conjugation-example:11`
  - the youtube-shorts search queries
- **Compare dialects:** add the three keys to `api/compare-dialects/+server.ts:24`, the comparison schema in `gemini-schemas.ts` and `requiredKeys` in `gemini-json-parser.ts:142,243,265`.

### 1.6 Pickers and UI (in place, but filtered by `selectable`)
- **Onboarding:** `Onboarding.svelte:99`.
- **`onboarding/DialectPicker.svelte:31`:** map Iraq→iraqi; UAE/Kuwait/Qatar/Bahrain/Oman→khaleeji; Saudi Arabia→saudi. Today these countries light up as Fusha.
- **Other pickers:** profile, tutor, speak, sentences, conjugations, self-study, stories, generate-lesson, custom lessons, the review modals, video upload and `videos-new` (remove the `available:false` on khaleeji).
- **`ArabicMap.svelte`:** `:43-112` aliases khaleeji→fusha; give each new dialect its own region instead.
- **Games:** add to `GAME_DIALECTS`/`DIALECT_OPTIONS` in `src/lib/games/themes.ts:10-22`. Each theme's `categories` gets the new dialect's slugs from 2.1. Also update `learn/game/quiz/+page.server.ts` section lists.

---

## Phase 2: Content (Claude writes it, in batches, one dialect per batch)

Each set uses the existing file format and passes its existing test. Order: Iraqi → Khaleeji → Saudi within each set, so review can start early.

| # | Set | Per dialect | Where it goes | Notes |
|---|---|---|---|---|
| 2.1 | Game and vocab words | ~40–60 words for each of the 8 game themes, plus core vocab | `word` table | Delivered as a SQL/JSON seed the user runs (MCP is read-only). Category slugs follow the existing pattern. Then rebuild `words/` and `vocab/` with `build-word-pages.ts` and `build-vocab-topics.ts` |
| 2.2 | Phrases | 27 files | `src/lib/data/phrases/<dialect>/` | Add to `PHRASE_DIALECTS` (`phrase-seeds.ts:50`) |
| 2.3 | Verb conjugations | 73 verbs | `src/lib/data/verb-conjugations/<dialect>/` | Same verbs as the other dialects; add to the lists in `verb-conjugations.test.ts:6,9`. Add pronouns to `verb-blitz.ts:43` |
| 2.4 | v2 structured lessons | 80 topics (A1–B2 `baseCurriculumV2A1B2`) + assessments | Storage `<dialect>-v2/<topicId>.json` via `scripts/upload-lessons-to-storage.ts` | Follow `docs/levantine-v2-plan.md`: one pilot lesson, then batches of ~10. Register in `curriculum-v2.ts:36` last |
| 2.5 | Tutor scenarios | 10 dialogs | `src/lib/constants/tutor-scenarios.ts` | Includes `introducing-yourself`, which onboarding needs |
| 2.6 | Onboarding "try it" | 1 entry | `onboarding-try.ts:41` and its test list | |
| 2.7 | Dialect Match | `forms` for 27 sets | `src/lib/data/dialect-match/sets.json` and `dialect-match-items.ts:35` | |
| 2.8 | Room Hunt | lines for 22 scenarios, vocab and NPC genders | `room-hunt/scenarios/*.json` and `*.ts`, `room-hunt/vocab.json`, `round.ts:27` | Audio comes from `npm run generate:room-hunt-audio` once voices exist |
| 2.9 | Word of the Day | example sentences | the new `example_*` columns | Backfill the existing days, then the seed script |

At roughly 28 KB per lesson, 2.4 is the bulk of the work: about 240 lessons. Expect several sessions per dialect.

---

## Phase 3: Landing pages, SEO and marketing copy
- **Landing routes:** add `src/routes/{iraqi,khaleeji,saudi}/`, with `vocab/` and `write/` subroutes like the four existing ones.
- **Landing data:** add entries to `dialect-landing.ts:31`. `DialectLanding.svelte:22` has no fallback, so every dialect needs one.
- **`src/lib/utils/seo.ts`:** update `DIALECTS` `:18`, the names `:27-44` and `DIALECT_META` `:160`. Also the prose listing the four dialects (`:267-635`).
- **Sitemap:** the hard-coded paths in `sitemap.xml/+server.ts:78-88`.
- **Dialect comparisons:** add to `DIALECT_CONTRASTS` and comparison pairs in `dialect-comparisons.ts:25,81`; these generate `/[comparison]` pages. Prioritise iraqi-vs-khaleeji, saudi-vs-egyptian and khaleeji-vs-saudi.
- **Copy that says "Egyptian, Levantine, Darija and Fusha":** `features.ts`, `game-features.ts`, `tutor-faqs.ts:18`, `paywall/+page.svelte:7`, `about/+page.svelte`.

---

## Phase 4: Launch
- Make the three dialects `selectable: true` in `dialects.ts`, register them in `curriculum-v2.ts`, and confirm the migration and voices are live.
- One small PR, merged after the native-review pass.

### Suggested PR sequence
1. Phase 1 plumbing, with the dialects hidden; ships safely.
2. One content PR per set per dialect, or grouped per dialect.
3. Phase 3 SEO pages. These can go live only together with Phase 4, or the landing pages would advertise dialects users can't pick.
4. Phase 4 launch PR.

---

## Verification
- **Type-check:** `svelte-check` finishes with no new errors. Adding `saudi` to `Dialect` surfaces every missing map entry.
- **Tests:** `npx vitest run`. `verb-conjugations.test.ts`, `onboarding-try.test.ts`, the games tests and the phrase/word manifest tests all include the new dialects.
- **Database:** after the user runs the SQL, re-query the constraints with the read-only Supabase MCP, and test an insert path such as onboarding with `iraqi`.
- **Manual check in a local dev server, one dialect at a time, toggled `selectable` locally:**
  - the onboarding country picker → tutor chat
  - story generation (check the cultural context and that no MSA creeps in)
  - speaking practice: speech-to-text locale and number matching
  - TTS with the new voices, including two-voice conversations
  - each game, Room Hunt audio
  - one v2 lesson end to end
  - landing, `/vocab` and comparison pages, and the sitemap
- **Content:** a native speaker reviews each dialect's flagged lines before Phase 4.
- The user checks the UI visually; no browser-MCP screenshots (per the [[no-browser-mcp-verification]] memory).

---

## Phase 1 status (2026-10-23)

Done, on branch `new-dialects-plumbing`:
- `src/lib/constants/dialects.ts` is the registry. `saudi` is added to `Dialect`. The app allowlists use `isDialect()`: route matcher, hooks, onboarding, profile, last-content, stories, CSV import.
- Every name, flag and colour map has the three dialects. Pickers list them, filtered on `isSelectableDialect()`. The admin `/generate-lesson` page lists all dialects so content can be made before launch.
- `docs/sql/2026-10-23-new-dialects.sql` (6 CHECK constraints plus the `example_*` columns). **Run it before any Phase 2 data lands.**
- `voice-config.ts`: Saudi entry, explicit `gender`/`gender2`, placeholder voices marked `TODO(voices)`.
- Speech-to-text locales; spoken-match number tables and letter folding (with tests).
- `dialect-rules-v2.ts` rules, MSA word lists and examples; story cultural context; conjugation guides; per-route configs.
- Compare-dialects asks only for selectable dialects plus the learner's own.

Moved out of Phase 1:
- **Games** (`GAME_DIALECTS`, themes, verb-blitz pronouns, Dialect Match, Room Hunt) go to Phase 2. Adding a dialect there forces data into every `Record<GameDialect>`.
- **Word of the Day readers** go to Phase 2.9. Selecting the new columns before the migration runs would break the home page.
- **`ArabicMap.svelte`** goes to the launch PR. Remapping the Gulf countries changes the public `/map` page.
- **`speech-spelling.ts` respellings and TTS pronunciation fixes** wait until the real voices exist and can be heard.
- **`youtube-shorts` queries and `videos-new`** are left alone because of uncommitted local work.
- **Scripts** (`scripts/lib/word-dialects.ts`, `seed-word-of-the-day.ts`) go to Phase 2 with their data.

Launch checklist additions:
- Confirm that chirp_3 accepts `ar-IQ` as Arabic (Iraq) in the `us` region; Google's docs disagree.
- Have a native speaker review the Iraqi, Khaleeji and Saudi rule blocks in `dialect-rules-v2.ts` and the conjugation guides.
- Saudi and Fusha share the 🇸🇦 flag in several maps; pick a different Fusha marker if that's confusing.
- `spoken-match.ts` folds Egyptian گ after `normalizeArabicText`, which has already stripped it. That's an existing bug; the new dialects fold before normalizing.
