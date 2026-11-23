# Faster content generation: thinking off + drop sentence tashkeel pass

## Context
Content generation (stories, sentences, lessons, vocab, tutor) is slow. Two causes:
1. `gemini-2.5-flash` thinks by default before answering. Only lesson-v2 and games disable it. These calls are formatting/translation jobs that gain little from reasoning.
2. `generate-sentences` and `generate-sentences-egyptian` make a second sequential Gemini call (`addTashkeelToSentences`) to replace the `arabicTashkeel` the first call already returned. On stories the same pass roughly doubled the total time and failed every time anyway; it was removed from the story endpoints earlier but not from these two.

Goal: same output, noticeably lower wall time.

## Change 1: default thinking off, in one place
All 34 Gemini call sites go through `generateContentWithRetry` in `src/lib/utils/gemini-api-retry.ts` (~line 122). Set the default there instead of editing ~30 call sites:

- For the **primary call**: if `params.model` starts with `gemini-2.5-flash` and `params.config?.thinkingConfig` is undefined, call with `{ ...params, config: { ...params.config, thinkingConfig: { thinkingBudget: 0 } } }`.
- Callers that set `thinkingConfig` themselves keep it (`games/generate.ts` passes its own `thinkingBudget`, `lesson-v2-generation.ts`, `health-checks.ts`).
- The **fallback path** (`gemini-3.1-flash-lite-preview`) keeps using the caller's original `params`, so no 2.5-style budget is sent to a Gemini 3 model.
- Update the file's doc comment to say thinking is off by default for 2.5 Flash, and how to turn it back on (pass `thinkingConfig`).
- This also covers `generate-self-study`. Its settings still sit under the ignored `generationConfig` key, but it does pass a real `config` with `systemInstruction`, so the default thinking setting still applies.

## Change 2: remove the dedicated tashkeel pass
In `src/routes/api/generate-sentences/+server.ts` (~line 380) and `src/routes/api/generate-sentences-egyptian/+server.ts` (~line 333):
- Delete the "Replace arabicTashkeel with a validated dedicated tashkeel pass" block and the `addTashkeelToSentences` import. The existing clean-up map already falls back `arabicTashkeel || arabic`.
- `src/lib/utils/add-tashkeel.ts` has no other importers after this, so delete it (orphan created by this change).

## Verification
1. Unit test `src/lib/utils/gemini-api-retry.test.ts` (vitest, fake `ai.models.generateContent` that records params):
   - 2.5-flash with no thinkingConfig → called with `thinkingBudget: 0`.
   - Caller-supplied thinkingConfig is preserved.
   - Non-2.5 model is passed through unchanged.
   Run `npx vitest run src/lib/utils/gemini-api-retry.test.ts`.
2. `npm run check`: no new type errors in touched files.
3. User checks in the browser (I don't take screenshots): generate a story and a sentence set (review → Generate Sentences) and compare speed/quality against current prod. Server logs show response lengths and timings.

## Afterwards
Copy this plan to `docs/` in the repo (per project convention). Commit on a branch off master only when the user asks.
