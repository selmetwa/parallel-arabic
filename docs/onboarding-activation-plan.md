# Onboarding activation: scripted first conversation + inactivity nudge emails

**Status: implemented.**

## Context

A Supabase query found 230 of 894 users (25.7%) complete onboarding and then never do anything else (`last_activity_date` stays `NULL`) — 203 of those are more than 30 days past onboarding, so it's a real drop-off cliff, not a lag effect. Two changes address this:

1. **Give new users a "first win" immediately after onboarding** instead of ending on a static "you're all set" screen: a short 5-line scripted Arabic conversation ("Introducing Yourself") with graded pronunciation on the lines they speak, ending in a choice to continue into the full Tutor or go to a lesson. This gets them *speaking* Arabic inside the first two minutes of signup, before they can drift away.
2. **Catch users who still go inactive anyway** with day-1 and day-3 "you never started" nudge emails, reusing the existing Mailgun/cron infrastructure.

Investigation found the codebase already had ~80% of what Feature 1 needed, just not wired together for onboarding: `src/lib/constants/tutor-scenarios.ts` already had an `introducing-yourself` scenario with hand-authored dialog lines (levantine/egyptian-arabic/fusha only, 4 lines each), and `/tutor`'s "Learn phase" already did per-line graded pronunciation (record → `/api/speech-to-text` → Levenshtein-with-Arabic-normalization → 60% pass threshold → up to 3 attempts before skip). We reused that exact grading approach against the *fixed* hand-authored lines (no AI call), rather than the AI-expanded 9-13 item version `/tutor` uses for its own scenario picker.

---

## Feature 1: Scripted "Introducing Yourself" conversation as the new onboarding finale

### 1a. Extracted the shared grading function

`calculateWordSimilarity(transcribed, expected)` moved out of `src/routes/tutor/+page.svelte` into `src/lib/utils/pronunciation-similarity.ts` (Arabic tashkeel/letter-variant normalization + `fast-levenshtein` character-distance scoring). `tutor/+page.svelte` now imports it instead of defining it locally.

### 1b. Extended the scenario data (content, not code)

`src/lib/constants/tutor-scenarios.ts`'s `introducing-yourself` entry: added a 5th line (student, closing pleasantry) to levantine/egyptian-arabic/fusha, and added a full 5-line `darija` dialog that didn't exist before. **The darija lines were drafted from general Moroccan Darija patterns and are flagged for a native-speaker check before relying on them further.**

### 1c. New component: `src/lib/components/onboarding/OnboardingConversation.svelte`

Props: `dialect`, `proficiencyLevel`, `onFinish(destination)`. Walks the scenario's 5 lines in order: "other" lines play via `AudioButton` with a Continue button (no grading); "student" lines record via `MediaRecorder` → `/api/speech-to-text` → `calculateWordSimilarity` graded against a 60% threshold, up to 3 attempts before a Skip option appears. A persistent "Skip this practice" link is always visible. Ends on a finish screen with two choices — "Continue to Tutor" (`/tutor`) or "Go to a Lesson" (`/alphabet` for A1, else `/lessons/structured/{dialect}`). Fires `trackEvent(...)` at start/attempt/finish/skip for PostHog visibility into how the step performs.

### 1d. `src/lib/components/Onboarding.svelte`

Step 5 (previously a static "you're all set" 6-card grid) now renders `<OnboardingConversation>`. `navigateToFeature` was renamed to `finishOnboarding` (same `handleCloseModal()` + `goto(destination, { replaceState: true })` body). No changes needed to `/api/onboarding/+server.ts`, `+layout.server.ts`, or `+layout.svelte` — the `newSignup=true` / `onboarding_completed` gating is untouched.

---

## Feature 2: Day-1 / day-3 "you never started" nudge emails

Validated via a read-only Supabase query during planning: the day-1 window (`onboarding_completed_at` 24–48h ago, still `last_activity_date IS NULL`) matched 2 users, day-3 (72–96h ago) matched 1 — small, plausible daily cohorts, not the full 246 backlog.

### 2a. `src/routes/api/cron/onboarding-nudge/+server.ts` (new)

Single `GET` endpoint mirroring `send-streak-reminders/+server.ts` (CRON_SECRET check, batches of 50 via `Promise.allSettled`). Two rolling-window queries against `public.user`:

- Day-1: `onboarding_completed = true`, `last_activity_date IS NULL`, `email_notifications_enabled = true`, `email IS NOT NULL`, `onboarding_completed_at` in `[now-48h, now-24h)`.
- Day-3: same filters, `onboarding_completed_at` in `[now-96h, now-72h)`.

**No new DB columns or log table.** Since `onboarding_completed_at` is fixed per user and the cron runs once daily, each user passes through each window on exactly one run — self-limiting, the same trick `send-streak-reminders` uses with `last_activity_date`.

### 2b. `src/lib/server/email.ts`

Added `sendOnboardingNudgeEmail(email, userId, day, ctaUrl)`, matching the existing Mailgun template conventions (palette, footer, plain-text body) shared by `sendStreakReminderEmail`/`sendDailyChallengeEmail`/`sendWelcomeEmail`. Day-1 copy is gentle ("Ready when you are!"); day-3 is a bit more direct ("before you lose momentum").

### 2c. `vercel.json`

Added `{ "path": "/api/cron/onboarding-nudge", "schedule": "0 19 * * *" }` (19:00 UTC, clear of the other three crons).

### 2d. No schema migration required.

---

## Files touched

- `src/lib/components/Onboarding.svelte` (modified)
- `src/lib/components/onboarding/OnboardingConversation.svelte` (new)
- `src/lib/utils/pronunciation-similarity.ts` (new, extracted from `tutor/+page.svelte`)
- `src/routes/tutor/+page.svelte` (modified: imports the extracted function)
- `src/lib/constants/tutor-scenarios.ts` (modified: 5th lines + darija dialog)
- `src/routes/api/cron/onboarding-nudge/+server.ts` (new)
- `src/lib/server/email.ts` (modified: `sendOnboardingNudgeEmail`)
- `vercel.json` (modified: cron entry)

## Verification

**Feature 1 (manual browser test):**
1. Reset a test user's `onboarding_completed` to `false` in Supabase (or sign up fresh), land on `/?newSignup=true`.
2. Step through onboarding picking a non-A1 level and a dialect with an authored dialog (e.g. egyptian-arabic). Confirm the old "you're all set" card grid no longer appears — the 5-line conversation starts instead.
3. Click through an "other" line (audio plays via AudioButton), then record a "student" line — say it correctly and confirm a pass; say gibberish 3 times and confirm "Skip" appears.
4. Finish all 5 lines, confirm the finish screen, click "Continue to Tutor" → lands on `/tutor`. Repeat and click "Go to a Lesson" instead → lands on `/lessons/structured/{dialect}` (or `/alphabet` for an A1 run).
5. Test the darija path, and the persistent "Skip this practice" link.
6. `tutor/+page.svelte`'s Learn phase should still work unchanged after the `calculateWordSimilarity` extraction.

**Feature 2:**
1. `curl -i http://localhost:5173/api/cron/onboarding-nudge -H "Authorization: Bearer $CRON_SECRET"` → expect `{"success":true,...,"emailsSent":N}`.
2. Re-run the window query via the Supabase MCP `execute_sql` tool before enabling the cron in production, to confirm counts still look like small daily cohorts.
3. End-to-end: set a test user's `onboarding_completed_at` to `now - 25h` and `last_activity_date = NULL`, hit the cron endpoint, confirm the day-1 email arrives with the right CTA link. Repeat with `now - 73h` for day-3.
