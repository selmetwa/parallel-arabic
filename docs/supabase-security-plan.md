# Supabase security hardening: RLS + storage policies

## Context

The Supabase security advisor reports **29 public tables with RLS disabled**, plus
"Sensitive Columns Exposed" on `push_device.token`. A read-only audit confirmed it's worse
than a lint warning: for **every** public table, the `anon` role has SELECT/INSERT/UPDATE/DELETE,
and the publishable key ships in every page. Anyone can call
`GET https://<project>.supabase.co/rest/v1/user?select=*` with that key and read or overwrite
all users, sessions (`user_session`, `user_key`), reset/verification tokens, push tokens,
tutor conversations and so on.

Why we can't just enable RLS: the app does almost all DB work through
`src/lib/supabaseClient.ts`, which uses the **publishable (anon) key** (~80 server files plus
2 browser call sites). The app's `user.id` is its own id (linked via `user.supabase_auth_id`),
not `auth.uid()`, so per-user policies don't fit either. Enabling RLS today would empty every
query and take the site down.

**Approach:** all table access goes through the server with the **service role key** (which
bypasses RLS). Then enable RLS with **no policies** on all 29 tables, so `anon` and
`authenticated` get nothing through PostgREST. The Capacitor iOS/Android app only wraps
https://www.parallel-arabic.com (`capacitor.config.ts`), so it has no direct DB access.

## Audit findings (advisor + my own)

