# Listening game: "What did you hear?" comprehension mode

## Context

The `/learn/game` listening mode does not currently teach listening.

In sentence listening (`src/routes/learn/game/play/+page.svelte:987-1033`), the game:

- plays the **whole** Arabic sentence via TTS — including the very word the learner is asked to identify, so the answer is spoken aloud;
- prints the **English translation on screen before the learner answers** (line 1016), which alone narrows four Arabic options to one;
- offers the four Arabic word options as text, so the task collapses into matching a sound you just heard to a string you can read.

The result is a round that can be passed without comprehending anything. Word listening (line 1034) is sounder — hear an Arabic word, pick the English gloss — but that is vocabulary recognition, not listening.

The goal: replace the missing-word sentence round with a real comprehension round. The learner hears a full sentence and picks the correct **English meaning** from four near-miss options that each differ from the truth along exactly one axis (tense, person, negation, number, or one key noun). That forces parsing the sentence rather than spotting a word, and the distractors become the teaching material — a wrong answer tells you precisely which grammatical feature you missed.

Alongside it, fix the audio the mode depends on. Today there is **no TTS caching anywhere in the app** — every play is a fresh ElevenLabs call, a fresh blob, and a `URL.createObjectURL` that is never revoked. There is no autoplay and no slow playback. Worse, the game's inline `playAudio()` (line 446) is the only one of the six copies of this fetch-and-play block that does **not** handle 401/403, so a learner who hits the TTS quota just sees a dead button. Autoplay would turn that into silence with nothing to click.

## Decisions taken

- Options are **English meanings**, not Arabic transcriptions — works regardless of Arabic reading speed, and the near-miss distractors carry the pedagogy.
- The missing-word sentence round is **replaced**, not kept behind a toggle. Keeping it means keeping a round that does not teach listening. Word-based listening (`contentType === 'words'`) is untouched.
- **Full audio pass**: autoplay on question entry, per-question blob caching, 0.7× slow replay, prefetch of the next question's audio.

## Plan

### 1. Generation: comprehension sentences with near-miss distractors

**`src/lib/utils/gemini-schemas.ts`** — add `createListeningComprehensionSchema()` beside `createGameSentencesSchema()` (line 573):

```ts
const itemSchema = z.object({
  arabic: z.string(),          // the sentence that gets spoken
  english: z.string(),         // the correct meaning
  transliteration: z.string(),
  distractors: z.array(z.object({
    english: z.string(),
    variesBy: z.string()       // 'tense' | 'person' | 'negation' | 'number' | 'vocabulary'
  }))
});
const schema = z.object({ sentences: z.array(itemSchema) });
```

Two deliberate constraints, both to avoid the known "too many states" 400 from an over-complex `responseJsonSchema`:

- **no array bounds** (`z.array(...)`, not `.length(3)`) — enforce "exactly 3" in the prompt and validate server-side;
- **`variesBy` is `z.string()`, not `z.enum([...])`** — an enum nested inside an array-of-objects is exactly the shape that has failed before. Constrain the vocabulary in the prompt and treat an unexpected value as "no feedback label" rather than an error. `src/lib/schemas/self-study-schema.ts` keeps its options flat for the same reason.

Return the usual `{ zodSchema, jsonSchema }` shape.

**`src/routes/api/generate-game-sentences/+server.ts`** — accept a new `questionStyle?: 'blank' | 'comprehension'` body field, defaulting to `'blank'` so every existing caller is unaffected. When `'comprehension'`:

