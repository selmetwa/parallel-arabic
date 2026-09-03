# Blog plan: 5 posts against real Search Console demand

Source: `parallel-arabic.com-Performance-on-Search-2026-09-02` (Web, last 12 months).

## How to read the numbers

Site totals for the period: **46,689 impressions, 1,337 clicks, 2.86% CTR**. But `Queries.csv`
only accounts for **8,782 impressions / 439 clicks** — Google anonymises the rest of the long
tail. Every cluster figure below is therefore a **floor**, not a total. Clusters made mostly of
rare long-tail phrasings (keyboard, "X in Egyptian Arabic") are understated the most: the
`/keyboard` page alone shows 4,198 impressions in `Pages.csv` while every keyboard query visible
in `Queries.csv` sums to 416.

Spam and scraper noise excluded throughout: mojibake rows (`ÿßÿñÿö…`, ~50 rows), the
`-site:reddit.com -site:twitter.com…` operator strings, `arabic porno`, and the branded
`parallel arabic` / `sherif elmetwally` rows.

## Cluster map

| Cluster | Queries | Impr | Clicks | Wtd. position | Has a page? |
|---|---:|---:|---:|---:|---|
| AI tutor | 48 | 2,029 | 45 | 10.1 | `/tutor` — 10,591 impr, **2.43% CTR**, pos 7.5 |
| Alphabet | 91 | 904 | 21 | 12.0 | `/alphabet` + blog post, pos 8–9 ✅ |
| Egyptian words/phrases | 80 | 704 | 5 | 11.9 | phrase/word pages (Phase 2 of the SEO plan) |
| Levantine | 69 | 690 | 2 | 19.0 | `/levantine` — 647 impr, 2.01% CTR, **pos 20.7** |
| Keyboard | 61 | 416* | 2 | 16.4 | `/keyboard` — 4,198 impr, **0.81% CTR** |
| Games | 35 | 397 | 5 | **22.2** | `/learn/game` — 3,001 impr, pos 9.6 |
| Fusha / "which dialect" | 36 | 315 | 3 | **28.0** | `/fusha` — 419 impr, 0.72% CTR, pos 20.9 |
| Anki | 20 | 147 | 3 | 9.6 | `/anki-decks`, `/egyptian-arabic/anki-decks` |

\* understated, see above.

### Division of labour with `docs/seo-search-demand-plan.md`

That plan already covers programmatic pages (phrases, words, conjugations, comparisons) and
rebuilding `/learn/game`, `/keyboard`, `/levantine`, `/fusha`. **This plan does not duplicate it.**
The split:

- **Product/tool pages** answer *"give me the thing"* — the keyboard, the game, the word list.
- **Blog posts** answer *"explain this to me"* and *"which one should I pick"* — intents Google
  will not rank a tool page for, and which feed links down into the tool pages.

Where a post depends on a Phase-2 page existing, it's noted.

---

## Post 1 — Can AI actually teach you Arabic?

**Cluster: 2,029 impressions, 45 clicks, weighted position 10.1.** Biggest opportunity on the
site by a factor of two.

| Query | Impr | Pos |
|---|---:|---:|
| ai arabic tutor | 686 | 5.5 |
| arabic ai tutor | 325 | 4.8 |
| **learn arabic with ai** | **250** | **22.1** |
| **speak arabic with ai** | **172** | **8.4** (0 clicks) |
| ai tutor arabic | 142 | 5.0 |
| ai arabic teacher | 76 | 5.5 |
| arabic speaking ai | 54 | 17.6 |
| ai arabic tutor free | 44 | 5.5 |
| arabic language ai platform | 29 | 25.1 |
| arabic chatbot | 24 | 44.2 |

The tool queries (`ai arabic tutor`) already rank ~5 via `/tutor`. The **informational** half does
not: `learn arabic with ai` at 22.1 and `arabic language ai platform` at 25.1 are the gap, and
`speak arabic with ai` has 172 impressions at position 8.4 with **zero clicks** — a title/snippet
that isn't answering the question.

**Angle.** Honest and specific, not a product page in prose. What an LLM tutor is genuinely good
at (unlimited patience, dialect-specific correction on demand, speaking practice without a human
present) and where it fails (hallucinated vocabulary, defaulting to Fusha when you asked for
Egyptian, no accountability, pronunciation feedback that flatters you). Then: how to actually
structure a session with one. `/tutor` is the worked example, linked from the middle and end.

**Target title:** "Learning Arabic with AI: what works, what doesn't" — carries `learn arabic
with ai` and `speak arabic with ai` without keyword-stuffing.

**Internal links:** `/tutor` (primary), `/speak`, `/lessons`, `/pricing`.

