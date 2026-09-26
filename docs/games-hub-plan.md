# Games hub: six Tuton-style games for /learn/game

> On approval, copy this plan to `docs/games-hub-plan.md` in the repo (project convention: plans live under `docs/`).

## Context

[tuton.io/games](https://tuton.io/games) lists 17 small games in a hub, each game on its own page. We want some of them on our game page, which is at `/learn/game` (there is no `/game` route).

Today `/learn/game` is a single setup screen for one quiz with three modes: multiple choice, listening and speaking. All three are built on generated sentences, and the whole game is two large files: `+page.svelte` (1,393 lines) and `play/+page.svelte` (1,469 lines). Three problems follow from that:

- **Little variety.** It's the same quiz every time.
- **Weak SEO.** The page ranks around #22 for "arabic games". `docs/seo-search-demand-plan.md` item 2e asks for "a proper games hub listing each mode as its own linked, described section".
- **The copy promises things that don't exist.** The meta description (`seo.ts:137`) and `static/llms.txt:29` advertise a "matching" mode that isn't there. The FAQ says "you can play without an account", but every game requires a subscription.

Tuton is built for a tutor and student in the same lesson. Its partner-only speaking games (Would You Rather, Question Wheel, This or That, Story Bubbles) don't suit a learner practising alone. Fill the Gap already exists here as the multiple-choice sentence round. Two Truths and a Lie would depend on generated "facts" being true. The remaining games fit well.

**What already supports this.** The Supabase `word` table has about 21,000 words in themed categories:

| Dialect | Words | Categories | Recorded audio |
|---|---|---|---|
| Egyptian | 8,253 | 40 | 2,375 words |
| Levantine | 4,903 | 19 | every word |
| Darija | 4,624 | 18 | every word |
| Fusha | 3,675 | 23 | none |

So the word games can run on existing data, with no generation cost and no text-to-speech quota.

### Decisions (from the user)
- **Games:**
  - Word games, free to try: **Word Match**, **Word Scramble** and **Word Guess** (hangman).
  - Generated games, subscribers only: **Odd One Out**, **Spot the Mistake** and **Sentence Scramble**.
- **Layout:** `/learn/game` becomes a Tuton-style grid of game cards. The current quiz setup moves to `/learn/game/quiz` and becomes one card. Each new game gets its own indexable page at `/learn/game/<slug>`, with the game playable on the page plus intro, how-to-play and FAQ copy.
- **Access, "free to try":**
  - Anyone can play 3 rounds of each word game per day without an account.
  - After that, signed-out visitors see `AuthModal` and signed-in non-subscribers see `PaywallModal`.
  - The generated games are for subscribers only, and the server enforces that too.

### Decisions made in planning
- **Dialect:**
  - Game pages show compact dialect chips.
  - The default is `getDefaultDialect(user)`, and a `?dialect=` parameter is respected.
  - Visitors from search have no target dialect, so they need a way to switch.
- **No timers:** the FAQ promises "no time pressure".
- **No database changes:**
  - New games don't write to `game_progress`, whose `game_mode` CHECK only allows the three existing modes.
  - XP reuses the existing `game_correct` event.
- **Each phase ships as its own PR.** The hub only lists games that are actually built, with no "coming soon" cards.

### Changes after design review (these win wherever they conflict with sections below)
1. **Words load on the client, not in the server-rendered page.**
   - `docs/egyptian-arabic-intent-pages-plan.md` says the Lingualism `word` corpus must not become indexable content.
   - So each word game fetches `GET /api/games/word-pool?dialect=&theme=&kind=match|letters` after the page mounts.
   - The response carries `x-robots-tag: noindex` and a public cache header. `/api/` is already disallowed in robots.txt.
   - The server-rendered page shows a static skeleton, which also prevents hydration mismatches from random dealing.
   - No `depends`/`invalidate` flow.
2. **Every game path needs an entry in `resolvePageKey` in `seo.ts`.** Unmapped routes get the generic title and drop `data.faqs`. The block at line 600 maps `/learn/game` → `game`, `/quiz` → `game-quiz`, and known slugs → `game-page`. `/play` stays unmapped and noindex.
3. **Word cleanup:**
   - Rewrite `audio_url` from `http://` to `https://`.
   - Take the first form of entries split by `،`, `,` or ` - `.
   - Drop rows whose Arabic contains Latin letters, digits, `_`, `*` or `/`.
   - Drop rows whose English is longer than 3 words.
   - The English dedupe key also strips a trailing "s" (whale/whales).
   - Add `stripArabicDiacritics` to `arabic-normalization.ts`.
4. **Audio:**
   - Never autoplay.
   - Use `AudioButton`, shown only when a word has `audioUrl` or the user subscribes.
   - Don't add a `playUrl` helper.
5. **XP:**
   - New `awardGameXp()` in `src/lib/games/game-xp.ts` sends awards one at a time, because `/api/award-xp` read-modify-writes and loses concurrent updates.
   - It updates the `userXp`/`userLevel` stores but shows **no toast**: `showXpToast` plays TTS that spends free users' lifetime quota.
   - Show "+N XP" on the results screen instead. The play page stays untouched.
6. **Free rounds:**
   - Counted per game, per identity (`userId ?? 'anon'`), per local day, so signing up gives a fresh 3.
   - Round sizes: Word Match 1 board; Word Scramble 5 words; Word Guess 1 word.
7. **Word Scramble has no length levels.** Each 5-word set ramps from short to long, because long words are scarce in some themes.
8. **Word Guess keyboard:** 29 keys (28 letters plus ء), with `letterKey = normalizeArabicTextLight`. So ه covers ة and ي covers ى, and a hint line says so.
9. **Sentence Scramble gets its own endpoint** `POST /api/games/sentence-scramble`. `/api/generate-game-sentences` mangles display spelling and has no word-count control, so it is left untouched.
10. **Generated-game endpoints** live under `/api/games/`.
    - A shared `src/lib/server/games/access.ts` provides `requireSubscriber`.
    - A shared `generate.ts` provides the validated Gemini call with levels beginner / intermediate / advanced.
    - Dialect wording comes from `getDialectName()` and a new `getDialectStyle()` in `src/lib/data/dialect-rules-v2.ts`.
    - Odd One Out asks the model for `oddWord` (the exact word); the server finds its index and shuffles the positions.
    - Spot the Mistake asks for `wrongWord`; the server locates the single matching token.
    - Non-subscribers get one hand-written demo item on each paid game page.
11. **Routes are static folders per game** (`word-match/`, `word-scramble/`, …), each with a `+page.server.ts` returning `{ faqs }`. No dynamic `[game]` route or matcher.
12. **Tests run with `npx vitest run`**; `npm run test:unit` starts watch mode.
13. **Work happens on a branch from `master`**, not `about-page-redesign`.

---

## Target layout

```
src/params/game.ts                          NEW  matcher: slug ∈ GAMES (excluding 'quiz')
src/routes/learn/game/
  +page.svelte / +page.server.ts            REWRITE → hub (cards, games-by-skill, FAQ)
  quiz/+page.svelte / +page.server.ts       git mv of today's setup page (small edits)
  play/…                                    unchanged except links back → /learn/game/quiz
  [game=game]/+page.server.ts / +page.svelte  NEW  one route serves all six games
src/lib/constants/games.ts                  NEW  hub cards + per-game SEO copy + FAQs
src/lib/constants/game-themes.ts            NEW  theme → category slugs per dialect
src/lib/utils/game-words.ts (+ .test.ts)    NEW  pure cleaning/filtering/shuffle helpers
src/lib/server/game-words.ts                NEW  loadGameWords() Supabase query
src/lib/helpers/game-free-rounds.ts (+test) NEW  3 free rounds per game per day
src/lib/helpers/award-game-xp.ts            NEW  lifted from play/+page.svelte:594
src/lib/components/games/                   NEW  GamePage, GameCard, GameOptions, GameResults,
                                                 WordMatch, WordScramble, WordGuess,
                                                 SentenceScramble, OddOneOut, SpotTheMistake
```

Why one dynamic route and not six folders:
- The existing `[dialect=dialect]` routes already use a param matcher.
- SvelteKit resolves the static `quiz/` and `play/` routes before `[game]`.
- Unknown slugs return 404 automatically.
- `+page.svelte` maps the slug to its component (`const GAME_COMPONENTS = { 'word-match': WordMatch, … }`) and renders it inside `GamePage`.

---

## Phase 1 (PR 1): hub, quiz move, shared foundation, Word Match

### 1a. Games config: `src/lib/constants/games.ts`
`GAMES: GameDef[]` has an entry for each built game plus the quiz. Each entry has:

- **Identity:** `slug`, `name`, `emoji`, `tagline`
- **Card details:**
  - `skills` (e.g. `['Vocabulary','Memory']`)
  - `levels` (e.g. `'A1–B1'`)
  - `access: 'free-to-try' | 'subscriber'`
  - `kind: 'word' | 'generated' | 'quiz'`
  - `accent`, `deep`: colours for the setup page's `--accent`/`--deep` card style
- **SEO:** `metaTitle`, `metaDescription`, `intro`, `howToPlay: string[]`, `faqs: {question, answer}[]` (2–3 each)

Target searches: "arabic memory game", "arabic word scramble", "arabic hangman", "arabic grammar game", "arabic sentence builder". Copy follows the existing conventions: no "AI", "generated" or "smart"; say "custom" or "fresh" instead.

### 1b. Hub (`/learn/game`)
- **`+page.svelte`:**
  - Hero: h1 "Arabic Games" and a subtitle.
  - A grid of `GameCard`s from `GAMES`, with the free-to-try word games first so search visitors land on something playable. Each card shows the emoji, name, tagline, skill chips, levels, a "Free to try" or "Subscribers" badge, and a Play link to `/learn/game/<slug>`.
  - A "Games by skill" list, derived from `skills`.
  - The FAQ and a footer nav.
- **`+page.server.ts`:** returns only `{ faqs: GAME_FAQS }`. User and subscription come from the parent layout. Any page whose data includes `faqs` gets FAQPage markup (`seo.ts:884`), so the FAQ lives only here.
- **Rewrite `GAME_FAQS`** in `game-content.ts` so every claim is true: the free-to-try rules, what a subscription unlocks, and the fact that saved words only work in the quiz.
- **Style:** follow the setup page's CSS-variable system (`--text1/2/3`, `--tile1…6`, `--brand`, `.press`, `.info-card`, `.hero-title`, `.footer-nav`, and the `0 4px 0 var(--deep)` press shadow), not the play page's Tailwind. Shared styles go in `GamePage` and `GameCard` so the scoped CSS isn't copied onto every page.

### 1c. Move the quiz to `/learn/game/quiz`
- `git mv` both `+page.svelte` and `+page.server.ts` into `quiz/`.
- **Edits on the quiz page:**
  - h1 becomes "Arabic Quiz", with a "← All games" link.
  - Remove the "Common questions" section and `faqs` from its load; the hub owns them.
  - Everything else stays as is, including Continue Playing and `startGame()`.
- **Links back from the play page:** change `play/+page.server.ts:85` redirect and the four `goto('/learn/game')` calls in `play/+page.svelte` (lines 941, 954, 1455, 1468) to `/learn/game/quiz`.
- **Homepage suggestion** (`src/routes/+page.server.ts:293–322`): when it points at an in-progress game, link to `/learn/game/quiz`. The generic game tile stays on `/learn/game`.
- **Links that stay on the hub:** Sidebar, MobileMenu, BottomNavigation, `/learn`, `/about`, the blog post and `VocabPractice`.
- **`/learn` card copy** (`src/routes/learn/+page.svelte:42`): describe the whole set of games.

### 1d. SEO wiring
- **`seo.ts`:**
  - Rewrite the `game` description so it's accurate.
  - Add a `game-page` meta key, built from `GAMES` by slug; this also covers `quiz`.
  - Route mapping next to line 600: `if (parts[0]==='learn' && parts[1]==='game' && parts.length===3 && GAME_BY_SLUG[parts[2]])`.
  - `/learn/game/play` stays noindex (line 86).
- **Sitemap:** add `/learn/game` (currently missing), `/learn/game/quiz` and each built game to `staticPages` in `src/routes/sitemap.xml/+server.ts`.
- **`static/llms.txt:29`:** list the real games.
- **`seo.test.ts`:** add the new paths to the title-uniqueness and route cases (lines 20 and 52).

### 1e. Word pool
**`src/lib/constants/game-themes.ts`** lists about 8 themes (`id`, `label`, `emoji`, `categories: Partial<Record<Dialect, string[]>>`):

| Theme | Egyptian | Levantine | Darija | Fusha |
|---|---|---|---|---|
| food | `food_and_drink` | `food_and_drink_2` | `food_and_drink_5` | `food` |
| animals | `animals` | `animals_2` | `animals_5` | `animals` |
| family | `family` | `family_2` | `family_5` | `mankind_and_kinship` |
| clothes | `clothing_jewelry_and_accessories` | `…_2` | `…_5` | `clothing` |
| travel | `cars_and_other_transportation` | `…_2` | `…_5` | `city_and_transportation` |
| weather | `weather` | `weather_2` | `weather_5` | `nature__and__weather` |
| home | `around_the_house` | — | `around_the_house_4` | `vocabulary_from_around_the_house` |
| work | `work_and_professions` | `…_2` | `work_and_professions_4` | `work_and_money` |

- A theme with no categories for a dialect is hidden for that dialect.
- Never use the Levantine and Darija `all` category.
- Before finalising, probe each dialect × theme with SQL. It must yield at least 8 pair-eligible and 8 letter-eligible words after filtering; drop any that don't.

**`src/lib/utils/game-words.ts`** holds pure, tested functions over the messy rows. The data mixes words, plurals in parentheses (`كلِب (كْلاب)`), phrases, full example sentences, and transliteration annotations (`kal [i3]`). Darija transliterations are empty.

- `type GameWord = { id, arabic /*display, keeps tashkeel*/, plain /*no tashkeel/tatweel*/, english, transliteration, audioUrl: string | null }`
- `cleanEntry(row): GameWord | null`:
  - Strip `(…)` from the Arabic.
  - Strip `[…]` and `(…)` from the transliteration.
  - Reject rows containing `؟ ? . ! ،` or more than 2 Arabic tokens.
- `isPairWord(w)`: at most 2 tokens and English of at most about 24 characters.
- `isLetterWord(w)`: `plain` is a single token of 3–7 Arabic letters (`ء-ي`).
- `dedupe(words)`: keeps words unique by an English key and by Arabic.
  - English key: lower-cased, with `(…)` and a leading `to`/`a`/`an`/`the` stripped.
  - Arabic: unique by `normalizeArabicText(plain)`.
  - This means Word Match never shows two cards with the same meaning (the data has both `قطْمة` and `حِتّة` as "a bite").
- `shuffle<T>(arr)`: Fisher–Yates. The existing `sort(() => Math.random() - 0.5)` shuffles are biased; leave them alone.

**`src/lib/server/game-words.ts`:**
- `loadGameWords({ dialect, theme, kind: 'pairs'|'letters', count })` queries `word` with the anon `$lib/supabaseClient`, as `play/+page.server.ts` does:
  - `.eq('dialect').in('category', cats)`
  - clean → filter → dedupe → shuffle → take `count`
- Prefer rows with `audio_url` when the pool is big enough.

**`[game=game]/+page.server.ts`:**
- Returns `{ game, dialect, theme, themes, words, faqs: game.faqs }`.
- `words` is loaded only for `kind === 'word'`.
- Calls `depends('game:words')`:
  - **Play again** = `invalidate('game:words')`.
  - **Changing theme or dialect** = `goto('?dialect=…&theme=…', { replaceState, noScroll, keepFocus })`.
  - The game component is wrapped in `{#key data.words}` so it resets cleanly.
- The first board is server-rendered, so crawlers see real Arabic content.

### 1f. Small shared helpers
- **`game-free-rounds.ts`:**
  - `FREE_ROUNDS_PER_DAY = 3`.
  - localStorage key `pa-free-rounds:<slug>` holds `{ d: 'YYYY-MM-DD' (local), n }`; the count resets when the date changes.
  - Every access is wrapped in try/catch. If storage is unavailable, allow play.
  - `canStartFreeRound(slug)` and `recordFreeRound(slug)`.
  - Subscribers skip the check entirely.
  - **What counts as a round:** one Word Match board, one 8-word Word Scramble session, or one 5-word Word Guess session. A round is counted on the first tap, because the board is already on screen.
  - At the limit: signed out → `AuthModal`; signed in → `PaywallModal`.
  - Non-subscribers see "2 free rounds left today" under the board.
- **Audio:**
  - Add `playUrl(src, options)` to `src/lib/utils/listening-audio.ts`, sharing `play()`'s Howl/`currentSound` handling so only one sound plays at a time.
  - Games auto-play `audioUrl` only when a recording exists, so anonymous visitors never spend text-to-speech quota silently.
  - Explicit replay buttons use the existing `AudioButton` (`text` + `audioUrl`). It already falls back to text-to-speech and handles 401/403 with modals.
- **XP:**
  - Move `awardGameXp()` verbatim from `play/+page.svelte:594` into `src/lib/helpers/award-game-xp.ts` (it uses `userXp`/`userLevel` from `$lib/store/xp-store` and `showXpToast`). The play page imports it.
  - Call it only when `user` is set, since the endpoint returns 401 otherwise.
- **Components** in `src/lib/components/games/`:
  - **`GamePage`:** the page frame: "← All games", h1 and tagline, a `children` snippet for the game, then how to play, the FAQ, and an "other games" strip.
  - **`GameOptions`:** dialect chips, plus theme chips for word games or a level choice for generated games.
  - **`GameResults`:** the headline stat, a "New best" flag, a recap list of Arabic, transliteration, English and `AudioButton`, and Play again / Change theme / All games buttons.

### 1g. Word Match (`WordMatch.svelte`)
- **Board:**
  - A segmented control picks Easy (6 pairs) or Hard (8 pairs); the loader returns 8 pair words and Easy uses the first 6.
  - Each word makes two cards: Arabic (with tashkeel, `dir="rtl" lang="ar"`) and English.
- **State:** `flipped` (at most 2), a `matched` set, `moves`, and a `locked` flag during a mismatch.
- **Turn:**
  - Flipping the second card adds a move.
  - A match stays revealed, plays the recording (`playUrl`), awards XP, and is announced in an `aria-live` region.
  - A miss locks the board for about 900 ms, then flips both cards back.
- **End:** clearing the board shows `GameResults` with "Cleared in N moves", the best score per board size (per-browser localStorage), and a recap of all pairs.
- **Accessibility:** cards are `<button>`s. With `prefers-reduced-motion`, cards swap faces instead of flipping in 3D. On mobile, 4 columns with no horizontal scroll.

---

## Phase 2 (PR 2): Word Scramble and Word Guess
Both use `loadGameWords({ kind: 'letters' })` and the Phase 1 foundation.

### Word Scramble (`WordScramble.svelte`)
Each session is 8 words.
- **Tiles:**
  - `[...plain]` becomes tiles with ids, so repeated letters are handled.
  - Shuffle until the order differs from the original.
  - Tiles show single letters in their standalone form. ل + ا are separate tiles and join into لا automatically.
- **Answer area:**
  - Shows `answer.join('')` in large Arabic type, so learners see the letters join as they tap. This is the teaching moment.
  - Also shows a "3/5 letters" counter.
- **Controls:**
  - Tapping a tile adds it to the answer; ⌫ removes the last letter; Clear resets the word.
  - Typing on a physical Arabic keyboard picks the first matching tile.
- **Clues:**
  - The English meaning and an `AudioButton` are visible from the start.
  - The transliteration stays hidden until the word is solved, because it gives the letters away.
- **Checking:**
  - When the answer is full, compare it to `plain`.
  - Wrong: the answer shakes, and the learner can keep editing.
  - Hint: places the next correct letter, and the word no longer scores.
  - Reveal: gives up on the word.
- **Solved:** show the word with tashkeel, the transliteration and the English, and auto-play the recording if there is one.
- **Score:** words solved without a hint or reveal. `GameResults` shows "6/8".

### Word Guess (`WordGuess.svelte`)
Each session is 5 words, with 6 misses per word shown as dots rather than a gallows.
- **Hidden word:**
  - A right-to-left row of boxes, one per letter.
  - A revealed box shows the actual letter in its standalone form.
- **Clue:** the English meaning (and the theme) is visible from the start.
- **Keyboard:**
  - An on-screen grid of the 28 letters plus ء and ة (30 keys).
  - Physical Arabic keyboards work through `keydown`.
- **Matching guesses:**
  - `guessKey(ch)` returns `ة` for ة; otherwise it returns `normalizeArabicTextLight(ch)`.
  - So guessing ا reveals أ, إ and آ, ي covers ى, and ء covers ئ and ؤ.
  - ة keeps its own key because learners look for it at the end of a word.
  - Used keys turn green (hit) or grey (miss).
- **End of word:** win or lose, show the joined word with tashkeel, the transliteration, the English and the audio, then Next.
- **Score:** words guessed.

---

## Phase 3 (PR 3): Sentence Scramble, plus the server gate for generated games

- **`src/lib/server/game-generation.ts`:**
  - Move `getDifficultyDescription` and `dialectConfigs` out of `api/generate-game-sentences/+server.ts`. They're currently defined inside the handler, and SvelteKit rejects extra exports from `+server.ts`.
  - Add `requireSubscriber(locals)`, which returns `{ user }` or a `json(…, 401|403)` Response. It follows `api/anki-export/+server.ts:15–26`: `locals.auth.validate()` then `getUserHasActiveSubscription(user.id)`, with 403 carrying `{ requiresSubscription: true }`.
- **Apply `requireSubscriber` to `/api/generate-game-sentences`.**
  - Its only caller is the quiz play page, which is already subscriber-gated.
  - This closes today's open endpoint and makes the "subscribers only" decision real on the server.
- **`SentenceScramble.svelte`:**
  - **Setup:** a level (A1–B2) and an optional topic.
  - **Start:** if not subscribed, show `AuthModal` or `PaywallModal`. Otherwise `POST /api/generate-game-sentences { dialect, difficulty, count: 10, customRequest, questionStyle: 'blank' }` and use only `arabic`, `english` and `transliteration`.
  - **Each sentence:**
    - The English is shown.
    - The Arabic tokens (`split(/\s+/)`) are shuffled with the same "must differ from the original" rule.
    - The learner taps tokens into order, then presses Check.
    - Compare with `normalizeArabicText(joined) === normalizeArabicText(arabic)`.
    - Wrong: mark the first wrong position and offer Try again or Show answer.
    - Correct: show the transliteration and play the sentence (`listening-audio.play`).
  - **Score:** correct on the first check, out of 10.
  - Keep the reorder logic in `src/lib/utils/word-order.ts` (tested). `SentenceBlock.svelte` is left alone.

---

## Phase 4 (PR 4): Odd One Out and Spot the Mistake

Both new endpoints follow the same template:

- **Gate:** `requireSubscriber`.
- **Body:** `{ dialect, difficulty, count: 10 }`.
- **Model call:** `gemini-2.5-flash` via `generateContentWithRetry` with `config: { temperature, maxOutputTokens: 8192, responseMimeType: 'application/json', responseJsonSchema }`. The key is `config`, not `generationConfig`.
- **Parsing:** `parseJsonFromGeminiResponse`, then Zod, then a pure validator in `src/lib/utils/game-validators.ts` (tested).
- **Invalid items** are dropped. If fewer than 5 remain, return a 502 with a "high demand" message; never mention AI.
- **Schemas:**
  - They go in `gemini-schemas.ts` and return `{ zodSchema, jsonSchema }`.
  - They must be **flat**: no array bounds and no enums, because Gemini rejects schemas it finds too complex (the "too many states" 400).
  - Counts and allowed values are enforced in the prompt and by the validator.

### Odd One Out: `POST /api/generate-odd-one-out`
- **Schema:** `{ rounds: [{ words: [{arabic, english, transliteration}], oddIndex: number, linkType: string, explanation: string }] }`
- **Prompt:**
  - 10 rounds that get harder:
    - easy: meaning category
    - medium: word type or gender
    - hard: shared root (كتاب/مكتب/كاتب vs شراب) or plural vs singular
  - Exactly one odd word per round, and no second valid way to group the four.
  - The explanation is one English sentence naming the rule.
  - Uses the dialect wording from `dialectConfigs`.
- **Validator:**
  - Exactly 4 words, all non-empty.
  - The Arabic words are unique after `normalizeArabicText`.
  - `oddIndex` is an integer from 0 to 3.
- **Client:** shuffle the 4 words and remap `oddIndex`, so any position bias from the model disappears.
- **UI:**
  - A 2×2 grid of Arabic tiles with a transliteration toggle.
  - Tapping a tile reveals the result: the odd tile is highlighted, the English appears under all 4, the explanation line appears, and each tile gets an `AudioButton`.
- **Score:** correct on the first tap.

### Spot the Mistake: `POST /api/generate-spot-the-mistake`
- **Schema:** `{ items: [{ words: string[], wrongIndex: number, correction: string, correctSentence: string, english: string, transliteration: string, errorType: string, explanation: string }] }`
- **Prompt:**
  - Each item is a natural sentence in the dialect with exactly ONE wrong token.
  - `words` is the incorrect sentence split on spaces.
  - Error types: gender agreement, verb person, definite article, number agreement, pronoun suffix, preposition, negation.
  - Never make an error out of a spelling variant (ة/ه, alef forms), because the app accepts those.
- **Validator:**
  - `0 ≤ wrongIndex < words.length`.
  - `normalize(words[wrongIndex]) ≠ normalize(correction)`.
  - Swapping `correction` in and joining must equal `normalize(correctSentence)`.
- **UI:**
  - The sentence appears as tappable right-to-left word chips, with the English shown below, since the task is grammar rather than translation.
  - Tapping a chip reveals the result: the wrong chip is struck through with the correction above it, and the corrected sentence appears with its transliteration, audio and explanation.
- **Score:** correct on the first tap.

---

## Reused as is
- `normalizeArabicText` / `normalizeArabicTextLight`: `src/lib/utils/arabic-normalization.ts`
- `play`, `stopPlayback`, `releaseAll` (on destroy) and `TtsAccessError`: `src/lib/utils/listening-audio.ts`
- `AudioButton`, `AuthModal`, `PaywallModal`: `src/lib/components/`
- `getDefaultDialect`: `src/lib/helpers/get-default-dialect.ts`
- `getUserHasActiveSubscription`: `src/lib/helpers/get-user-has-active-subscription.ts`
- `generateContentWithRetry` / `GeminiApiError`: `src/lib/utils/gemini-api-retry.ts`
- `parseJsonFromGeminiResponse`: `src/lib/utils/gemini-json-parser.ts`
- The FAQ structured data that `seo.ts` builds from `data.faqs`
- `SaveButton`, if a recap offers "save word": always pass `className=""` (the known JSDoc bug)

## Workflow rules for implementation
- Run the Svelte MCP `svelte-autofixer` on every `.svelte` file until it's clean (project CLAUDE.md).
- Svelte 5 runes only.

## Tests (vitest, `npm run test:unit`; the environment is node, so stub `localStorage` with `vi.stubGlobal`)
- **`game-words.test.ts`:**
  - `cleanEntry` strips `(…)` and `[…]`, and rejects sentences and long phrases.
  - `isLetterWord` enforces 3–7 letters.
  - `dedupe` catches duplicate English meanings ("a bite").
  - `shuffle` returns a permutation.
- **`guessKey`:** أ/إ/آ→ا, ى→ي, ئ/ؤ→ء, and ة stays ة.
- **`word-order.test.ts`:** the scramble never matches the original order, and the check ignores tashkeel.
- **`game-validators.test.ts`:** good and bad fixtures for both generated games.
- **`game-free-rounds.test.ts`:** the day rollover, the limit, and storage throwing.
- **`seo.test.ts`:** the new paths resolve to distinct titles.

## Verification (per PR; the user checks the UI visually, so no browser-automation screenshots)
1. **Baseline:** before starting, record `npm run check`'s error count on master. After each PR, confirm there are no new errors and that `npm run test:unit` passes.
2. **Hub:** `npm run dev`, then `/learn/game`:
   - The cards are listed and each one opens its game.
   - `/learn/game/quiz` still starts a quiz.
   - "New Game" in the play page goes back to `/learn/game/quiz`.
   - An unknown slug (`/learn/game/nope`) returns 404.
3. **Word games, signed out:**
   - View source shows server-rendered Arabic words.
   - Play a full board or session: moves and score count, and recordings play (Levantine, Darija, and Egyptian themes that have audio).
   - Fusha plays silently without errors.
   - Changing theme or dialect gives a new board.
   - The 4th round of the day opens `AuthModal`.
   - Signed in without a subscription: `PaywallModal`.
   - Subscriber: unlimited, and `/api/award-xp` fires on correct answers.
4. **Generated games:**
   - As a subscriber, each game generates 10 items.
   - Calling the endpoints with `curl -X POST localhost:5173/api/generate-odd-one-out` and no cookie returns 401. The same goes for `generate-spot-the-mistake` and `generate-game-sentences`.
   - Read about 3 batches per dialect and judge the quality. In Odd One Out, check that there's never a second valid answer. In Spot the Mistake, check that exactly one token is wrong. Tighten the prompts if not.
5. **SEO:**
   - Each game page has a unique title and description, plus FAQPage JSON-LD.
   - `/learn/game/play` is still noindex.
   - `/sitemap.xml` lists the new URLs.
6. **Mobile:** at 375px, boards and keyboards fit without horizontal scroll, and Arabic reads right to left.

## Out of scope (noted, not fixed here)
- **Games don't count toward streaks:** `ActivityType` in `src/lib/helpers/track-activity.ts` has no `'game'` type.
- **"Your saved words" as a theme** for the word games would be a natural follow-up.
- **Egyptian vocabulary topic pages** could deep-link to Word Match (`egyptian-arabic/vocabulary/[topic]/+page.svelte:132`).
- **Existing bugs:**
  - the literal `=` emoji on the play page (lines 845, 847, 849, 1449)
  - `/api/generate-words` feeding `[object Object]` into its prompt
  - `SaveButton` never sending `dialect`
