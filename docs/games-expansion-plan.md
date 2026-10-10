# Games expansion: 9 new games, 4 new scenarios, a feature page for every game

## Context
The games are getting a lot of traffic, so we're adding more and giving each one an SEO landing page. Today there are 7 games (word scramble, odd one out, spot the mistake, sentence scramble, quiz, Room Hunt, Scenarios). Each has a `/learn/game/<slug>` page built from `GAMES` in `src/lib/constants/games.ts`. Room Hunt is the only one that also has a `/features/...` landing page.

Outcome:
- 9 new games.
- 4 new Scenarios scenes.
- A `/features/<slug>` landing page for every game, new and existing (15 pages), each aimed at a different search from its game page.

**Decisions (locked with the user)**
- Verb Blitz ships in all 4 dialects. The Levantine, Darija and Fusha conjugation files get written first.
- New scenes: doctor's visit, airport & passport, asking for directions, coffee shop / bakery.
- Feature pages for the new games **and** the existing ones (word scramble, odd one out, spot the mistake, sentence scramble, quiz, Scenarios).
- One branch, everything shipped together. There's one commit per game inside it so the PR can be reviewed piece by piece.
- On approval, copy this plan to `docs/games-expansion-plan.md` (repo convention).

**Content rule** (memory: claude-writes-content): Claude writes all the Arabic: conjugations, roots, scenario lines, extra dialect-match sets.
- Use the same JSON shapes as the existing files.
- Full tashkeel.
- Transliteration uses 3/7/2/gh/kh/sh, with no accents.
- Spoken dialect, not MSA, except in Fusha.
- Flag uncertain lines, especially Darija, for native review.

**Copy rule** (memory: ai-copy-branding): no "AI" in user-facing copy except "AI Tutor".

---

## Already in place (reuse, don't rebuild)
| Need | Existing piece |
|---|---|
| Hub card, sitemap, page meta, FAQ markup, breadcrumb | Add a `GameInfo` to `GAMES` (`src/lib/constants/games.ts`). `sitemap.xml/+server.ts`, `seo.ts` `gamePageMeta` and `/learn/game/+page.svelte` all read it. |
| Feature landing page, sitemap, meta | Add a `FeatureInfo` to `FEATURES` (`src/lib/constants/features.ts`), served by `src/routes/features/[slug]`. The `learn-arabic-by-playing` page lists every `GAMES` entry automatically. |
| Word games (client-side rounds) | `WordGamePage.svelte` (dialect/theme picker, word pool after mount, round gate, fullscreen) + `fetchWordPool` (`src/lib/games/fetch-word-pool.ts`) → `GameWord {arabic, plain, english, transliteration, audioUrl}` |
| Generated games (server rounds) | `GeneratedGamePage.svelte` + `generateValidated` / `parseGameRequest` / `LEVEL_GUIDE` / `gameErrorResponse` (`src/lib/server/games/generate.ts`) + `checkGameAccess` (`access.ts`). Pattern: `api/games/spot-the-mistake`. |
| Free rounds | `createRoundGate` / `FREE_ROUNDS = 2` (`src/lib/games/free-rounds*.ts`); the server has the final say for generated games. |
| XP | `awardGameXp()` (`src/lib/games/game-xp.ts`) |
| Speaking | `SpeakAnswer.svelte`; `transcribe`, `scorePronunciation`, `PASS_THRESHOLD` (`src/lib/utils/pronunciation.ts`) |
| Typing Arabic | `letterKey` / `keysForTyped` (`src/lib/games/arabic-letters.ts`), the Word Scramble keyboard UI, `normalizeArabicTextLight` |
| Dialect data | Phrasebook: `getPhrase` / `phraseSlugsFor` (`src/lib/data/phrases/manifest.ts`), `PHRASE_SEEDS`, about 26 phrases × 4 dialects. Room Hunt `vocab.json` and scenario JSON (recorded audio per dialect). |
| Letters | `letters` (`src/lib/constants/alphabet.ts`): isolated/start/middle/end |
| Verbs | `src/lib/data/verb-conjugations/egyptian-arabic/*.json` (75 verbs, past/present/future, `rootLetters`) |
| Scenarios | `src/lib/games/room-hunt/scenarios/*` (`Scenario` + `Stage`, `SCENARIOS` registry), `npm run generate:room-hunt-audio` |
| Screenshots | `scripts/capture-feature-screenshots.ts` → `static/images/feature-pages/*.webp` |

**Licensing rule:** `word` table content is fetched after mount and never rendered into the HTML (see `WordGamePage`). Every new game that uses the word pool follows this.

---

