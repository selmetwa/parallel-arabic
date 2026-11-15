# Tutor notes → practice lessons

## Context
Learners with a private tutor end up with messy lesson docs: two-column vocab tables, several forms in one cell ("Tool Tools | اداة ادوات"), slash variants (معتمد/ة), synonyms joined with "=", loose example sentences, and grammar notes ("ب for tools", بعت → إتبعت). Today there is no way to turn that into practice.

This feature lets any learner paste notes or upload a PDF/DOCX. The app extracts **every** vocab word and grammar concept, the learner ticks what to keep, and the app builds private v2 lessons with writing practice. Every kept word is used in the practice sentences.

### Decisions (from user, 2026-11-15)
1. **Writing** reuses the existing virtual Arabic keyboard, with a toggle for the computer keyboard (as in `SentenceBlock`).
2. **One upload = one lesson** containing every selected word, with no splitting. A 42-word doc gives roughly 150–200 steps (30–45 min). The player already resumes mid-lesson.
   - **Lighter than the curriculum pipeline:** each word recurs **4–5×** (min 4, target 5) instead of 8–12.
3. **Product feature for all learners**, any dialect, private to the learner.
4. **Grammar notes are taught and drilled:** an explanation step, then practice sentences that use the pattern.
5. **The LLM decides** whether each line is a vocab word or a concept. It also resolves typos and ambiguous pairs ("Chief" → chef, كسل → laziness).
6. **Input:** paste, or upload **.pdf / .docx**. Legacy `.doc` is rejected with "save as .docx or PDF".
7. **After extraction**, the learner sees every extracted word in a checkbox list (select all / none / individual). There is no editing. The selected words build the lessons and are added to `saved_word` so they show up in review.
8. **Every extracted or generated item carries English, Arabic (clean + `arabicTashkeel`), transliteration and `wordAlignments`.** This covers vocab, concept examples, pool sentences and passages. Every screen that shows them (the review checklist and the lesson player) has toggles for tashkeel, transliteration and English.
9. **No level.** The learner only picks a dialect on upload. Internally, tutor lessons use one fixed exercise mix that includes typing, and prompts say "match the difficulty of the notes".
10. **Each upload is its own lesson.** Uploads are never appended to an earlier one.
11. **Where it lives:** a new top-level section, **Tutor notes** (`/notes`), in the nav.
12. **Access:** subscribers only (same paywall check as `api/create-lesson`, no free tries), and no daily limit.

## Flow
1. `/notes/new`: paste box or file drop (.pdf/.docx, ≤4 MB), plus a dialect picker that defaults to the learner's dialect.
2. **Extract** (`POST /api/tutor-notes`): file → text → one flat Gemini extraction call → coverage check → save a `tutor_lesson` row (status `extracted`) → go to the review screen.
3. **Review** (`/notes/[id]`): words grouped by suggested lesson, each with a checkbox (all ticked by default) and the tashkeel/transliteration/English toggles. Grammar concepts are listed separately with their own checkboxes. A single button, "Build N lessons", is the only action.
4. **Build:** `POST /api/tutor-notes/[id]/build` generates the lesson, with a progress screen. It runs about 6–8 sequential calls, around 1–2 minutes, under the 300 s limit. The selected words are inserted into `saved_word` at the same time.
5. **Play:** `/notes/[id]` shows the lesson summary (word list, concepts, progress) and opens it in the existing `LessonPlayerV2`. `/notes` lists all of the learner's tutor lessons.

## 1. Reading the file — `src/lib/server/tutor-notes/read-source.ts`
- **.docx:** `mammoth.convertToHtml` (new dependency), so tables keep their rows and columns. The HTML is sent to the model as-is.
- **.pdf:** sent to Gemini as `inlineData` (`application/pdf`). Gemini reads Arabic PDFs better than text extraction does, which often scrambles right-to-left text.
- **Pasted text:** used as-is. Google Docs copies paste as markdown-ish tables like the example.
- **Legacy .doc:** rejected with "Save it as .docx or PDF".

