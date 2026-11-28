# SEO push: 9 blog posts, dialect translator pages, landing page updates

## Context
DataForSEO research (US volumes) found low-difficulty searches the site doesn't cover yet. Three workstreams come out of it:
1. **9 blog posts** going after informational searches (numbers, wallah, habibi, slang, Darija words, Egyptian phrases, two "is X different" questions, Levantine vs Egyptian).
2. **Free translator pages** for "egyptian arabic translator" (~1.6–1.9k), "darija translator" (1.6k), "english to moroccan darija" (720) and "levantine arabic translator" (390). People searching these want a tool, and the tool leads into signup.
3. **Updates to existing landing pages** for "gulf arabic dialect" (880), "darija language" (1k) / "what is darija" (140), and "what is levantine arabic" (170) / "where is levantine arabic spoken" (70).

A copy of this plan goes to `docs/seo-keyword-push-plan.md`, per the repo convention.

## Decisions I'm taking unless you say otherwise
- **Three PRs off `master`**, one per workstream: `seo-blog-posts`, `dialect-translator`, `landing-seo-updates`. All phases run without check-ins.
- **I write all post content myself** (no Gemini scripts), using the house transliteration (3 = ع, 7 = ح, 2 = ء) and the house tone. Copy never says "AI".
- **Translator limits:** anonymous visitors get **5 translations a day**, tracked with a signed cookie. After that a signup prompt appears, and signed-in users are unlimited. You add a **Vercel Firewall rate-limit rule** on `/api/translate` (about 20 requests/min per IP) in the dashboard, because the codebase has no rate limiter and a free tool open to anonymous visitors needs one. I'll give you the exact rule settings.
- **Translator for all 7 dialects** through one generic route. It costs nothing extra, but SEO copy is written only for Egyptian, Darija and Levantine. The other 4 get short generic copy.

## 1. Blog posts
**Pattern to copy:** `src/routes/blog/hello-in-levantine-arabic/` (`+page.ts` with prerender and the `blogPost` load, and `+page.svelte` wrapped in `BlogArticle`). Add each post's metadata to the top of `src/lib/constants/blog-posts.ts`. The sitemap and blog index read from that file, so neither needs editing. Where audio exists (`canSpeak` / the `GAME_DIALECTS` in `src/lib/games/themes.ts`), embed `BlogGame` + `MemoryPairs`, built the same way as the `card()` helper in the hello post.

| Slug | Title (targets the keyword) | Notes |
|---|---|---|
| `arabic-numbers` | Arabic numbers 1–100, and how each dialect says them | Arabic-Indic digits ٠–٩; 0–10, 11–19, the tens and 100 in all 7 dialects; how 21–99 reverse ("one and twenty"); counting nouns after 3–10 vs 11+. Mobile-safe tables (scroll inside a wrapper). A MemoryPairs game for 1–10 in Egyptian. |
| `what-does-wallah-mean` | What does "wallah" mean? | wallah vs wallahi vs wallahi el3azeem; swearing vs emphasis; "wallah?" = "really?"; how often to use it; dialect flavours. |
| `what-does-habibi-mean` | What does "habibi" mean? Habibi, habibti and how each dialect uses them | Gender and plural forms (habibti, habaybi), "ya habibi" between male friends, related pet names per dialect (ya 2albi, ya rou7i, ...). |
| `arabic-slang-words` | Arabic slang words, dialect by dialect | Around 8 common slang words each for Egyptian, Levantine, Darija and Gulf. No vulgarity. Links to the phrase pages. |
| `moroccan-darija-words-and-phrases` | Moroccan Darija words and phrases you'll actually hear | Everyday words (with Amazigh/French loans), phrases, a few sayings. Darija MemoryPairs. Links to `/darija/phrases`. |
| `egyptian-arabic-phrases` | Essential Egyptian Arabic phrases | Grouped by situation (greetings, shops, taxis, politeness, reactions like "ma3lesh", "yalla"). Egyptian MemoryPairs. Links to `/egyptian-arabic/phrases/*`. |
| `is-egyptian-arabic-different` | Is Egyptian Arabic different from "regular" Arabic? | Fusha vs Masri: the g for ج, the dropped ق, the b- present, the ma...sh negation, vocabulary. Links to `fusha-egyptian-levantine-darija`. |
| `can-arabs-understand-darija` | Is Moroccan Arabic hard for other Arabs to understand? | Why (vowel dropping, loanwords), why it's one-way, how Moroccans code-switch. Goes deeper than the existing `/darija` FAQ and links to it. |
| `levantine-vs-egyptian-arabic` | Levantine vs Egyptian Arabic: which should you learn? | Side-by-side sentences, sound differences, media reach, a recommendation by goal. Links to the dialect comparison pages (`src/routes/[comparison=dialectComparison]`) and `levantine-arabic-dialects-compared`. |

