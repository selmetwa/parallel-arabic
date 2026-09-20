# Revamp Structured Lessons — Heavy-Practice Curriculum (v2)

## Status (updated to match the code as of `a3d5645`)

Shipped. The implementation went beyond the original Egyptian-only, Lesson-1-only scope:

- **Multi-dialect engine.** Routing is driven by a dialect registry (`src/lib/data/curriculum-v2.ts`), not an Egyptian check. Any registered dialect gets v2; unregistered ones stay on the legacy path.
- **Registered today:** `egyptian-arabic` (full A1–C2), `levantine` and `fusha` (both A1–B2 on the base curriculum; see `docs/levantine-v2-plan.md`). Darija is still on the legacy system.
- **Ready for other dialects:** a dialect-neutral A1–B2 curriculum (`curriculum-base-v2.ts`) and per-dialect prompt rules (`dialect-rules-v2.ts`) exist; enabling a dialect is one registry line plus generation.
- **Batch generation shipped** (`npm run generate:lessons`, `generate:lessons:all`, `generate:lessons:dry`), not deferred.
- **End-of-level assessments shipped** (not in the original plan) — see §8.

Sections below keep the original design rationale; where the code differs, the section says so.

## Context

The structured lessons (`src/routes/lessons/structured/`) are too thin. A user reported the two recurring failures of language apps: **not enough practice** (new-word→sentence ratio is ~1:1, where Duolingo/Mango recycle each word 10–20× across many sentences) and **no sentence-building / bidirectional translation practice**. The current lesson model (`src/lib/schemas/curriculum-schema.ts`) only supports `content`, `exercise` (MCQ/fill/matching), and a display-only `practice-sentence` — there is no speaking, typing, reorder, interactive reading, or tutor conversation in a lesson.

A professional curriculum designer produced a new CEFR A1–C2 Egyptian Arabic framework (`docs/curriculum/curriculum-framework-a1-c2.{ar,en}.md`) and a fully-specified Lesson 1 (`docs/curriculum/lesson-01-greetings-introductions.{ar,en}.md`). We will build a **new, parallel lesson system (v2)** for Egyptian Arabic that delivers heavy, varied, recurring practice, and generate Lesson 1 as the verified template — **without breaking the existing system** (other dialects and old lessons keep working unchanged).

### Decisions (from user)
1. **Egyptian-only for now**, built as **new code with backwards compatibility** — do not mutate the existing schema/curriculum/player in place.
2. **Heavy practice**: ~12–15 new words per lesson, each recurring **8–12×** across varied exercises (~100+ interactions).
3. **Live AI mini-chat** for the in-lesson tutor conversation (runtime `/api/tutor-chat`, scoped to lesson vocab).
4. **Generate Lesson 1 only** now; the rest are triggered later via a batch tool.

> **As built:** decision 1 was generalized — the engine is dialect-agnostic behind a registry, with Egyptian the only dialect enabled. Decision 4 was superseded — the batch tool shipped in the same change (§7).

## Strategy: deterministic assembly + flat AI calls

The single biggest technical risk is Gemini's known failure on large/complex `responseJsonSchema` (400s) and empty output when `maxOutputTokens` is consumed by thinking tokens. We avoid this entirely:

- **AI only produces small, flat building blocks** (vocab list, batches of practice sentences, reading passages, scenario brief) — each a flat array, generated with the corrected pattern (`config: { responseMimeType, responseJsonSchema, thinkingConfig:{thinkingBudget:0} }` via `generateContentWithRetry` + `parseJsonFromGeminiResponse`).
- **The rich, nested lesson JSON is assembled in our own code** (not a Gemini `responseJsonSchema`), so it can be as structured as we like. The assembly algorithm is what guarantees the 8–12× recurrence and interleaving — pedagogy is controlled by code, not hoped for from the model.

## Architecture (new parallel v2 system)