## Shared changes (do first)
1. **`GameInfo.feature?: string`**: the slug of the game's feature page. The game page shows a "How it helps you learn →" link to it, and every feature page's `app` link points back. This cross-linking stops the two pages competing for the same search.
2. **`FeatureInfo.group?: 'games'`**: on `/features`, group the 15 game pages under a "Games" heading so they don't swamp the other features.
3. **Two keywords per game:**
   - The game page h1 aims at the game search, e.g. "Arabic memory game".
   - The feature page aims at the learning search, e.g. "learn Arabic vocabulary with memory cards".
   - No two pages share a title keyword. Existing slugs (`arabic-conversation-practice` for the tutor, `compare-arabic-dialects`) are off-limits.

---

## New games
Each new game gets:
- a `GAMES` entry,
- `src/routes/learn/game/<slug>/+page.svelte` + `+page.server.ts` (copy `odd-one-out` or `word-scramble`),
- a component in `src/lib/components/games/`,
- pure logic in `src/lib/games/<slug>.ts` with a vitest file,
- a `FEATURES` entry,
- screenshot entries.

Free rounds work as on today's games unless noted.

### 1. Dialect Match: `dialect-match` → feature `which-arabic-dialect-quiz`
- **Play:**
  - *Sort it:* one meaning, 4 written forms; drag or tap each onto Egyptian / Levantine / Darija / Fusha.
  - *Who said it?:* hear a line, pick the dialect.
- **Data:** new `/api/games/dialect-match` returns rounds built from:
  - the phrasebook (every slug present in all 4 dialects),
  - Room Hunt `vocab.json` (recorded audio, used by the listening mode),
  - scenario lines.
- Add a hand-written `src/lib/data/dialect-match/sets.json` of about 60 everyday words in 4 dialects for variety.
- No dialect picker: the game covers all four. Pass a "difficulty" picker into `GameShell` instead.

### 2. Memory Pairs: `memory-pairs` → feature `arabic-memory-game-vocabulary`
- **Play:** a 4×3 grid (6 pairs). Match Arabic↔English, or audio↔Arabic. Count the moves.
- **Data:** `WordGamePage` word pool. Audio mode only uses words with an `audioUrl`.

### 3. Speed Round: `speed-round` → feature `arabic-flashcards-speed-practice`
- **Play:** 60 s of "بيت = house?" true/false, with a streak multiplier.
- **Score:** the best score is stored in localStorage (wrapped in try/catch); XP per correct answer.
- **Data:** word pool. The false pairs take the English from another word in the same theme.

### 4. Letter Hunt: `letter-hunt` → feature `arabic-letter-forms-practice`
- **Play:**
  - Level 1: see a start/middle/end form → tap its base letter.
  - Level 2: see a word, find the highlighted letter's form. Words come from the word pool's `plain`, fetched after mount.
- **Data:** `letters` from `alphabet.ts`. Works the same in every dialect, so the dialect only changes the level-2 words.
- Letter audio: reuse the alphabet page's sounds if they exist; otherwise none in v1.

### 5. Listen & Type: `listen-and-type` → feature `arabic-dictation-practice`
- **Play:** hear a word, type it on the Word Scramble keyboard or a physical keyboard. Partial credit by letter, via `letterKey` folding and the edit distance in `pronunciation-similarity.ts`.
- **Data:** word-pool words with `audioUrl` only. If a theme has fewer than 8, hide the theme.

### 6. Verb Blitz: `verb-blitz` → feature `arabic-verb-conjugation-game`
- **Content first:** write `verb-conjugations/{levantine,darija,fusha}/*.json` for the same 75 verbs, in the Egyptian file shape.
  - Each dialect uses its own person keys (Fusha: أنا/أنتَ/أنتِ/هو/هي/نحن/أنتم/هم; no dual in v1).
  - Then check the existing `[dialect]/conjugations` pages either render the new files correctly or ignore them.
