# Egyptian Arabic: high-intent pages with a free lesson and a CTA

## Context

The goal is to stop chasing broad traffic and build pages against searches that signal
purchase intent — "Egyptian Arabic phrases", "Egyptian Arabic numbers", "Egyptian Arabic
pronunciation", "Egyptian Arabic for beginners", "how to say X in Egyptian Arabic" — each with a
free interactive lesson on the page and a CTA into the paid product.

Two things came out of investigating the repo and the Supabase `word` table that change the shape
of this work:

**1. Most of the SEO surface already exists. The conversion layer does not.**
`docs/seo-search-demand-plan.md` shipped: `/egyptian-arabic/word/[slug]` (250 prerendered pages),
`/egyptian-arabic/phrases/[slug]` (25), `/egyptian-arabic/conjugations/[verb]` (72),
`/egyptian-arabic-vs-fusha`, a data-driven `resolvePageKey` in `src/lib/utils/seo.ts`, and a
sitemap that covers all of it. `formatDialectName('fusha')` already renders "Modern Standard
Arabic", so the vs-MSA query is covered. `/egyptian-arabic`'s title is already "Learn Egyptian
Arabic Online". **None of those pages has an interactive exercise or a conversion CTA** — the word
page's only CTA is "Open in the vocabulary explorer", pointing at `/vocabulary`, which serves two
categories and requires a login to be useful.

**2. The 21k-row `word` table is two different corpora, and only one is ours.**

| `source` | Rows | Dialects | Audio | Notes |
|---|---:|---|---|---|
| `common_words` | 2,303 | Egyptian only | none | The `most_common` category. Mirrors the in-repo `src/lib/constants/common-words.ts` (2,404 entries, from the open `klam-masry` list). Only rows with a real `frequency` value. |
| `api` | 19,152 | all four | 11,847 hotlink `media.lingualism.com` | Lingualism's commercial vocabulary books. |

Further findings on the `api` corpus, recorded so they don't get rediscovered later:

- Egyptian and Fusha share 22 categories at **identical row counts**, and the rows are the same
  Arabic and the same English gloss — 36 of 43 `colors` rows match exactly, differing only in
  transliteration. Publishing both `/egyptian-arabic/vocabulary/colors` and
  `/fusha/vocabulary/colors` off this would be near-duplicate content.
- Many rows are not words. The `numbers` category is largely full sentences
  ("Add up the price of all the items to get the total."). Egyptian `weather` is 42% single words,
  `family` 53%, `health_and_medicine` 58%.
- Fusha has **zero** audio (3,675/3,675 null). Levantine and Darija have 100% audio, all hotlinked
  over plain `http://` from lingualism.com — mixed content that would fail on the https site anyway.
- `sections.ts` is stale: it lists `crime_and_punishment` and `technology`, neither of which exists
  in the table, and its per-category counts don't match reality.

**Decisions taken (from the user):**
- Public SEO pages are built from **`common_words` only** — our own open-provenance data.
- **Egyptian only** for this ship; measure in GSC before templating across dialects.
- Full word list free and server-rendered; one free practice round, then the **existing
  `PaywallModal.svelte`**. There is no free trial yet — do not write trial copy.

The `api` corpus stays where it is: in-app, behind the paywall, feeding `/learn/game`. It does not
become public indexable inventory.

---

## What we're building

| Target query | Page | Status |
|---|---|---|
| Egyptian Arabic vocabulary | `/egyptian-arabic/vocabulary` | **new** hub |
| Egyptian Arabic numbers | `/egyptian-arabic/vocabulary/numbers` | **new** (hand-seeded, see 2c) |
| Egyptian Arabic verbs / food / family / … | `/egyptian-arabic/vocabulary/[topic]` | **new**, ~12–16 pages |
| Egyptian Arabic pronunciation | `/egyptian-arabic/pronunciation` | **new** |
| Egyptian Arabic for beginners / course | `/egyptian-arabic/beginners` | **new** |
| learn Egyptian Arabic online | `/egyptian-arabic` | exists — add practice + CTA |
| Egyptian Arabic phrases | `/egyptian-arabic/phrases` | exists — add practice + CTA |
| how to say X in Egyptian Arabic | `/egyptian-arabic/word/[slug]` | exists — replace dead CTA |
| Egyptian Arabic vs Modern Standard Arabic | `/egyptian-arabic-vs-fusha` | exists — add practice + CTA |
| most common egyptian arabic words | `/blog/how-many-egyptian-arabic-words` | **new** post |
| franco arabic / arabizi | `/blog/franco-arabic` | **new** post |