### 1. Curriculum data
- **`src/lib/data/curriculum-egyptian-v2.ts`** — Egyptian A1–C2 from `docs/curriculum/curriculum-framework-a1-c2.en.md`. Shape: `CurriculumV2Module = { id, title, level, objectives[], topics: [{ id, title, description }] }` (level and objectives live on the module, not the topic). Topic IDs are namespaced (`eg-a1-u02` = Greetings & Introductions).
- **`src/lib/data/curriculum-base-v2.ts`** — dialect-neutral A1–B2 (`base-a1-u02`, …) for other dialects. Stops at B2 because the framework's C1/C2 units are Egypt-specific (colloquial poetry, Al-Azhar, Saidi culture); those are authored per dialect if needed.
- **`src/lib/data/curriculum-v2.ts`** — the registry: `curriculumV2: Partial<Record<Dialect, CurriculumV2Module[]>>`, plus `getCurriculumV2`, `hasV2Curriculum`, `findV2Topic`, `V2_DIALECTS`. Currently `{ 'egyptian-arabic': curriculumEgyptianV2, levantine: baseCurriculumV2A1B2, fusha: baseCurriculumV2A1B2 }`.
- **`src/lib/data/dialect-rules-v2.ts`** — per-dialect display names and prompt rules (`getDialectRules`, `getDialectName`) with shared format rules (clean `arabic` vs `arabicTashkeel`, word alignments).
- `src/lib/data/curriculum.ts` is untouched.

### 2. Lesson schemas — `src/lib/schemas/lesson-v2-schema.ts` (new)
Two layers:

**(a) Generation sub-schemas (sent to Gemini — keep FLAT):**
- `vocabSchema`: array of `{ arabic, arabicTashkeel, english, transliteration, partOfSpeech, gender? }`.
- `practicePoolSchema`: array of `{ arabic, arabicTashkeel, english, transliteration, targetWords: string[] }` (which lesson vocab each sentence drills).
- `passageSchema`: 1–2 short reading passages as sentence arrays (same shape).
- `scenarioBriefSchema`: `{ situation, studentRole, otherRole, goalEnglish, targetWords[] }` for the live tutor step.

**(b) Final assembled lesson schema (our storage shape — may be rich/nested, NOT a Gemini schema):**
`GeneratedLessonV2 = { schemaVersion: 2, topicId, title, dialect, level, objectives[], vocab[], steps: StepV2[] }` where `StepV2` is a discriminated union adding the new types:
`content` | `vocab-intro` | `multiple-choice` | `typing` (EN→AR) | `reorder` (build) | `translate` (AR→EN) | `speaking` | `reading` | `tutor-conversation` (live). Each carries the sentence shape `{ arabic, arabicTashkeel?, english, transliteration }` the existing components already consume.

**Word alignment (required for all generated text):** every generated sentence — vocab examples, practice-pool items, and reading passages — must include `wordAlignments: { arabic, english, transliteration }[]` (one entry per word), matching the existing `wordAlignmentSchema` (`src/lib/utils/gemini-schemas.ts:24-28`) already produced by `/api/tutor-chat` and consumed by `ArabicWordDisplay`/`Sentence`/`ConversationMessage`. This is what powers per-word interlinear toggling between English / Arabic / transliteration in-lesson. It is therefore part of the shared `sentenceItem` in every generation schema below (the model fills it; it is not optional for v2 content). Because alignments add output tokens, Phase B batch size drops to ~20 sentences/call.

### 2b. Generation schemas — sketch (all flat; every Gemini call is schema-constrained)
Every AI call still passes a defined `responseJsonSchema`; we just never ask one call for the whole nested lesson (that was the 400 trigger). Four flat building-block schemas feed the deterministic assembler:

```ts
// src/lib/schemas/lesson-v2-schema.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Per-word interlinear alignment — matches existing wordAlignmentSchema.
const wordAlignment = z.object({
  arabic: z.string(),
  english: z.string(),
  transliteration: z.string()
});

// Shared item consumed by existing components. arabic = clean answer-key;
// arabicTashkeel = display-with-diacritics; wordAlignments = toggle source.
const sentenceItem = z.object({
  arabic: z.string(),
  arabicTashkeel: z.string(),
  english: z.string(),
  transliteration: z.string(),
  wordAlignments: z.array(wordAlignment)
});

// PHASE A — vocab (12–15; count enforced in PROMPT, not schema)
export function createLessonVocabSchema() {
  const vocabItem = sentenceItem.extend({
    partOfSpeech: z.string(),
    gender: z.string().optional()
  });
  const schema = z.object({ vocab: z.array(vocabItem) });
  return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

// PHASE B — practice pool (batched ~20/call). targetWords tags which vocab a
// sentence drills so the assembler can hit 8–12× recurrence per word.
export function createPracticePoolSchema() {
  const poolItem = sentenceItem.extend({ targetWords: z.array(z.string()) });
  const schema = z.object({ sentences: z.array(poolItem) });
  return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

// PHASE C1 — reading passage(s)
export function createLessonPassageSchema() {
  const schema = z.object({ title: z.string(), sentences: z.array(sentenceItem) });
  return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

// PHASE C2 — live-tutor scenario brief (drives /api/scenario-intro + /api/tutor-chat)
export function createScenarioBriefSchema() {
  const schema = z.object({
    situation: z.string(),
    studentRole: z.string(),
    otherRole: z.string(),
    goalEnglish: z.string(),
    targetWords: z.array(z.string())
  });
  return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}
```

