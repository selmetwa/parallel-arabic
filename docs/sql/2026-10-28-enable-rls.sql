-- Supabase security hardening (see docs/supabase-security-plan.md)
--
-- Run ONLY after the code that switches $lib/supabaseClient to the service role key is deployed.
-- The service role bypasses RLS, so the app keeps working; anon/authenticated get nothing via PostgREST.

begin;

-- 1. Enable RLS with no policies on every public table that lacks it.
--    (word_details already has RLS + a public-read policy; left as is.)
alter table public.activity_event              enable row level security;
alter table public.daily_challenge             enable row level security;
alter table public.email_verification_token    enable row level security;
alter table public.game_progress               enable row level security;
alter table public.generated_lesson            enable row level security;
alter table public.generated_story             enable row level security;
alter table public.onboarding_event            enable row level security;
alter table public.password_reset_token        enable row level security;
alter table public.push_device                 enable row level security;
alter table public.saved_word                  enable row level security;
alter table public.self_study_sessions         enable row level security;
alter table public.stories                     enable row level security;
alter table public.structured_lesson_progress  enable row level security;
alter table public.tutor_conversation          enable row level security;
alter table public.tutor_learning_insight      enable row level security;
alter table public.tutor_message               enable row level security;
alter table public."user"                      enable row level security;
alter table public.user_daily_activity         enable row level security;
alter table public.user_key                    enable row level security;
alter table public.user_session                enable row level security;
alter table public.user_story_completion       enable row level security;
alter table public.user_topic_story            enable row level security;
alter table public.video                       enable row level security;
alter table public.word                        enable row level security;
alter table public.word_import_item            enable row level security;
alter table public.word_import_job             enable row level security;
alter table public.word_of_the_day             enable row level security;
alter table public.word_review                 enable row level security;
alter table public.youtube_shorts_cache        enable row level security;

-- 2. Storage: remove anonymous write/delete policies. All uploads now go through the server
--    with the service role, which bypasses storage policies.
drop policy if exists "a a2c4zp_1"                  on storage.objects; -- generated_story INSERT
drop policy if exists "a a2c4zp_2"                  on storage.objects; -- generated_story UPDATE
drop policy if exists "policy a2c4zp_1"             on storage.objects; -- generated_story INSERT
drop policy if exists "policy a2c4zp_2"             on storage.objects; -- generated_story UPDATE
drop policy if exists "audio sqaicc_1"              on storage.objects; -- generated_story_audio INSERT
drop policy if exists "audio sqaicc_2"              on storage.objects; -- generated_story_audio UPDATE
drop policy if exists "b sqaicc_1"                  on storage.objects; -- generated_story_audio UPDATE
drop policy if exists "b sqaicc_2"                  on storage.objects; -- generated_story_audio INSERT
drop policy if exists "c 1uswaj_1"                  on storage.objects; -- video UPDATE
drop policy if exists "c 1uswaj_2"                  on storage.objects; -- video INSERT
drop policy if exists "lesson_policy ocidpk_1"      on storage.objects; -- generated_lesson INSERT
drop policy if exists "lesson_policy ocidpk_2"      on storage.objects; -- generated_lesson UPDATE
drop policy if exists "structured_lesson_policy 1d7ag9y_1" on storage.objects; -- structured_lesson INSERT
drop policy if exists "structured_lesson_policy 1d7ag9y_2" on storage.objects; -- structured_lesson UPDATE
drop policy if exists "self_study_policy 183s3ie_1" on storage.objects; -- generated_self_study UPDATE
drop policy if exists "self_study_policy 183s3ie_2" on storage.objects; -- generated_self_study INSERT
drop policy if exists "self_study_policy 183s3ie_3" on storage.objects; -- generated_self_study DELETE

-- Duplicate SELECT policies (an identical one remains for each bucket)
drop policy if exists "policy a2c4zp_0"             on storage.objects; -- dup of "a a2c4zp_0"
drop policy if exists "b sqaicc_0"                  on storage.objects; -- dup of "audio sqaicc_0"

commit;

-- Verify (should list no tables):
--   select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
--
-- Rollback, if something breaks:
--   alter table public.<table> disable row level security;   -- per table above
--   storage write policies would need to be recreated, e.g.
--   create policy "lesson_policy ocidpk_1" on storage.objects for insert to public
--     with check (bucket_id = 'generated_lesson');
