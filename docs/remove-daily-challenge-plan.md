# Remove the Daily Challenge feature

## Context
A daily challenge (a 5-sentence story or a 3-sentence exercise) is generated for every active user. The 02:00 UTC cron does this in batches of 15, and the home page lazily generates one for anyone the cron missed. Each challenge costs a Gemini call and a storage upload, and the stories also send an email. Since 2026-03-19, 76 of 1,380 story challenges were completed (5.5%) and 105 of 1,401 sentence challenges (7.5%). The user chose to remove the whole feature, which ends all automatic generation.

Save a copy of this plan as `docs/remove-daily-challenge-plan.md` (per the repo convention).

## Changes

### Delete outright
- `src/routes/api/cron/generate-daily-challenges/` (the cron endpoint)
- `src/routes/api/daily-challenge/` (GET/POST for lazy generation, plus `[id]/complete` for bonus XP)
- `src/lib/server/challenge-generator.ts` (its only callers are the two endpoints above)
- `src/routes/challenge/[id]/` (the sentence-challenge page)

### Edit
- **`vercel.json`**: remove the `/api/cron/generate-daily-challenges` cron entry.
- **`src/lib/server/email.ts`**: remove `sendDailyChallengeEmail` (~lines 195–300). The cron was its only caller.
- **`src/routes/+page.server.ts`**:
  - Remove the `daily_challenge` query from the `Promise.all` (~line 146) and its destructured result.
  - Remove the `dailyChallenge` / `shouldGenerateChallenge` variables and the handling at ~180–186.
  - Remove the "Priority 0: Daily challenge" suggestion block (~268–280) and `shouldGenerateChallenge` from the returned data.
  - Keep `todayMidnight`, which other queries still use.
- **`src/routes/+page.svelte`**:
  - Remove the `challengeGenerating` / `generatedChallengeHref` state, the `dailyChallengeSuggestion` derived value, and the lazy-generation block in `onMount`.
  - Remove the hero tile branches at ~206–210.
  - Simplify the `{#if}` condition (~183) and the `mt-2.5` class condition (~213).
  - `otherSuggestions` can keep filtering only `'review'`.
- **`src/routes/generated_story/[id]/+page.server.ts`**: drop `challengeId` from the returned data.
- **`src/routes/generated_story/[id]/+page.svelte`**: in `handleMarkStoryDone`, remove the `challengeId` variable, the bonus-XP block, and the `is_daily_challenge` tracking prop. Use `result.*` directly for the XP toast.

### Leave as-is
- **`daily_challenge` table and existing `generated_story` rows**: keep them as history. No migration. They can be dropped later if wanted.
- **`src/routes/history/+page.server.ts`**: keep the daily-challenge exclusion filter because the old rows still exist.
- **Old email links to `/challenge/<id>`**: these will 404 after the deletion. That's acceptable given 1–2% engagement. If you'd rather, a one-line `+page.server.ts` redirect to `/` could stay at that path instead.
- **`src/routes/privacy/+page.svelte`**: the "Daily challenge completion" line is historical data we still hold, so leave it or trim it (your call).
- **Unrelated dead code**: `src/lib/components/BakerLoader.svelte` ("Baking your daily challenge...") appears unused already. I'll mention it, not delete it.

## Verification
1. `grep -rniE "daily.?challenge|challenge-generator|sendDailyChallengeEmail" src vercel.json` should only match history/+page.server.ts, privacy, and BakerLoader.
2. `npm run check` and `npm run build` pass. Run svelte-autofixer on the edited `.svelte` files.
3. `npm run dev`, log in, and load `/`. No POST to `/api/daily-challenge`, no Daily Challenge tile, and the other suggestions render. Open a generated story and click "mark done": the XP toast still appears.
4. After deploy, the Vercel dashboard crons list shows 3 crons, and no new `daily_challenge` rows appear the next day (`select max(created_at) from daily_challenge`).