Each is a single object wrapping flat arrays of primitives — structurally identical to `createSentencesSchema` / `createScenarioVocabSchema`, which Gemini handles reliably.

**Final stored lesson schema (validated locally; NOT sent to Gemini).** Used only to validate our assembled output and type the player, so it can be richly nested:

```ts
const stepV2 = z.discriminatedUnion('type', [
  z.object({ type: z.literal('content'), title: z.string(), text: z.string(),
             examples: z.array(sentenceItem).optional() }),
  z.object({ type: z.literal('vocab-intro'), items: z.array(z.any()) }),
  z.object({ type: z.literal('multiple-choice'), prompt: z.string(),
             options: z.array(sentenceItem), correctIndex: z.number(), targetWords: z.array(z.string()) }),
  z.object({ type: z.literal('typing'),    sentence: sentenceItem, targetWords: z.array(z.string()) }), // EN→AR
  z.object({ type: z.literal('reorder'),   sentence: sentenceItem, targetWords: z.array(z.string()) }), // build
  z.object({ type: z.literal('translate'), sentence: sentenceItem, targetWords: z.array(z.string()) }), // AR→EN
  z.object({ type: z.literal('speaking'),  sentence: sentenceItem, targetWords: z.array(z.string()) }),
  z.object({ type: z.literal('reading'),   title: z.string(), sentences: z.array(sentenceItem) }),
  z.object({ type: z.literal('tutor-conversation'), situation: z.string(), studentRole: z.string(),
             otherRole: z.string(), goalEnglish: z.string(), targetWords: z.array(z.string()) })
]);

export const generatedLessonV2Schema = z.object({
  schemaVersion: z.literal(2),
  topicId: z.string(), title: z.string(), dialect: z.string(), level: z.string(),
  objectives: z.array(z.string()),
  vocab: z.array(z.any()),
  steps: z.array(stepV2)
});
```

Flow: **4 flat schemas the model fills → validated by Zod → assembler emits `steps[]` against `generatedLessonV2Schema`.** Every model call is schema-constrained; recurrence/ordering/alignment-presence are guaranteed by code.

### 3. Generation pipeline — `src/routes/api/generate-lesson-v2/+server.ts` (new)
Orchestrates phases for one `{ topicId, dialect }` (`dialect` defaults to `'egyptian-arabic'`; returns 400 unless `hasV2Curriculum(dialect)`). Uses `gemini-2.5-flash` with `thinkingBudget: 0`, and injects `getDialectRules(dialect)` into every prompt. Reuses `generateContentWithRetry` + `parseJsonFromGeminiResponse` + the corrected `config` pattern (mirror `src/routes/api/scenario-intro/+server.ts:87-99`):
- **Phase A — Vocab**: 12–15 items from topic + objectives + framework notes (dialect rules from the framework doc baked into the prompt).
- **Phase B — Practice pool (batched)**: ~5–6 calls of ~20 sentences each (smaller batches because each sentence now carries `wordAlignments`), passing the vocab list and a coverage instruction so each word is reused; bound output per call to dodge token limits. Target pool ≈ 100–130 sentences.
- **Phase C — Reading passage(s)** + **scenario brief** (small calls).
- **Phase D — Assemble** (pure TS, no AI): see below.
Save via a new `saveLessonV2` helper.

### 4. Assembly algorithm (the core of "heavy practice") — `src/lib/server/assemble-lesson-v2.ts` (new)
Deterministic builder that turns vocab + pool + passages + scenario into ordered `steps[]`:
- Open with `content` (objectives) + chunked `vocab-intro` (teach 3–4 words at a time, with audio).
- **Interleaved spaced repetition**: after each vocab chunk, drill the words just introduced *plus* earlier ones, cycling exercise types (`multiple-choice` → `reorder` → `typing` → `translate` → `speaking`) drawing from `practicePool` filtered by `targetWords`.
- Enforce a **per-word recurrence counter (min 8, target 10–12)**; keep emitting practice steps until every word meets quota, distributing across types so no single type dominates.
- Insert the `reading` passage mid/late, then the live `tutor-conversation` near the end, then a short mixed final assessment.