- build a prompt demanding each distractor be a **minimal semantic variation** of the true translation — change the tense, or the subject, or negate it, or swap one concrete noun — never an unrelated sentence, and never something a learner could rule out on plausibility alone;
- require the three distractors to use three *different* `variesBy` values where the sentence allows it, so one round trains several features;
- reuse the existing `dialectConfigs`, `getDifficultyDescription()`, `customRequestSection`, `learningTopicsSection` and `reviewWordsSection` blocks verbatim — only the task description and the JSON shape change;
- reuse `cleanText()` per field type, and the existing `generateContentWithRetry` + `parseJsonFromGeminiResponse` path with `config: { temperature, maxOutputTokens, responseMimeType, responseJsonSchema }` — note `config`, not `generationConfig`;
- keep `model: "gemini-2.5-flash"` to match the sibling call in the same file. (Worth knowing: the shared utils `gemini-helper.ts` and `gemini-api-retry.ts` default to and fall back on `gemini-3.1-flash-lite-preview`, while all 33 call sites hardcode `gemini-2.5-flash`. That inconsistency is pre-existing — don't resolve it here.)

Validation before returning, mirroring the existing `wrongOptions` handling at line 250: drop any item with fewer than 3 distractors, and dedupe distractors whose English matches the correct answer case-insensitively. The `blankWord`-is-a-substring check (line 234) does not apply and should not run on this path.

`createStorySchema()` (line 80 of the same file) already has a `quiz` with `quizQuestionSchema` + `hint` — worth a look as prior art for comprehension questions, though its shape is not a direct fit.

### 2. Question type in the play page

**`src/routes/learn/game/play/+page.svelte`**

- Extend the `Sentence` interface (line 34) with `distractors?: Array<{ english: string; variesBy: string }>` and make the blank-word fields optional, so one interface serves both round styles and the `gameSession` snapshot restore keeps working.
- Add `'listening-comprehension'` to the `GameQuestion['type']` union (line 49), and carry the selected distractor's `variesBy` so feedback can name it.
- In `generateCustomSentences()` (line 301), pass `questionStyle: 'comprehension'` when `mode === 'listening'`.
- In `createSentenceQuestions()` (line 341), the `mode === 'listening'` branch becomes `correctAnswer = sentence.english`, `options = shuffle([sentence.english, ...distractors.map(d => d.english)])`, `type: 'listening-comprehension'`. Drop the `displayText` blank construction for this branch only — `multiple-choice` still needs it.
- `selectAnswer()` (line 522) needs no change: it compares against `correctAnswer` and pushes to `sentencesToReview`, both still valid.

Note this round is always a custom-generated game, so it takes the `useCustom` path — `FREE_TURN_LIMIT` and `/api/game-progress` persistence are both skipped (`game_progress.category` is `NOT NULL`, which is why sentence games were never persisted). Resume relies solely on the in-memory `gameSession` snapshot. That is existing behaviour; don't change it here.

### 3. Audio: cache, autoplay, slow replay, prefetch, and the 403

New **`src/lib/utils/listening-audio.ts`**, holding a `Map<string, string>` of `dialect|text` → object URL:

- `getAudioUrl(text, dialect)` — returns the cached object URL, or fetches `/api/text-to-speech` once and caches it. Replays and slow replay then cost **zero** API calls and play instantly.
- `prefetch(text, dialect)` — warms the cache without playing.
- `releaseAll()` — revokes every object URL, called from `onDestroy` so a 20-question round doesn't leak blobs.
- On a 403 with `requiresSubscription`, throw a typed error (or return a discriminated result) so the caller can open the paywall. **This is the gap in the current game code** — `AudioButton.svelte` handles 401/403 but the game's inline `playAudio()` does not. The play page already imports `PaywallModal` and owns `showPaywallModal`, so wiring it is a two-line change once the helper reports the reason.

In the play page, replace `playAudio()`'s TTS branch with the helper (keep its `audioUrl` branch — `word.audio_url` holds pre-recorded audio for some words and should still be preferred over TTS):

- an `$effect` on `currentIndex` autoplays the current question once, guarded by a per-index `hasAutoplayed` flag so it does not re-fire on unrelated state changes, and calls `prefetch()` for `currentIndex + 1`;
- the replay button plays from cache at the normal rate; a new "Slower" button plays the same cached blob at `rate: 0.7`.

While in here: `playAudio()` reads an `X-Playback-Rate` response header (line 474) that **the TTS endpoint never sets**, so the rate is always `1.0 * 0.9`. Drop the dead read in the helper and make the 0.9 baseline explicit. The same dead read exists in `AudioButton.svelte:84` and four other copies — leave those alone, they are outside this change.

### 4. UI for the comprehension round

Replace the `{#if currentQuestion.sentence}` branch inside the listening block (lines 989-1033):

- prompt copy: "Listen and choose what it means";
- keep the large round play button, now replay-only since audio has autoplayed, and add a "Slower (0.7×)" secondary button beneath it;
- **remove the pre-answer English translation** (line 1016) — this is the leak that makes the current round trivial;
- remove the "Show hint (sentence with blank)" toggle here; there is no blank. If a hint is wanted it should reveal the **transliteration**, never the meaning.
- options render as four English sentences in the existing grid (line 1081), which already handles correct/incorrect/selected colour states — only needs to let longer strings wrap.

In the result feedback block (line 1217), for `type === 'listening-comprehension'`:

- show the Arabic sentence, its transliteration and the correct English, with an `AudioButton` (`src/lib/components/AudioButton.svelte` — props `{text, dialect, audioUrl?, className?, children?, bypassPaywall?}`) to re-listen;
- on a wrong answer, name the axis from the selected distractor's `variesBy`: "You picked the past-tense version — the sentence was in the present." Fall back to a plain correct-answer line if `variesBy` is missing or unrecognised;
- the `{:else if !isCorrect && currentQuestion.sentence}` "Missing word:" line (line 1291) must now branch on round style — keep it for the `multiple-choice` blank path, show the reveal for comprehension.

On reuse: `src/lib/components/lesson-v2/LessonMcqStep.svelte` is a genuinely nicer MCQ component (lettered A/B/C/D badges that flip to ✓/✕, select→Check→Continue, staggered entry animation, reduced-motion handling). I am **not** proposing it here — it is styled with the CSS-var system used by the setup page, while the play page is Tailwind, so dropping it in would look like a different app and it exposes only `onContinue`, no `onAnswer`. Adopting it would be a worthwhile but separate refactor of all three game modes.

### 5. Copy

- `src/routes/learn/game/+page.svelte:222` — `getModeDescription('listening')` becomes roughly "Hear a full sentence and choose what it means".
- `src/lib/constants/game-content.ts:16-19` — the `GAME_MODE_INFO` Listening entry describes hearing a single word; update for sentence comprehension. Keep "AI" out of this user-facing copy, per project convention.
- `src/lib/constants/game-content.ts:39` — the FAQ line "Not for the listening mode, which works from audio and English" still holds; no change.

## Deliberately out of scope

Flagging these because the exploration turned them up, not to do now:

- Game play writes **no** streak or contribution-graph activity — `ActivityType` in `src/lib/helpers/track-activity.ts` has no `'game'` member.
- Items the learner gets wrong never reach the SRS deck; `wordsToReview`/`sentencesToReview` only ever land in `game_progress.words_to_review` jsonb.
- The hand-authored stories under `src/lib/constants/stories/` carry **real recorded per-sentence audio** (`/audio/<story>/sentence-audio/N.wav`). That is by far the best listening material in the repo and a strong future source for this mode — no TTS cost, real human voice.
- Four broken emoji render as `=` at lines 748, 750, 752 and 1309 of the play page. Pre-existing; not mine to fix here.

## Verification

1. `npm run dev`, go to `/learn/game`: Egyptian Arabic, **sentences**, **listening**, A1, 10 questions, start.
2. Confirm the first question **autoplays once**, shows no English before answering, and offers four English options.
3. Network tab: exactly **one** `/api/text-to-speech` call per question — replay and "Slower" must fire none — and question N+1's call happens while N is on screen.
4. Answer one wrong deliberately: the reveal shows Arabic + transliteration + correct English, a working re-listen button, and a message naming the feature missed.
5. Inspect distractor quality directly — this is the part most likely to need a second prompt pass:
   ```
   curl -s localhost:5173/api/generate-game-sentences -H 'content-type: application/json' \
     -d '{"dialect":"egyptian-arabic","difficulty":"a1","count":5,"questionStyle":"comprehension"}' | jq
   ```
   Every distractor should be a believable sentence differing from the truth in one dimension, and the three `variesBy` values should differ. If any option is absurd or unrelated, tighten the prompt.
6. Paywall path: as a non-subscriber (or with `FREE_TTS_LIMIT` temporarily lowered), confirm a 403 on autoplay opens `PaywallModal` rather than failing silently.
7. Regression: play **multiple-choice + sentences** and confirm fill-in-the-blank is unchanged (the `questionStyle` default must keep it on the old path); play **listening + words** and confirm the word round still works.
8. Complete a round and verify score, the XP toast and the review list still populate; then navigate away mid-round and back to confirm the `gameSession` snapshot restore works with the new question shape.
