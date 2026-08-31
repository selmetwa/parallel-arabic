# SEO: align parallel-arabic with actual search demand

## Context

Six months of Search Console data (Mar–Aug 2026) shows a site that **ranks but doesn't get clicked**:

| | Mar | Aug |
|---|---|---|
| Impressions | 3,815 | 8,334 |
| Clicks | 151 | 186 |
| CTR | **3.96%** | **2.23%** |

Impressions more than doubled; clicks barely moved. Average position is 7–9 across the site — Google likes the pages, users don't click them. That is a metadata and content-match problem, not a ranking problem.

Investigation found a concrete root cause in `src/routes/+layout.svelte`, plus large uncaptured query clusters that the codebase has the data to serve but no pages for.

### Decisions taken

- Use "AI" in `<title>` / meta description / H1 on search-facing pages only; keep in-app product copy AI-free (per existing branding preference).
- Enrich `/generated_story/*` rather than noindexing them.
- Full programmatic build.

---

## What the data actually says

**Root cause of the CTR collapse — one bug.** `currentPage` (`src/routes/+layout.svelte:221-261`) is a path-matching `if`-chain that ends `return 'home'`. Every unmatched route emits the **homepage title, homepage description, and `<link rel="canonical" href="https://www.parallel-arabic.com">`**. Verified in build output (`.svelte-kit/output/prerendered/pages/mobile-app.html`).

Affected pages and what it costs:

| Page | Impressions | CTR | Position |
|---|---|---|---|
| `/keyboard` | 3,436 | 0.73% | 10.7 |
| `/mobile-app` | 1,516 | 0.99% | **4.4** |
| `/learn/game` | 2,758 | 4.75% | 9.7 |
| `/egyptian-arabic/conjugations/*` (70 URLs) | 2,240 | 1.03% | **6.6** |
| `/conjugations`, `/sentences`, `/learn`, `/practice`, `/explore`, `/videos-new`, `/{dialect}/vocab`, `/{dialect}/write` | — | — | — |

`/mobile-app` sits at position 4.4 with a 0.99% CTR because its title says "Parallel Arabic - Learn Arabic Dialects Online".

**Three more confirmed bugs:**

1. **Duplicate `<title>` tags.** The layout's `<svelte:head>` (line 380) renders before `{@render children()}` (line 516), so the 16 pages that write their own `<svelte:head><title>` ship *two* titles with the generic one first. Their titles are dead code. Confirmed in `.svelte-kit/output/server/entries/pages/_layout.svelte.js` (head at 676, children at 712).
2. **`/alphabet` 307-redirects to a `noindex` page.** `src/routes/alphabet/+page.ts` redirects to `/alphabet-new`, which is the only `noindex: true` entry in `seo.ts`. `/alphabet` is your 4th-best page (2,189 imp, 90 clicks, 4.11% CTR) and ranks #5 for "interactive arabic alphabet" — currently pointing at an uncrawlable destination. Also, the `alphabet` meta hardcodes `url: ${baseUrl}/alphabet/learn`, so all four `/alphabet/*` pages canonicalize to one URL.
3. **Googlebot sees one sentence per story.** `src/routes/generated_story/[id]/+page.svelte:53,187` — `visibleSentences = canReadFull ? sentences : sentences.slice(0, 1)`. Anonymous crawler → `isSubscribed === false` → title + 1 sentence + paywall. 849 URLs indexed as near-duplicate thin pages, all in the sitemap at priority 0.7, with no paywall structured data. **7,294 impressions → 49 clicks (0.67%).** This single group is what dragged sitewide CTR from 4% to 2.2%.