### 5. Renderer — `src/lib/components/LessonPlayerV2.svelte` (new) + thin step adapters
New player (do not modify `LessonPlayer.svelte`) that walks `StepV2[]` and delegates to **existing** components, wrapped to fit the lesson stepper's `next()`/progress model:
- `speaking` → `SpeakSentence.svelte` (`dialect-shared/speak/`)
- `typing` / `reorder` → `SentenceBlock.svelte` typing & reorder modes (`dialect-shared/sentences/`)
- `reading` → `ArabicWordDisplay.svelte` (`dialect-shared/story/components/`)
- `multiple-choice` / `translate` → reuse the MCQ rendering pattern from `InteractiveExercise.svelte` / current `LessonPlayer` exercise block
- `vocab-intro` → small flashcard built from existing `AudioButton` + `BookmarkButton`
- `tutor-conversation` → embed the tutor stack: `ConversationMessage.svelte` + runtime calls to `/api/scenario-intro` (seed) and `/api/tutor-chat` (live), scoped via the stored `scenarioBrief` and lesson vocab.
As built, two dedicated step components were added in `src/lib/components/lesson-v2/`: `LessonMcqStep.svelte` (multiple-choice / translate) and `LessonTutorStep.svelte` (live tutor chat with mic, autoplay, auto-send, auto-scroll). The player also has Back/Skip.
These components have built-in `next`/`resetSentences`/XP/save props — adapters supply no-op or stepper-aware callbacks. Reuse normalization from `src/lib/utils/arabic-normalization.ts` and audio via `speakArabic`/`AudioButton`.

**Interlinear toggle:** every step that shows generated text passes the sentence's `wordAlignments` to its component so the learner can toggle per-word between English / Arabic / transliteration. `ArabicWordDisplay` and `ConversationMessage` already accept this; for `typing`/`reorder`/`translate`/`speaking`/`multiple-choice` the player exposes the same show-english / show-transliteration toggles (mirroring `ArabicWordDisplay`'s `showEnglish`/`showTransliteration` props) driven by the alignment array.

### 6. Storage, API, routing wiring (backwards compatible)
- **Storage**: new path prefix in the existing `structured_lesson` bucket, `{dialect}-v2/{topicId}.json` (e.g. `egyptian-arabic-v2/eg-a1-u02.json`; prefix from `v2Prefix(dialect)`), via new helpers `saveLessonV2` / `loadLessonV2` / `checkExistingLessonsV2` in `src/lib/helpers/lesson-file-helper.ts` (new functions, old ones untouched). Distinct prefix → no cache-key or existence-map collisions.
- **API**: new `GET /api/lessons-v2/[id]/+server.ts` returning the v2 JSON (old `/api/lessons/[id]` unchanged).
- **Route**: `src/routes/lessons/structured/[dialect]/+page.server.ts` branches on `getCurriculumV2(dialectName)` (not a hard-coded Egyptian check). When a v2 curriculum is registered it loads that curriculum + `checkExistingLessonsV2` and returns `useV2: true`; `+page.svelte` then mounts `LessonPlayerV2`. Unregistered dialects fall through to the existing code path. Subscribed/whitelisted users can access all levels.
- **Caution:** registering a dialect switches its structured page to v2 immediately, so the page is empty until that dialect's lessons exist in storage. Progress continues to use `structured_lesson_progress` (topic IDs are namespaced; no schema change needed).

### 7. Lesson generation
Lesson 1 (`eg-a1-u02`, Greetings & Introductions) was the reference template, checked against `docs/curriculum/lesson-01-greetings-introductions.en.md` (greeting + introduction vocab, the dialogues, the self-intro reading, a "meet someone" tutor scenario).

Batch generation shipped as `scripts/generate-lessons-v2.ts`. It drives the running app's `/api/generate-lesson-v2`, skips topics that already exist (checked via `/api/lessons-v2/[id]`) and retries failures.

```bash
npm run generate:lessons -- --levels=A1,A2            # default: A1
npm run generate:lessons:all                          # A1–C2
npm run generate:lessons:dry                          # list targets, generate nothing
npm run generate:lessons -- --only=eg-a1-u02          # explicit topic ids
npm run generate:lessons -- --dialect=levantine       # default: egyptian-arabic
```

The script and the endpoint both refuse a dialect that is not registered in `curriculum-v2.ts`.