- **Play:** "هي · past · عاش" → pick from 4 (distractors are the same verb's other persons/tenses). Hard mode: type it.
- **Data:** a static JSON import is fine (our own content, and it's already public on the conjugation pages).

### 7. Fill the Gap: `fill-the-gap` → feature `arabic-fill-in-the-blank`
- **Play:** a sentence with one word blanked, 4 choices, then the English and the full sentence revealed.
- **Server:** `src/lib/server/games/fill-the-gap.ts` + `api/games/fill-the-gap`, cloned from spot-the-mistake.
  - Validator: the answer appears exactly once in the sentence, there are 4 unique options, and the answer is one of them.
  - Keep the JSON schema flat with no tight array bounds (memory: gemini-schema-too-many-states).
- **"Use my saved words" toggle** (signed-in only): the server pulls up to 10 of the user's `saved_word` rows for that dialect and asks for sentences around them.

### 8. Shadowing: `shadowing` → feature `arabic-shadowing-practice`
- **Play:** hear a native line, repeat it, get a 0–100 score from `scorePronunciation`, retry or move on.
- **Data:** lines that already have recordings: scenario JSON lines and Room Hunt phrases, per dialect.
- **Limits:** speech-to-text costs money, so it uses the round gate plus the existing speaking allowance (`SpeakAnswer`'s `onUnavailable`).

### 9. Daily Root: `daily-root` → feature `arabic-wordle-daily-puzzle`
- **Play:**
  - Today's root (e.g. ك-ت-ب) and 5 English clues (writer, office, book…).
  - Type each derived word, 3 tries per clue, letters shown green or yellow against the answer.
  - Finish with a shareable emoji grid ("Parallel Arabic Daily Root #42").
- **Content:** hand-written `src/lib/data/daily-root/roots.json`, about 180 roots × 5 derived Fusha words (arabic, plain, transliteration, english). Roots are shared across dialects, so the puzzle is labelled Fusha.
- **Serving:** `/api/games/daily-root` returns **today's** puzzle only, by days since launch mod N in UTC, so the answer list never reaches the client.
- **Access:** free for everyone, with no round gate (it's for growth). XP when signed in. Today's progress in localStorage.

---

## Scenarios: 4 new scenes (part 10)
For each of `doctor`, `airport`, `directions`, `cafe`:
- `<id>.ts` (`Scenario` lines/turns + `Stage`),
- hand-written `<id>.json` (4 dialects),
- registered in `scenarios/index.ts`,
- audio from `npm run generate:room-hunt-audio`.

Reuse existing 3D settings (`rooms.ts`) and props before adding any models:

| Scene | Setting |
|---|---|
| Doctor | `shop` laid out as a clinic, female/male coat characters (as pharmacy) |
| Airport | hotel lobby counter (check-in desk, then passport control) |
| Directions | the taxi street with no vehicle; a passerby NPC |
| Café / bakery | `shop` counter, food props (as market) |

Then update the Scenarios `GameInfo` copy (tagline, FAQ "Which situations…").

## Feature pages for the existing games
New `FEATURES` entries:

| Game | Feature slug |
|---|---|
| Word Scramble | `arabic-spelling-game` |
| Odd One Out | `arabic-vocabulary-puzzles` |
| Spot the Mistake | `arabic-grammar-practice-game` |
| Sentence Scramble | `arabic-sentence-building-practice` |
| Quiz | `arabic-vocabulary-quiz` |
| Scenarios | `arabic-role-play-practice` |

Room Hunt keeps `learn-arabic-in-3d`. Set `GameInfo.feature` on all of them.

**Every feature page has:**
- hero shot,
- 3–5 sections, each with a screenshot,
- 3–5 FAQs,
- a link to the game,
- links to 2–3 related games.

## Screenshots
Add capture entries to `scripts/capture-feature-screenshots.ts` for:
- every new game's hub shot (`game-<slug>`),
- each feature page's section shots.

Run it against the dev server, and add the `shot` sizes it reports to `GAMES` / `FEATURES`.

---

## Critical files
- `src/lib/constants/games.ts`, `src/lib/constants/features.ts` (data for every page)
- `src/routes/learn/game/<slug>/+page.{svelte,server.ts}` (×9)
- `src/lib/components/games/<Game>.svelte` (×9), `src/lib/games/<slug>.ts` + `.test.ts` (×9)
- `src/routes/api/games/{dialect-match,fill-the-gap,daily-root}/+server.ts`, `src/lib/server/games/fill-the-gap.ts`
- `src/lib/data/verb-conjugations/{levantine,darija,fusha}/`, `src/lib/data/daily-root/roots.json`, `src/lib/data/dialect-match/sets.json`
- `src/lib/games/room-hunt/scenarios/{doctor,airport,directions,cafe}.{ts,json}`, `scenarios/index.ts`
- `src/routes/features/+page.svelte` (games group), the game page component that renders the feature link
- `scripts/capture-feature-screenshots.ts`, `static/images/feature-pages/`

## Verification
1. **Checks:**
   - `npx svelte-check`: no new errors in touched files.
   - `svelte-autofixer` clean on every new or edited component.
   - `npx vitest run`: the new logic tests pass, and `scenario.test.ts` covers the 4 new scenes.
2. **Content checks** (vitest):
   - every conjugation file in the 3 new dialects has all persons × tenses, and translit has no accents;
   - every root has 5 derived words containing its letters;
   - every scenario line has Arabic in all 4 dialects.
3. **Play every game** on `npm run dev`, desktop and phone width: free rounds run out into the sign-up prompt, then the paywall; XP is awarded signed in. Daily Root shows the same puzzle twice in one day, and the share text copies.
4. **SEO:**
   - `/sitemap.xml` lists the 9 new game URLs and 16 new feature URLs.
   - The page source of a game page and a feature page shows the right title, description, canonical and FAQPage JSON-LD.
   - No `word` table text appears in the HTML.
   - The game page ↔ feature page links work both ways.
5. **iOS WebView:** the games work inside the app. Paywalls show Apple prices only (existing SubscribeButton behaviour).
6. **Native review:** list the flagged lines (Darija especially) in the PR description for a native speaker to check.