Each post ends with links to the relevant phrasebook or lessons and a signup CTA, matching the closing section of the existing posts.

## 2. Dialect translator
- **Route:** `src/routes/[dialect=dialect]/translator/+page.svelte` + `+page.ts` (prerender; `entries` over `PHRASE_DIALECTS` from `$lib/constants/phrase-seeds`). Gives `/egyptian-arabic/translator`, `/darija/translator`, `/levantine/translator`, and so on.
- **Page:** a text box (English in, max 200 chars) → Arabic script, transliteration, and a Listen button (`audioFor()` from `$lib/games/game-audio`, where `canSpeak` allows). Copy button. Below it is static, prerendered SEO content: an intro, about 8 worked examples written by me, and an FAQ. A new `TRANSLATOR_COPY` constant in `src/lib/constants/translator.ts` holds the per-dialect copy.
- **API:** new `src/routes/api/translate/+server.ts`. It follows `api/compare-dialects/+server.ts` (GoogleGenAI, `generateContentWithRetry`, `parseJsonFromGeminiResponse`) and uses `getDialectSystemInstruction` from `$lib/data/dialect-rules-v2`, as `api/translate-user-message` does. It uses **`config:`, not `generationConfig`** (a known bug), with a flat schema `{arabic, transliteration}` to avoid Gemini's "too many states" 400. It validates the dialect and length and enforces the anonymous cookie quota. It returns 429 with `{limit: true}` so the page shows the signup prompt.
- **SEO and linking:** add `translator` entries to `src/lib/utils/seo.ts` (titles like "Egyptian Arabic Translator: English to Masri, Free"), sitemap entries for each dialect, and a translator tile/link on `DialectLanding.svelte`.
- **Analytics:** `trackEvent('translator_used' | 'translator_limit_hit')` via `$lib/analytics`.

## 3. Landing page updates
All copy lives in `src/lib/constants/dialect-landing.ts`. FAQs there already render as FAQPage schema, and titles live in `src/lib/utils/seo.ts` (around line 180).
- **/khaleeji:** title → "Gulf Arabic Dialect (Khaleeji): Learn Online with Lessons & Phrases". Add the FAQ "What is the Gulf Arabic dialect?". Mention "Gulf Arabic dialect" in the `how-to-learn-gulf-arabic` description.
- **/darija:** title → "Darija: Learn the Moroccan Arabic Language Online". Add the FAQs "What is Darija?" and "Is Darija a language or a dialect?".
- **/levantine:** add the FAQs "What is Levantine Arabic?" and "Where is Levantine Arabic spoken?" (country by country, building on `whereSpoken`).

## Verification
- `rtk proxy npx svelte-check --threshold error`: no new errors in touched files (existing baseline: 216).
- The Svelte autofixer on every new or edited `.svelte` file until it's clean.
- `npm run build`: all new posts and translator pages prerender, and `/sitemap.xml` lists them.
- Translator API: on `npm run dev`, `curl -X POST /api/translate` with good, bad-dialect, too-long and over-quota requests (expect 200, 400, 400 and 429).
- A unit test (vitest) for the quota and validation helper.
- No browser screenshots. You check the visuals.
- After merge: you add the Vercel Firewall rule. Optionally request indexing in GSC for the new URLs.