**Uncaptured demand (all zero-click, positions 5–11, so Google already thinks you're relevant):**

| Cluster | Impressions | Clicks | Data already in repo |
|---|---|---|---|
| AI tutor / learn Arabic with AI / speak Arabic with AI | 1,811 | 39 | `/tutor` exists, ranks 7.8 |
| Greetings — "hello in levantine arabic", "how are you in levantine arabic", "marhaba", "kifak" | 237 | 1 | `tutor-scenarios.ts` → `greetings`, `introducing-yourself` |
| "Happy birthday in Arabic" (Arabic + English variants) | 153 | 1 | none |
| Word lookups — ممطر, اخد, جه, "coffee in egyptian arabic", "busy in egyptian arabic" | ~1,000 | 0 | `common-words.ts` (16,830 lines, frequency-ranked) |
| Games — "arabic games", "arabic language games", "arabic word game" | 388 | 5 | `/learn/game` exists, ranks 21.8 |
| Keyboard — "arabic virtual keyboard", "arabic diacritics keyboard" | 300 | 1 | `/keyboard` exists, ranks 15.7 |
| Levantine | 636 | 2 | `/levantine` ranks 20.3 |
| Fusha | 162 | 1 | `/fusha` ranks 23.4 |

**Ignore this:** "parallel in arabic" / "parallel meaning in arabic" / "parallelism in arabic" = 863 impressions, 0 clicks. People looking up the English word "parallel". Brand-name homonym, not addressable demand. Real brand traffic is "parallel arabic" (426 imp, 61% CTR).

**Also:** 8 non-www URLs indexed separately (409 imp) — apex domain isn't redirecting to `www`.

---

## Phase 0 — Fix the metadata pipeline

(First step on execution: copy this plan to `docs/seo-search-demand-plan.md` so it lives in the repo.)

This is the prerequisite for everything else; it also unblocks ~9,000 impressions/6mo of currently-miscanonicalized pages.

**`src/routes/+layout.svelte`**

Replace the path-matching chain with a data-driven lookup, extending the pattern the blog already uses (`src/routes/blog/*/+page.ts` returns `{ blogPost: {...} }` which the layout reads):

- Layout prefers `$page.data.seo` when a route's `load` provides it; falls back to `getPageMeta(key)` for static routes; falls back last to a **path-derived self-canonical** — never the homepage. Set `noindex` rather than a homepage canonical for genuinely unmapped paths.
- Delete the 16 dead per-page `<svelte:head>` blocks (`learn/game`, `conjugations`, `egyptian-arabic/conjugations/**`, `map`, `explore`, `learn`, `practice`, `videos-new`, `faq`, `self-study/**`, `challenge/[id]`, `auth/reset-password`) and move their titles into the `seo` object returned from each route's `load`. This removes the duplicate-`<title>` bug by construction rather than by render-order luck.

**`src/lib/utils/seo.ts`** — add keys for every currently-unmapped indexable route, and rewrite titles to match the query language people actually use:

| Route | Title |
|---|---|
| `/tutor` | `AI Arabic Tutor — Speak Arabic with AI \| Parallel Arabic` |
| `/keyboard` | `Arabic Keyboard Online — Type Arabic with Diacritics \| Parallel Arabic` |
| `/learn/game` | `Arabic Games — Free Vocabulary & Word Games \| Parallel Arabic` |
| `/mobile-app` | `Parallel Arabic Mobile App — Learn Arabic on iOS & Android` |
| `/alphabet` | `Interactive Arabic Alphabet — Learn All 28 Letters \| Parallel Arabic` |
| `/egyptian-arabic/conjugations/[verb]` | `{verb} ({transliteration}) — Egyptian Arabic Conjugation \| Parallel Arabic` |
| `/levantine`, `/fusha`, `/darija`, `/egyptian-arabic` | per-dialect, **not** the current shared template (all four descriptions are currently identical) |

`/mobile-app` at position 4.4 is the fastest single win here — a correct title should take it from ~1% to 5–8% CTR on 1,516 impressions with no ranking change.

**`src/routes/alphabet/+page.ts`** — delete the 307. Serve the `/alphabet-new` content at `/alphabet` (the URL with the ranking history) and remove `noindex` from that content. Give `/alphabet/learn` and `/alphabet/practice/*` their own self-canonicals instead of all pointing at `/alphabet/learn`.

**Non-www:** add an apex→www 308 redirect. Preferred in Vercel domain settings; alternatively in `src/hooks.server.ts`.

**Add explicit `noindex`** (meta, not just robots.txt) to `/map`, `/profile/**`, `/leaderboard`, `/history`, `/self-study/**`, `/challenge/[id]`, `/about-old`, `/alphabet-new` (once its content lives at `/alphabet`).

---

## Phase 1 — Make story pages answer the query

849 URLs, 7,294 impressions, avg position 8.1. They rank for word and phrase lookups; they just show a paywall.

**`src/routes/generated_story/[id]/+page.svelte`**

- Free for everyone (not just crawlers — serving crawlers more than users is cloaking and will get you penalized): full Arabic + transliteration + English for the **whole story**, plus the key-vocabulary glossary. Gate audio, the quiz, XP/progress tracking, and "create your own story" behind the subscription. The story text is AI-generated and infinitely reproducible; the tooling around it is the product.
- Add a **vocabulary glossary table** (Arabic / transliteration / English) rendered server-side. This is what makes ممطر, اخد, جه resolve to a page that actually answers.
- Add internal links: → the word page for each glossary entry (Phase 2), → the dialect hub, → the topic hub.

**`src/lib/utils/seo.ts`** — extend the `generated_story` `Article` JSON-LD with `isAccessibleForFree` and `hasPart` + `cssSelector` for whatever stays gated (Google's documented paywalled-content markup).

**`src/routes/sitemap.xml/+server.ts`** — apply the existing `BLOCKED_STORY_IDS` filter from `src/lib/constants/stories/blocked.ts` (currently applied on `/stories` but not in the sitemap), and add a minimum-length/quality filter so only substantial stories are submitted.

---

## Phase 2 — Programmatic pages

Extend the pattern that already works best on this site: `/egyptian-arabic/conjugations/[verb]` — static JSON in the repo, generated by a script, SSR'd from a dynamic import. Those 70 URLs hold the site's **best average position (6.6)** despite emitting the homepage title and being absent from the sitemap.

**2a. Re-enable conjugations (free win, do first).**
`src/routes/sitemap.xml/+server.ts:4-5` has `const verbIndex = { verbs: [] }` with a stale comment claiming the JSON was removed. `src/lib/data/verb-conjugations/egyptian-arabic/index.json` exists with all 72 verbs. Restore the import, add real meta (Phase 0), and add `export const prerender = true` + `entries()` to `[verb]/+page.server.ts` — the data is fully static, there's no reason to SSR it per request.

**2b. Phrasebook — `/{dialect}/phrases/[slug]`.**
`src/lib/constants/tutor-scenarios.ts` already holds 10 scenarios × up to 4 dialects of hand-written bilingual dialogue (`greetings`, `introducing-yourself`, `ordering-coffee`, `talking-about-family`, `asking-directions`, `asking-price`, `at-the-restaurant`, `telling-time`, `ordering-taxi`, `asking-for-help`). These map almost one-to-one onto the zero-click greeting and phrase clusters. ~40 pages from data that already exists.

Add a second, smaller set of **single-phrase** pages driven directly off the GSC zero-click list — "hello", "how are you", "thank you", "happy birthday", "good morning", "coffee", "busy" × 4 dialects. Store as `src/lib/constants/phrases/{dialect}.ts` with `{ slug, english, arabic, transliteration, franco, literal, variants[], usageNotes, relatedScenario }`. Generate with a script modeled on `scripts/generate-verb-conjugations.ts` (same Gemini + Zod-schema approach), reviewed by hand before commit.

Each page: the phrase large and diacritized, audio, transliteration + franco, 2–3 example sentences in context, how the other three dialects say it, links to the scenario page and the tutor.

**2c. Word pages — `/{dialect}/word/[slug]`.**
`src/lib/constants/common-words.ts` (303 KB, frequency-ranked Egyptian: `{ _id, word, appeared, en, franco }`) is the largest untapped asset. This targets the ~1,000 impressions of Arabic-script and "X in Arabic" lookup queries.

**Gate hard on quality, or this repeats the story-page mistake.** Ship only words that have: frequency above a threshold (start with the **top 500**, not 16,830), at least two real example sentences pulled from the story/lesson corpus, and — for verbs — a link to the existing conjugation page. Measure indexation and CTR on the first 500 before expanding.

**2d. Dialect comparison — `/{a}-vs-{b}`.**
6 pages from `src/lib/data/dialect-rules-v2.ts`. `/api/compare-dialects` already exists with no page behind it.

**2e. Rebuild the three weak landing pages** — real above-the-fold content, not just new titles:
- `/learn/game` — currently ranks 21.8 for "arabic games" (388 imp cluster). Needs a proper games hub listing each mode as its own linked, described section.
- `/keyboard` — 3,436 impressions at 0.73%. Needs on-page content for "arabic diacritics keyboard" and "arabic virtual keyboard": a diacritics/harakat guide, transliteration table, copy-paste examples.
- `/levantine` and `/fusha` — ranking 20.3 and 23.4 on a shared boilerplate description. Give each real dialect-specific content and link them into the new phrase/word pages.

---

## Phase 3 — Sitemap, robots, llms.txt

**`src/routes/sitemap.xml/+server.ts`**
- Restore verb conjugation URLs; add all Phase 2 routes.
- Add `<lastmod>` to static entries (currently absent everywhere except DB rows).
- Drop `/videos-new`, `/leaderboard`, `/map` and anything now `noindex`.
- Add the static stories at `/stories/[story]` (`src/lib/constants/stories/*.ts`) — currently missing entirely.
- It rebuilds on every request with three unbounded Supabase `select`s. With Phase 2 this needs either a longer cache or a sitemap index split by section.

**`static/robots.txt`** — remove the contradictory `Disallow: /review/` + `Allow: /review` pair and the ~20 redundant `Allow:` lines (they do nothing under `Allow: /`).

**`static/llms.txt`** — add `/blog`, `/conjugations`, `/egyptian-arabic/conjugations`, and the new phrase/word hubs.

**Structured data (`src/lib/utils/seo.ts`)** — every page currently emits the same `WebApplication` blob. Add `Organization` + `WebSite`/`SearchAction` sitewide, `BreadcrumbList` on all programmatic pages, `FAQPage` on `/faq` (the Q&A content is already there), and `DefinedTerm` on word/phrase pages.

---

## Verification

**Phase 0 — must pass before anything ships:**
```bash
npm run build
grep -o '<link rel="canonical"[^>]*>' .svelte-kit/output/prerendered/pages/mobile-app.html
# expect .../mobile-app — NOT the bare homepage
grep -c '<title>' .svelte-kit/output/prerendered/pages/*.html   # expect exactly 1 each
```
Then `npm run dev` and curl the SSR HTML for `/keyboard`, `/mobile-app`, `/learn/game`, `/egyptian-arabic/conjugations/gara`, `/alphabet` — assert a unique title, a unique description, and a self-referencing canonical on each. Worth adding as a Playwright spec in `tests/` so it can't regress.

**Phase 1:** `curl` a story URL with no cookies and confirm the full Arabic + English + glossary is in the HTML, and that the same content is visible to a logged-out human in the browser. Validate the `Article` JSON-LD in Google's Rich Results Test.

**Phase 2:** `curl /sitemap.xml | grep -c '<loc>'` before/after; spot-check that every new URL 200s and has unique meta. Run `npm run lint` and `npm run check`.

**Outcome (4–8 weeks post-deploy, in GSC):**
- Sitewide CTR back above 3.5% — the primary metric.
- `/mobile-app`, `/keyboard`, `/learn/game`, and the 70 conjugation URLs each above 3% CTR.
- `/generated_story/*` above 2% CTR (from 0.67%).
- First clicks recorded on the greetings, birthday, and word-lookup clusters, which are at zero today.
- Conjugation pages appearing in the indexed-pages report at all.

Track it by re-exporting Search Console monthly and re-running the same comparison.