| # | Severity | Finding |
|---|---|---|
| 1 | Critical | RLS off on 29 public tables, anon has full read/write (covers all 15 items you pasted, plus `video`, `daily_challenge`, `game_progress`, `tutor_*`, `self_study_sessions`, `user_story_completion`, `user_topic_story`, `activity_event`, `onboarding_event`, `structured_lesson_progress`, `word_import_*`, `youtube_shorts_cache`) |
| 2 | Critical | `push_device.token` exposed (same root cause as #1) |
| 3 | High | Storage: `public`-role INSERT/UPDATE policies on **every** bucket (`generated_story`, `generated_story_audio`, `video`, `generated_lesson`, `structured_lesson`, `generated_self_study`) plus DELETE on `generated_self_study`. Anyone can upload, overwrite or delete lesson/story/audio files. Several duplicate policies (`a a2c4zp_*` / `policy a2c4zp_*`, `audio sqaicc_*` / `b sqaicc_*`) |
| 4 | Medium | OAuth callback (`src/routes/auth/callback-supabase/+server.ts`) calls `exchangeCodeForSession` on the **shared** module-level client, so a user's session gets stored on a client that all requests share |
| 5 | Medium | Leaked password protection disabled (advisor WARN) |
| 6 | Low | Private buckets have public SELECT policies, so anyone can list/download all generated stories, audio and self-study files |
| 7 | Low | `GET /api/stories?userId=…` is unauthenticated and returns any user's generated stories |
| 8 | Low | Stripe webhook secret is named `PUBLIC_WEBHOOK_SECRET` (`$env/static/public`). It's only imported server-side today, but the `PUBLIC_` prefix means any future client import would ship it |

No public SQL functions exist (so no SECURITY DEFINER / search_path issues). Side note:
`track-activity.ts` calls `rpc('increment_daily_activity')`, which doesn't exist, so it always
falls back to the manual update. Not a security issue; leaving it alone.

## Implementation

### Step 0: save the plan
Copy this plan to `docs/supabase-security-plan.md` (repo convention).

### Step 1: switch the shared client to the service role (code)
- `src/lib/supabaseClient.ts`: use `SUPABASE_SERVICE_ROLE_KEY` from `$env/static/private`
  with `{ auth: { persistSession: false, autoRefreshToken: false } }`, and add a comment
  that it's server-only. SvelteKit fails the build if a client bundle imports
  `$env/static/private`, which guarantees the key can't leak. This mirrors the existing
  `src/lib/server/supabase-auth.ts` / `src/lib/server/dictionary.ts` admin clients.
- `src/lib/helpers/storage-helpers.ts`: it has its own anon `createClient`. Import
  `supabase` from `$lib/supabaseClient` instead (all its importers are server-side).

### Step 2: remove browser-side table/client access
These would fail the build after Step 1:
- `src/lib/helpers/fetch-review-words.ts` (8 browser callers: speak, sentences, stories,
  quiz, generated_story, Create*Modal, GenerateSentencesModal). Move the existing query into a
  new `GET /api/review-words-list?source=all|due-for-review` endpoint that uses the session user
  (`locals.auth.validate()`, same pattern as `src/routes/api/review-words-all/+server.ts`).
  The helper becomes a `fetch` wrapper. Drop the `userId` param, since the server uses the
  session user, and update the 8 call sites.
- `src/lib/components/BookmarkButton.svelte`: `checkIfSaved()` queries `saved_word` from the
  browser. It's currently broken anyway: it compares the auth uuid to the app `user_id`.
  Add a `GET` handler to `src/routes/api/save-word/+server.ts` (`?arabic=` → `{ saved }`) and
  call it.
- `src/routes/auth/reset-password/+page.svelte`: drop the `$lib/supabaseClient` import and use
  `$page.data.supabase` only (`+layout.ts` always provides it).
- `src/lib/utils/api-client.ts`: has no importers (dead code), so nothing gets bundled. Leave it.

### Step 3: fix the remaining anon-key table queries on the server
- `src/hooks.server.ts:113`: the `user` lookup by `supabase_auth_id` uses `event.locals.supabase`.
  Switch it to the admin `supabase`. Keep `locals.supabase` for `auth.*` only.
- `src/routes/stories/+page.server.ts:55-59` and `src/routes/generated_story/[id]/+page.server.ts:40`:
  same switch.
- `src/routes/auth/callback-supabase/+server.ts`: create a per-request anon client just for
  `exchangeCodeForSession`. Keep the admin client for the `user` select and
  `syncSupabaseUserWithDB` (fixes finding #4).
- Grep for any other `.from(` on `locals.supabase` / `data.supabase` and switch those too.

**Deploy Steps 1–3 first.** The service role works with RLS off, so this ships with no
behavior change.

### Step 4: enable RLS (SQL, run by you; MCP is read-only)
`docs/sql/2026-10-28-enable-rls.sql`:
```sql
alter table public.<each of the 29 tables> enable row level security;
```
No policies, so anon and authenticated are denied and service_role bypasses.
`word_details` already has RLS plus a public-read policy, so leave it as is.
Rollback: the same file with `disable`.

### Step 5: lock down storage writes (SQL)
Same file (or `…-storage-policies.sql`): drop every `public`-role INSERT/UPDATE/DELETE policy
on `storage.objects` (the `*_1`, `*_2`, `*_3` policies listed in finding #3) and the duplicate
SELECT policies. All uploads go through server code with the service role after Step 1.
Keep the SELECT policies for now (finding #6). Tightening them needs checking how the
browser loads audio/video, so it's out of scope.

### Step 6: dashboard (you)
Auth → Providers → Email → enable **Leaked password protection**.

### Optional quick fixes (low severity, need your OK)
- #7: require auth on `/api/stories` when `userId` is passed, and only allow your own id.
- #8: rename `PUBLIC_WEBHOOK_SECRET` → `STRIPE_WEBHOOK_SECRET` in `$env/static/private`
  (needs a Vercel env var change).

## Verification
1. `npm run check` and `npm run build` pass. The build proves no client bundle imports the
   service-role module.
2. After deploying Steps 1–3, before the SQL, smoke test login (email + Google OAuth),
   password reset, saving a word / bookmark state, review page, creating a story or lesson
   (storage upload), stories list, tutor, games, and the RevenueCat/Stripe webhooks.
3. Run the SQL, then repeat the smoke test.
4. Anon check: `curl "$URL/rest/v1/user?select=id&limit=1" -H "apikey: $PUBLISHABLE_KEY"`
   should return `[]`. A storage upload with the anon key should return 403.
5. Re-run `get_advisors(security)`. The RLS and sensitive-column lints should be gone.