### 8. End-of-level assessments (added during implementation)
`POST /api/generate-assessment-v2 { level, dialect }` builds a cumulative assessment for a level: recognition, comprehension, reading, speaking and a tutor capstone. Logic lives in `src/lib/server/assemble-assessment-v2.ts`.
- It harvests vocab, practice sentences and reading passages from that level's already-generated lessons, so the level's lessons must exist first (it returns 409 otherwise).
- It is saved as a normal v2 lesson under the level's review-titled topic (e.g. `eg-a1-u21`, "Final Review and Assessment A1") via `saveLessonV2`.
- Batch script: `npm run generate:assessments` (all levels by default; `--levels=`, `--dialect=`).

## Adding another dialect (as done for Levantine)
1. On a branch that is not deployed, register it in `curriculum-v2.ts`: `levantine: baseCurriculumV2A1B2`. Check its rules block in `dialect-rules-v2.ts`.
2. Run the app on that branch and generate: `npm run generate:lessons -- --dialect=levantine --levels=A1,A2,B1,B2`, then `npm run generate:assessments -- --dialect=levantine --levels=A1,A2,B1,B2`.
3. Spot-check lessons in `/lessons/structured/levantine`, then merge and deploy. Registering before generating would ship an empty structured page.

## Critical files
- Curriculum: `src/lib/data/curriculum-v2.ts` (registry), `curriculum-egyptian-v2.ts`, `curriculum-base-v2.ts`, `dialect-rules-v2.ts`.
- Schema + assembly: `src/lib/schemas/lesson-v2-schema.ts`, `src/lib/server/assemble-lesson-v2.ts`, `src/lib/server/assemble-assessment-v2.ts`.
- API: `src/routes/api/generate-lesson-v2/+server.ts`, `src/routes/api/generate-assessment-v2/+server.ts`, `src/routes/api/lessons-v2/[id]/+server.ts`.
- Player: `src/lib/components/LessonPlayerV2.svelte`, `src/lib/components/lesson-v2/LessonMcqStep.svelte`, `src/lib/components/lesson-v2/LessonTutorStep.svelte`.
- Scripts: `scripts/generate-lessons-v2.ts`, `scripts/generate-assessments-v2.ts`.
- Edited (additive, backwards-compatible): `src/lib/helpers/lesson-file-helper.ts` (v2 helpers), `src/routes/lessons/structured/[dialect]/+page.server.ts` and `+page.svelte` (registry-driven v2 branch).
- Reused as-is: `gemini-api-retry.ts`, `gemini-json-parser.ts`, `arabic-normalization.ts`, `SpeakSentence`, `SentenceBlock`, `ArabicWordDisplay`, `InteractiveExercise`, `ConversationMessage`, `AudioButton`/`speakArabic`, `/api/text-to-speech`, `/api/speech-to-text`, `/api/tutor-chat`, `/api/scenario-intro`.
- Svelte: validate all new `.svelte`/`.svelte.ts` with the Svelte MCP `svelte-autofixer` before finishing (per project CLAUDE.md).

## Verification
1. **Generate**: `POST /api/generate-lesson-v2 { topicId:'eg-a1-u02', dialect:'egyptian-arabic' }`; confirm it saves and returns valid JSON parsed by `lesson-v2-schema`.
2. **Recurrence check**: a small script asserts every vocab word appears ≥8× across practice steps (the headline requirement). Print the per-word histogram.
3. **Alignment check**: assert every generated sentence (vocab examples, pool, passages) has a non-empty `wordAlignments` array and that word count roughly matches the Arabic token count; confirm the per-word English/Arabic/transliteration toggle works in the player.
4. **End-to-end in-app**: `npm run dev`, open `/lessons/structured/egyptian-arabic`, open Lesson 1, step through and confirm each step type renders and works — MCQ, EN→AR typing, reorder/build, AR→EN, speaking (record→score), interactive reading, and the live tutor mini-chat. Confirm audio (ElevenLabs) and STT (Chirp) work in-lesson, and toggling translation/transliteration per word works.
5. **Assessments**: after a level's lessons exist, `npm run generate:assessments -- --levels=A1`; open the level's review topic and step through it.
6. **Backwards compat**: open the Darija structured path (unregistered dialects) and an existing lesson — confirm unchanged behavior (old `LessonPlayer`, old curriculum, old API).
7. **Resume + completion**: close mid-lesson, reopen → resumes at saved step; finish → `/api/structured-lessons/complete` awards XP and unlocks next node.

## Out of scope / follow-ups
- Enabling v2 for Darija (the engine and base curriculum are ready; see "Adding another dialect").
- Authoring C1/C2 for non-Egyptian dialects (Levantine and Fusha first).
- Migrating old lessons to v2.