## 2. Extraction — `src/lib/server/tutor-notes/extract.ts` + `src/lib/schemas/tutor-notes-schema.ts`
One schema-constrained call (`config` key with `thinkingBudget: 0`, `gemini-2.5-flash`, `generateContentWithRetry` + `parseJsonFromGeminiResponse`). The schema stays flat (see the "too many states" memory):

```ts
items: [{
  kind: 'vocab' | 'concept',
  arabic, arabicTashkeel, english, transliteration,   // concept: the pattern, e.g. "بـ + tool"
  partOfSpeech,                                        // vocab only ('' for concept)
  explanation,                                         // concept: 1–2 sentences; vocab: '' or a usage note
  sourceLine,                                          // the raw line it came from (for the coverage check)
  group                                                // short topic label used to order related words together, e.g. "Work & tech"
}]
```

Prompt rules:
- Split multi-form cells into separate items (singular/plural, verb/noun, masculine/feminine, each synonym).
- Fix obvious English typos.
- Translate by what the Arabic actually means; when the English disagrees, put a note in `explanation`.
- Fill in tashkeel and 3/7/2 chat-style transliteration.
- Use dialect rules from `getDialectSystemInstruction(dialect)` and `getLessonFormatRules()`.
- Words that appear only inside an example sentence still become vocab items.

**Coverage guarantee ("extract ALL vocab"), deterministic:**
1. Collect every Arabic word token in the source.
2. Normalize with `normalizeArabicText` and drop a small stoplist (و، في، من، على، ال-prefix handled by the normalizer…).
3. Check each token against the normalized words of all extracted items.
4. If any are missing, run one follow-up extraction over just the lines that contain them, then merge the results.
5. Store the leftover misses on the row so the review screen can show "not recognised: …".

## 3. Lesson building — `src/lib/server/lesson-v2-generation.ts` (refactor) + `src/routes/api/tutor-notes/[id]/lessons/[n]/+server.ts`
- **Refactor:** move the Phase B–C code out of `src/routes/api/generate-lesson-v2/+server.ts` into shared functions `generatePool(vocab, ctx)`, `generatePassages(...)` and `generateScenario(...)`. Behaviour must not change. The curriculum endpoint then calls them.
- **Ordering:** sort the selected words by `group` so related words and linked forms (Tool / Tools) are introduced in the same chunk.
- **Vocab:** comes from the extraction, not generated, so the lesson uses exactly the learner's words.
- **Pool prompt additions:**
  - Use only the lesson's words plus very common function words.
  - Every word must appear in at least 3 sentences. The existing coverage loop enforces this with `TARGET_PER_WORD = 3`, in batches of ~15 sentences: about 5–6 batches for 42 words.
  - Generate 1 reading passage, not 2.
  - Reuse the tutor's own example sentences verbatim as pool items when they fit.
  - For each selected concept, write 3–4 sentences that show the pattern with lesson words.
- **Grammar:** each concept becomes a `content` step (title, explanation, examples). It goes after the first vocab chunk that contains a word its examples use; if there is none, after the first chunk.
- **Lighter assembly:** `assembleLessonV2` takes optional `{ minRecurrence, targetRecurrence }`; tutor lessons pass `{ 4, 5 }`. The curriculum keeps 8 and 10–12.
- **Writing:** an `assembleLessonV2` option, `writing: true`, used only for tutor lessons:
  - Each word's ~5 repetitions include 1 recognition MCQ, 1 "write it in Arabic" `typing` step of the word itself, and 2–3 sentence exercises. At least one sentence exercise per lesson chunk is `typing`, at every level (A1 currently has no typing).
  - Writing steps count toward the recurrence.
  - These reuse the existing `typing` step and `SentenceBlock`, which already has the virtual/computer keyboard toggle. No schema or player change.
- **Checks:** validate with `generatedLessonV2Schema` and `recurrenceHistogram` (min ≥ 4, and every selected word present). Store in the `structured_lesson` bucket at `tutor-v2/{userId}/{id}.json`.
- **Tashkeel toggle:** `LessonPlayerV2` has EN and transliteration toggles but always shows tashkeel. Add a third toggle, on by default; when off it shows `arabic` instead of `arabicTashkeel`. This also benefits curriculum lessons.