---

## Phase 0 — Land the plan in the repo

Copy this file to `docs/egyptian-arabic-intent-pages-plan.md`, alongside
`docs/seo-search-demand-plan.md` and `docs/blog-posts-search-demand-plan.md`, so the corpus
findings above live with the code rather than in a session transcript.

---

## Phase 1 — The practice-and-convert module (do this first)

This is the highest-leverage step: it lands on ~350 pages that already rank, and every later phase
reuses it. Ship and deploy this before generating any new pages.

**The round: multiple choice alternating with speaking.** Eight questions, odd slots multiple
choice, even slots "say it out loud". Multiple choice first, so an anonymous visitor is answering
within a second of the page loading and the mic is never the price of entry; the speaking slots are
what makes the page feel like the product rather than a word list.

**New `src/lib/components/dialect-shared/vocab/VocabPractice.svelte`** — the round controller.

- Props: `words: { arabic, english, transliteration, audioUrl? }[]`, `dialect`, `topicLabel`.
- Alternates a multiple-choice block and a speaking block, tracks score, renders the CTA at the end.
- No server call to build the round, so the host page stays prerenderable.

**`/learn/game/play` already implements both mechanics, and it is the version to reuse.** Its
speaking loop is the most developed of the three in the repo — better than
`PronunciationTestModal.svelte` and `SpeakSentence.svelte`, both of which run raw Levenshtein
against un-normalized text and score a correct answer far too low. The work here is to **lift the
two pure functions out of that 1,358-line route into `$lib/utils/`** so the game and the new
component share one source of truth, rather than adding a fourth copy.

**Extract `src/lib/utils/pronunciation.ts`** — lifted verbatim from
`src/routes/learn/game/play/+page.svelte:628-670`:

- `transcribe(blob, dialect)` — POST to `/api/speech-to-text` with the `dialect` field, which the
  endpoint maps to a Chirp 3 language code (`egyptian-arabic` → `ar-EG`).
- `scorePronunciation(target, spoken)` — `normalizeArabicText()` from
  `$lib/utils/arabic-normalization` on **both** sides (it already strips diacritics, non-Arabic
  characters, and normalizes `أإآ`→`ا`, `ة`→`ه`, `ئؤ`→`ء`, `ى`→`ي`), then
  `levenshtein.get` → `Math.round((1 - distance / maxLength) * 100)`.
- `PASS_THRESHOLD = { word: 60, sentence: 50 }` — the game's existing thresholds. They already solve
  the "Levenshtein is harsh on short words" problem; don't invent a new scale.
- `checkMediaRecorderSupport()` — the one-liner at line 450.

**Extract `src/lib/utils/quiz-questions.ts`** — lifted from
`src/routes/learn/game/play/+page.svelte:413-437`: `buildMultipleChoice(word, allWords)` returns
`{ options, correctAnswer, type }`, randomly choosing `arabic-to-english` or `english-to-arabic` per
question and sampling 3 distractors from `allWords`, shuffled with the answer. This direction-mixing
is better than `VocabQuizBlock.svelte`, which only ever asks one way — so the new block uses this,
and `VocabQuizBlock` stays where it is, untouched.

Then update `play/+page.svelte` to import both instead of its inline copies. That is a small,
behaviour-preserving diff — the whole point is that the game keeps working identically while the
logic becomes reusable.

**New `src/lib/components/dialect-shared/vocab/QuizWordBlock.svelte` and `SpeakWordBlock.svelte`** —
the two question UIs, both taking `{ word, allWords, dialect, onResult }`:

- `QuizWordBlock` renders `buildMultipleChoice` output, four options, correct/incorrect state.
- `SpeakWordBlock` shows English + Arabic + transliteration + `InlineAudioButton` (hear it before
  saying it), then `RecordButton.svelte` → `MediaRecorder` → `transcribe` → `scorePronunciation`,
  with the score in `Similarity.svelte` (the existing dial). Mirror the game's affordances:
  retry (`retrySpeaking`), skip (`skipSpeakingWord` — marks wrong, moves on), and the
  `NotAllowedError` branch that tells the user the mic was denied rather than failing silently.
- **Ask for mic permission lazily**, at the first speaking slot, not on page load. If
  `checkMediaRecorderSupport()` is false or permission is denied, that slot silently becomes another
  multiple-choice question. The round must complete for someone who never grants the mic.

**Cost and abuse — this needs a limit before it goes on a public page.** `/api/speech-to-text` has
**no auth and no rate limit today** (`src/routes/api/speech-to-text/+server.ts:59`), which is fine
on today's logged-in-only surfaces and not fine on a prerendered page we are actively asking Google
to send strangers to. Every call is billed Google Chirp 3. Before shipping:

- Cap the free round at 4 spoken attempts client-side (the 4 even slots, retries included) —
  the same idea as the game's `FREE_TURN_LIMIT = 5` (`play/+page.svelte:16`), but landing at the end
  of a complete round rather than mid-round.
- Add an IP-keyed rate limit in the endpoint using the existing `getRedisClient` /
  `getCached` / `setCached` helpers in `src/lib/server/redis.ts`.
- This is the speaking analogue of `ANON_TTS_LIMIT` on the TTS endpoint.

**End of round → CTA.** For `!isSubscribed`, "Practice all N words" opens `PaywallModal.svelte`
(`src/lib/components/PaywallModal.svelte`, already used this way in
`src/routes/learn/game/+page.svelte:221`). For subscribers, link to
`/learn/game/play?dialect=egyptian-arabic&category=…`. Secondary CTA on every instance: `/tutor` —
the site's best-converting page, the largest cluster in Search Console, and the natural next step
for someone who just enjoyed speaking into the mic.

Leave `PronunciationTestModal.svelte`, `SpeakSentence.svelte` and `VocabQuizBlock.svelte` alone.
The first two would score noticeably better on `pronunciation.ts` — they compare raw un-normalized
text today — but fixing them is a separate change and shouldn't ride along here.

**Audio.** `common_words` rows have no `audio_url`, so `InlineAudioButton` falls back to
`/api/text-to-speech`, which caps anonymous users at `ANON_TTS_LIMIT = 6`
(`src/routes/api/text-to-speech/+server.ts:17`). Six plays on a 60-word page is a bad first
impression on exactly the visitors we're courting. Pre-generate audio for the words that ship into
Supabase storage and bake the URLs into the JSON — reuse the ElevenLabs setup in
`src/lib/server/audio-generation.ts` and the script pattern in `scripts/`. Treat this as part of
Phase 2's build script, not a separate project.

**Retrofit onto existing pages:**
- `src/routes/[dialect=dialect]/word/[word]/+page.svelte:129-149` — replace the "Open in the
  vocabulary explorer" aside with `VocabPractice` seeded from `data.related` plus the word itself.
- `src/routes/[dialect=dialect]/phrases/+page.svelte` and `phrases/[phrase]/+page.svelte`.
- `src/routes/[comparison=dialectComparison]/+page.svelte` — quiz over the 12 side-by-side phrases
  the loader already returns.
- `src/routes/egyptian-arabic/+page.svelte` (via `DialectLanding.svelte`).

`isSubscribed` already comes from the root layout's `parent()`; the word and phrase routes are
`prerender = true`, so read it from `$page.data` in the component rather than adding a loader.

---

## Phase 2 — Vocabulary topic pages from `common_words`