**⚠️ Decision needed before writing.** 74 impressions of free-intent queries — `ai arabic tutor
free` (44 impr, pos 5.5), plus `are any of these free?`, `is it free`, `which ones are completely
free?`, `what does it cost` (these short conversational ones are AI-Overview follow-ups). Meanwhile
`free-trial-migration-plan.md` moves the site to **card-up-front 7-day trial**. The post cannot
say "free" if that ships. Either write it against the post-migration reality ("7 days, card up
front, full access") or hold the free-tier framing until the model is settled. Say the real thing
either way — a bait-and-switch on this query converts once and burns the domain.

**Branding note:** `docs/seo-search-demand-plan.md` already decided "AI" is allowed in
`<title>`/meta/H1 on search-facing pages, overriding the general in-app AI-free copy rule. The
blog is search-facing, so this post uses it freely.

---

## Post 2 — Arabic games that are actually worth your time

**Cluster: 397 impressions, 5 clicks, weighted position 22.2.** The worst-ranked cluster with real
volume — nearly every head term sits on page 2–4.

| Query | Impr | Pos |
|---|---:|---:|
| arabic language games | 82 | 26.0 |
| arabic games | 47 | 23.9 |
| arabic word games | 29 | 28.1 |
| games in arabic language | 24 | 20.2 |
| arabic games online | 20 | 29.1 |
| arabic learning games | 20 | 35.0 |
| arabic games for adults | 13 | 12.5 |

`/learn/game` ranks 9.6 overall but 23.9 for the head term `arabic games` — it's picking up
narrow queries (`arabic vocabulary games` 8.5, `arabic words game` 7.7) and losing broad ones.
Google reads "arabic games" as a **roundup** intent, and a single product page can't win it.

**Angle.** A genuine roundup, including things you don't own — Influent, Drops, Clozemaster,
Digital Dialects (which shows up as its own query at 34.0), Arabic Scrabble/Kalimat. Then a
section on what a vocabulary game has to do to actually teach (spaced repetition, sentence
context, audio) that positions `/learn/game`. Include `arabic games for adults` (12.5) explicitly —
that query is people escaping a market full of children's apps, and it's a real segment.

**Depends on:** Phase 2e's `/learn/game` rebuild. Ship the hub first so the post has somewhere
credible to send people.

**Internal links:** `/learn/game`, `/vocabulary`, `/challenge`, `/alphabet/practice`.

---

## Post 3 — Fusha, Egyptian, Levantine, Darija: which Arabic should you learn?

**Cluster: 315 impressions, 3 clicks, weighted position 28.0.** Worst average position on the
board, and the intent is purely definitional — exactly what a blog post beats a landing page at.

| Query | Impr | Pos |
|---|---:|---:|
| fusha arabic | 75 | 33.5 |
| fusha dictionary | 57 | 9.0 |
| fusha in arabic | 42 | 25.1 |
| levantine dialect | 41 | 33.8 |
| arabic fusha | 22 | 39.0 |
| fusha | 11 | 44.3 |
| what is fusha arabic | 8 | 39.8 |
| what is levantine arabic | 6 | 36.8 |
| which arabic dialect is closest to fusha | 2 | 29.5 |

`/fusha` and `/levantine` both rank ~21 on shared boilerplate. Nobody searching "what is fusha
arabic" wants a vocabulary tool — they want the answer, then a next step.

**Angle.** Answer-first: Fusha is the written/formal register nobody speaks at home; the dialects
are what people actually speak; you need both eventually and the order depends on why you're
learning. Then a comparison table (same 5 sentences across all four), the mutual-intelligibility
reality, and a decision guide by goal — Quran/news/academia → Fusha, family in Cairo → Egyptian,
Beirut/Amman/Damascus → Levantine, Morocco → Darija.

This is also the highest-value post for AI citation. `what is fusha arabic` and `which arabic
dialect is closest to fusha` are precisely the questions AI Overviews synthesise, and the site is
already showing up in explicitly citation-shaped queries (see Post 4).

**Internal links:** `/fusha`, `/egyptian-arabic`, `/levantine`, `/darija`, and the `/{a}-vs-{b}`
comparison pages from Phase 2d.

---

## Post 4 — How to say hello in Levantine Arabic

**Greetings sub-cluster: 259 impressions, 1 click, weighted position 8.6.** Broader Levantine
cluster: 690 impressions, 2 clicks, position 19.0.

| Query | Impr | Pos |
|---|---:|---:|
| hello in levantine arabic | 72 | 8.6 |
| hello in syrian arabic | 36 | 9.1 |
| how are you in levantine arabic | 35 | 8.8 |
| how to say hello in syrian arabic | 23 | 9.1 |
| levantine arabic marhaba hello **source** | 19 | 5.5 |
| levantine arabic greetings | 16 | 9.2 |
| coffee in levantine arabic | 14 | 10.1 |
| levantine arabic hello marhaba thank you shukran **source** | 7 | 7.6 |
| levantine arabic how are you keefak keefik **source** | 7 | 7.7 |

Ranking 8–9 across the board, essentially zero clicks. Something *is* ranking; it just isn't a
page built to answer this.

**The `source` suffix is the interesting signal.** Seven queries (50 impressions, avg position
7.1) end in the literal word "source" — `levantine arabic marhaba hello source`, `arabic
diacritics fatha kasra damma source`, `arabic alphabet 28 letters source educational site`. Those
are not humans. They're LLMs and AI agents hunting for a citable reference, and the site is
already position ~7 for them. A page structured for citation — one claim per paragraph, explicit
"in Lebanon they say X, in Syria Y", Arabic + transliteration + literal gloss side by side —
converts that into actual citations.

**Angle.** Complete greeting inventory with register and geography: `marhaba` / `ahlan` /
`marhabtayn` reply / `keefak` vs `keefik` gendered forms / `sabah el-kheir` and its `sabah
el-noor` reply / `shu akhbarak` / regional splits between Lebanese, Syrian, Palestinian, Jordanian.
Audio on every phrase.

**Overlap check:** Phase 2b of the SEO plan builds `/{dialect}/phrases/greetings`. That's a
drill/practice page. This post is the explainer that ranks for the "how do I say" phrasing and
funnels into it — write the post *after* the phrase pages exist, and link them tightly.

**Internal links:** `/levantine`, `/levantine/phrases/greetings`, `/levantine/vocab`, `/tutor`.

---

## Post 5 — Harakat: the Arabic vowel marks, and how to type them

**Diacritics sub-cluster: 101 impressions, 0 clicks, weighted position 12.0.** Understated —
`/keyboard` carries 4,198 impressions at **0.81% CTR**, the single worst click-through on the site.

| Query | Impr | Pos |
|---|---:|---:|
| arabic diacritics keyboard | 64 | 8.8 |
| arabic diacritics fatha kasra damma **source** | 8 | 9.4 |
| add diacritical marks to arabic text online | 7 | 15.3 |
| arabic keyboard with vowels | 6 | 41.8 |
| arabic keyboard with harakat online | 3 | 9.0 |
| tashkil online | 3 | 7.7 |
| shadda in arabic keyboard | 1 | 9.0 |

Two intents are tangled here. "Give me a tool that types harakat" belongs to `/keyboard`. "What
*are* fatha, kasra, damma, shadda, sukun and when do I write them" is a post — and it's the half
scoring position 41.8 (`arabic keyboard with vowels`) and 15.3.

**Angle.** Direct sequel to the existing `/blog/writing-arabic-in-english` (487 impr, pos 7.6 —
proves this register works for the site). Each mark: what it does, what it looks like, an example
minimal pair, the keystroke on the site's keyboard. Then the part learners actually need: native
text almost never shows harakat, here's how you read without them, and here's where they *are*
mandatory (Quran, children's books, ambiguous names, dictionary entries).

**Internal links:** `/keyboard`, `/blog/writing-arabic-in-english`, `/alphabet`,
`/alphabet/practice/keyboard`.

---

## Runners-up (not in the five)

- **Anki decks guide** — 147 impressions, position **9.6**, the best-ranked cluster on the board
  with no editorial page. `anki deck "egyptian arabic 1000 most common"` (21 impr, pos 6.2) is
  someone describing a deck the site could ship. `/anki-decks` and the `/api/anki-export` endpoint
  already exist. Cheapest win here, but the ceiling is low — cut for volume, not quality.
- **How Arabic letters connect** — only 22 impressions but positions of 70, 92, and 96 on
  `connecting arabic letters`, `arabic letters connected forms`, `connect arabic letters`. Real
  topical gap; the volume in the export is too thin to justify a slot, though the anonymised tail
  likely hides more.

## Build notes

Each post is a route under `src/routes/blog/<slug>/` with a `+page.svelte` and a `+page.ts` that
does the `blogPosts.find(...)` lookup — same shape as the two existing posts. Register metadata in
`src/lib/constants/blog-posts.ts`; the index page and `src/routes/sitemap.xml/+server.ts` both read
from there, so nothing else needs touching for indexation.

Blocked on Phase 0 of `docs/seo-search-demand-plan.md`: until the `currentPage` chain in
`src/routes/+layout.svelte` is fixed, unmatched routes emit the homepage title, description, **and
canonical**. Blog routes are matched today, but verify each new slug lands in the lookup before
shipping — a wrong canonical makes the post invisible.

Add `/blog` to `static/llms.txt` (Phase 3 already calls for this). Given the `source`-suffix
queries, it earns its place.

## Suggested order

1. **Post 1 (AI tutor)** — 5× the volume of anything else, and `/tutor` is already the site's
   highest-impression page. Resolve the free/trial question first.
2. **Post 3 (which dialect)** — no dependencies, worst positions, best AI-citation upside.
3. **Post 5 (harakat)** — no dependencies, rescues the site's worst CTR page, and the sibling post
   already proves the format ranks.
4. **Post 4 (Levantine greetings)** — after Phase 2b phrase pages land.
5. **Post 2 (games)** — after the Phase 2e `/learn/game` rebuild.

## Verification

Not "did we publish" — these:

- Each post indexed within 2 weeks (`site:` check or GSC URL inspection).
- Its head term moves off page 2: `learn arabic with ai` 22 → <10; `arabic games` 24 → <10;
  `fusha arabic` 33 → <15.
- `/keyboard` CTR moves off 0.81%.
- The zero-click ranked queries (`speak arabic with ai` 8.4, `hello in levantine arabic` 8.6)
  start producing clicks — that's the real test, since position was never the problem there.