## 4. Data — `docs/sql/2026-11-15-tutor-notes.sql` (user runs; MCP is read-only)
```sql
create table public.tutor_lesson (
  id text primary key, user_id text not null, title text not null, dialect text not null,
  source_text text not null,
  extraction jsonb not null,          -- extracted items + uncovered tokens
  selection jsonb,                    -- indexes the learner kept
  status text not null default 'extracted',   -- extracted | building | ready | failed
  storage_path text, word_count int, step_count int,
  created_at bigint not null
);
create index tutor_lesson_user_idx on public.tutor_lesson (user_id, created_at desc);
alter table public.tutor_lesson enable row level security;  -- server uses the service role, as elsewhere
```
- Lesson progress and resume reuse `structured_lesson_progress` with topic id `tutor-{id}`. Verify during implementation that nothing joins that table to the curriculum.
- Saved words follow the `api/save-word` insert pattern: FSRS defaults (New), skip duplicates by `arabic_word`, set `dialect`.

## 5. UI (Svelte 5, desk styling from the review redesign, svelte-autofixer on every file)
- `src/routes/notes/+page.svelte`: list of tutor lessons (title, date, dialect, N words, progress) plus a "New from notes" button.
- `src/routes/notes/new/+page.svelte`: paste/upload, dialect, then "Extract".
- `src/routes/notes/[id]/+page.svelte`:
  - **Before build:** the checkbox review. Reuse the select pattern from `GeneratedItemsModal.svelte` (`SvelteSet` of deselected items, select all / none). Words are grouped under their suggested lesson, with a sticky footer: "Build N lessons from M words".
  - **After build:** the lesson summary and a Start/Resume button that plays it in `LessonPlayerV2`.
- Nav entry "Tutor notes" in `src/lib/constants/nav.ts`. Per memory, copy avoids "AI".

## 6. Access and cost
- Each doc costs 1–2 extraction calls plus about 5–6 pool batches, 1 passage and 1 scenario: roughly 9–10 calls in total.
- Subscribers only: every `/api/tutor-notes*` endpoint checks the subscription, and non-subscribers see the paywall on `/notes/new`. No daily limit.

## Critical files
- **New:**
  - `src/lib/server/tutor-notes/{read-source,extract}.ts`
  - `src/lib/schemas/tutor-notes-schema.ts`
  - `src/lib/server/lesson-v2-generation.ts`
  - `src/routes/api/tutor-notes/+server.ts`
  - `src/routes/api/tutor-notes/[id]/build/+server.ts`
  - `src/routes/notes/**`
  - `docs/sql/2026-11-15-tutor-notes.sql`
- **Edited:**
  - `src/routes/api/generate-lesson-v2/+server.ts` (uses the shared generation code)
  - `src/lib/server/assemble-lesson-v2.ts` (`writing` option + `content` steps for concepts)
  - `src/lib/constants/nav.ts`
  - `package.json` (`mammoth`)
- **Reused:** `assembleLessonV2`, `recurrenceHistogram`, `generatedLessonV2Schema`, `LessonPlayerV2`, `SentenceBlock` keyboard toggle, dialect rules, the Gemini retry/parse helpers, `normalizeArabicText`.

## Verification
- **Unit tests (vitest), no Gemini:**
  - The coverage checker on the example doc. Every Arabic token in it is either covered by a fixture extraction or reported.
  - The assembler with `writing: true` and `{ 4, 5 }`: every word has ≥1 writing step and ≥4 total recurrences, and concept `content` steps appear before their drills. The default call still gives ≥8, so curriculum lessons are unchanged.
  - A fixture extraction for the example doc lives at `src/lib/server/tutor-notes/fixtures/egyptian-lesson.json`, written by hand.
- **Regression:** `npm run build:lessons-v2 -- --dialect=saudi` still passes, so the assembler change doesn't affect curriculum lessons. `npm run check` shows no new errors, and `npm run build` succeeds.
- **One live run** (the user runs it, because the Gemini key is production):
  1. Paste the example doc.
  2. Confirm that all ~42 items plus the concepts appear and that "Chief" is resolved to chef.
  3. Build the lessons and play one end to end, including writing with both keyboards.
  4. Confirm the words appear in `/review/all-words` as New.