`common-words.ts` is `{ _id, word, appeared, en, franco }` — frequency-ranked, but **untopiced**,
and the top of the list is function words (مش, من, يا, ده). `scripts/build-word-pages.ts:40`
already excludes `most_common` from word pages for exactly this reason. So topics have to be
assigned, and function words have to be routed to their own page rather than dropped.

**2a. `scripts/build-vocab-topics.ts`** — model it on `scripts/generate-phrases.ts` (Gemini +
Zod schema, hand-reviewed before commit) and `scripts/build-word-pages.ts` (quality gate, JSON
emit, `--dry-run` / `--limit`).

1. Read `commonWords`, sort by `appeared` desc.
2. Gemini classifies each into a **fixed enum** of topic slugs plus `function-word` and `skip`.
   A closed enum keeps the schema simple — per the `gemini-schema-too-many-states` note, complex
   `responseJsonSchema` values 400. Use `config`, not `generationConfig`.
3. Enrich each kept word with diacritized Arabic and a proper transliteration (the file only has
   `franco`).
4. Attach 1–2 real example sentences from **`.word-corpus-cache.json`** — the 1.5 MB story-sentence
   index `build-word-pages.ts` already built. Real sentences, not generated ones, is what keeps
   these pages off the thin-content pile that took `/generated_story/*` to 0.67% CTR.
5. Generate and upload audio per word (see Phase 1).
6. Emit `src/lib/data/vocab/egyptian-arabic/{topic}.json` + an `index.json`.

**Gate: a topic ships only with ≥ 20 words that have a gloss, a transliteration and at least one
example sentence.** The script prints the topic distribution before writing, so the final topic
list is decided from the data, not guessed here. Expect roughly 12–16 topics to clear the bar.

**2b. Routes**, following the `words` manifest pattern exactly
(`src/lib/data/words/manifest.ts` — `import.meta.glob` + `entries()` + `prerender = true`):

- `src/lib/data/vocab/manifest.ts` — `topicSlugs()`, `getTopic(slug)`, `topicIndex()`.
- `src/routes/egyptian-arabic/vocabulary/+page.server.ts|.svelte` — hub listing every topic with its
  word count and 4 sample words, plus a link to the 250 word pages and the phrasebook.
- `src/routes/egyptian-arabic/vocabulary/[topic]/+page.server.ts|.svelte` — H1
  "Egyptian Arabic {Topic} — N Words with Audio", the full table (Arabic / transliteration / franco /
  English / audio), example sentences, `VocabPractice`, CTA, and links to
  `/egyptian-arabic/word/[slug]` **only where that slug exists** in the words manifest (reuse
  `getWord` from `src/lib/data/words/manifest.ts`) plus sibling topics.

Build under `egyptian-arabic/` rather than the `[dialect=dialect]` group — this ship is Egyptian
only, and `/{dialect}/vocab` is already occupied by 301 stubs
(`src/routes/levantine/vocab/+page.server.ts` and siblings) with a live `dialect-vocab` key in
`seo.ts`. Moving to the `[dialect]` group is a later step, once GSC says the template works.

**2c. Numbers is a special case.** "Egyptian Arabic numbers" wants 1–20, the tens, hundreds and
ordinals as a systematic table. Frequency data will never produce that. Hand-author
`src/lib/data/vocab/egyptian-arabic/numbers.json` (a couple of hours of work), and let the script
merge in whatever number words `common_words` does contain. Same page template.

**2d. `/egyptian-arabic/vocabulary/most-common`** — the 1,000 most common Egyptian Arabic words,
frequency-ranked, with the `appeared` counts shown. This is the one page where our data is
genuinely distinctive, and it is where the function words go.

---

## Phase 3 — The two missing hand-written pages

**`/egyptian-arabic/pronunciation`** — the sounds that actually separate Egyptian from what
textbooks teach: ج as g, ق as a glottal stop, the ع and ح pharyngeals, emphatic ص/ض/ط/ظ, the
b- prefix's effect on rhythm. Every example gets audio. Reuse the feature copy already written in
`DIALECT_LANDING['egyptian-arabic'].features` (`src/lib/constants/dialect-landing.ts:39-56`) rather
than rewriting it, and cross-link `/alphabet` and `/keyboard`. Ends with `VocabPractice` in
listening mode over the contrast pairs.

**`/egyptian-arabic/beginners`** — serves "Egyptian Arabic for beginners" and "Egyptian Arabic
course". An ordered path (alphabet → 100 words → greetings → present tense → first conversation),
each step linking to the free page that teaches it, with the tutor and lessons as the paid step.
Do **not** create a separate `/learn-egyptian-arabic` — `/egyptian-arabic` already carries that
title and its ranking history; a twin would split the equity.

Content copy for both should go through the `human-writing` skill before commit, and follow the
`ai-copy-branding` rule: no "AI" in body copy, but "AI Arabic Tutor" stays in titles and meta on
search-facing pages per the decision already recorded in `docs/seo-search-demand-plan.md:19`.

---

## Phase 4 — Two blog posts (and the ones we deliberately don't write)

`docs/blog-posts-search-demand-plan.md` already plans five posts, two of which are written but
uncommitted (`arabic-games`, `learning-arabic-with-ai`). Its division of labour holds here:
**pages answer "give me the thing", posts answer "explain this to me"**. Applied to the Egyptian
cluster, most of the target queries want a page, and adding a post for each would cannibalize the
page we just built:

| Query | Gets | Why not a post |
|---|---|---|
| Egyptian Arabic numbers | page only | The table *is* the answer. A post would compete with it. |
| Egyptian Arabic pronunciation | page only | Same — plus the page has audio, which a post can't beat. |
| Egyptian Arabic for beginners / course | page only | `/egyptian-arabic/beginners` already reads as editorial. |
| Egyptian Arabic vs MSA | page + existing Post 3 | Post 3 ("which Arabic should you learn?") covers the four-way version. Don't add a pairwise post on top. |

Two posts do earn a slot, because neither has a page that could serve the intent:

**Post A — "How many Egyptian Arabic words do you actually need?"**

The one post nobody else can write, because it needs the corpus. Computed from
`src/lib/constants/common-words.ts` (2,404 entries over a 29.3M-token corpus):

| Top N words | Cumulative coverage |
|---:|---:|
| 10 | 16.7% |
| 100 | 44.9% |
| 500 | 70.6% |
| 1,000 | 83.1% |
| 2,404 | 100% |

The honest version is the interesting one. The top 20 is من، في، يا، الله، مش، بس، اللي، والله،
يارب، ربنا، حبيبي — function words and invocations of God. So: the first 100 words buy you nearly
half of everything said and you cannot study any of them as vocabulary, because they're grammar;
the useful band starts around rank 150 and thins out fast; and the corpus itself has a register
(that top 20 is song lyrics and social media, not conversation), which is why topic lists beat
frequency lists past the first few hundred words. Flag the data noise too — rank 15 is علي parsed
as a name rather than على.

Targets "how many arabic words do i need", "most common egyptian arabic words", "egyptian arabic
word list", "basic egyptian arabic vocabulary". Links to
`/egyptian-arabic/vocabulary/most-common` (the list itself) and the topic pages (the useful band).

**Post B — "Franco Arabic: why Egyptians write 3, 7 and 2 in text messages"**

Direct sequel to `/blog/writing-arabic-in-english`, which the blog plan records at position 7.6 —
the format is proven for this site. Explains the numeral-for-pharyngeal convention (3 = ع, 7 = ح,
2 = hamza, 5/kh = خ, 9 = ص), where it came from, why it survives when everyone has an Arabic
keyboard, and where it's inconsistent. Every one of the 2,404 words already carries a `franco`
field, so the examples come straight from the data the vocabulary pages render.

Targets "franco arabic", "arabic chat alphabet", "what does 3 mean in arabic", "arabizi". Links to
`/keyboard`, `/blog/writing-arabic-in-english`, `/alphabet`, and the vocabulary pages.

**Build**, per `docs/blog-posts-search-demand-plan.md:244-249`: a route under
`src/routes/blog/<slug>/` with `+page.svelte` and a `+page.ts` doing the `blogPosts.find(...)`
lookup, plus an entry in `src/lib/constants/blog-posts.ts`. The index and sitemap both read from
that constant, so nothing else needs touching. Run both drafts through the `human-writing` skill
before commit.

Order: Post A after Phase 2 ships (it needs `/egyptian-arabic/vocabulary/most-common` to link to),
Post B any time — it has no dependencies.

---

## Phase 5 — Wiring

- **`src/lib/utils/seo.ts`** — add `vocabulary-hub`, `vocabulary-topic`, `pronunciation`,
  `beginners` to `getPageMeta`, and the matching branches in `resolvePageKey` (the
  `parts[0] === 'egyptian-arabic'` chain around line 481). Titles lead with the query:
  `Egyptian Arabic Numbers — 1 to 100 with Audio | Parallel Arabic`.
- **Structured data** — `DefinedTermSet` on topic pages, `BreadcrumbList` on all of them, matching
  what word and phrase pages already emit.
- **`src/routes/sitemap.xml/+server.ts`** — add the hub, every topic, and the two hand-written pages,
  following the existing word/phrase loops (lines 131-185).
- **Internal links** — add the vocabulary hub to
  `DIALECT_LANDING['egyptian-arabic'].extraLinks` (currently only conjugations,
  `src/lib/constants/dialect-landing.ts:74-82`), to `Footer.svelte`, and to `static/llms.txt`.
- **`sections.ts` cleanup** — drop `crime_and_punishment` and `technology` (no rows in the table)
  and fix the counts. Low priority, but it currently feeds wrong word counts into the
  `/learn/game` category dropdown.

---

## Verification

```bash
npm run build
npm run lint && npm run check
```

- Every new URL prerenders: `ls .svelte-kit/output/prerendered/pages/egyptian-arabic/vocabulary/`
- Exactly one `<title>` per page and a self-referencing canonical — the Phase 0 regression the
  earlier plan fixed:
  `grep -c '<title>' .svelte-kit/output/prerendered/pages/egyptian-arabic/vocabulary/*.html`
- `curl localhost:5173/egyptian-arabic/vocabulary/numbers` with no cookies shows the **full** word
  table in the HTML — same content a logged-out human sees. Serving crawlers more than users is
  cloaking; serving them less is what tanked the story pages.
- `curl localhost:5173/sitemap.xml | grep -c '<loc>'` — up by hub + topics + 2.
- Playwright spec in `tests/`: load a topic page anonymously, complete a full 8-question round
  without hitting a gate, then assert `PaywallModal` opens on the "practice all" CTA. Run it twice —
  once granting the mic, once denying it — and assert the round still completes 8 questions when
  denied.
- Speaking limit: fire more than 4 transcription requests from one session and confirm the 5th is
  refused by the rate limit rather than billed.
- **`/learn/game/play` still behaves identically** after the extraction — play one round in each of
  multiple-choice, listening and speaking mode, and confirm speaking still passes at 60% for a word
  and 50% for a sentence. This is the regression risk in Phase 1; a unit test on
  `scorePronunciation` with a handful of known target/transcript pairs is cheap insurance.
- Manual: confirm no page emits a `media.lingualism.com` URL —
  `grep -r 'lingualism' .svelte-kit/output/prerendered/` must be empty.
- Both posts appear in `/blog` and in `curl localhost:5173/sitemap.xml | grep blog`, and the
  coverage figures in Post A are regenerated from `common-words.ts` at write time rather than
  copied from this plan.

**Outcome to measure in GSC at 4–8 weeks**, before templating this across the other three dialects:
first clicks on "egyptian arabic numbers", "egyptian arabic vocabulary" and "egyptian arabic
pronunciation" (all zero today), the vocabulary topic pages indexed at all, and — the real
question — whether the CTA on the 250 existing word pages produces any signups.
