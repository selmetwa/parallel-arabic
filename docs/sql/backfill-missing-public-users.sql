-- Backfill public.user rows for auth users whose sync failed after RLS was enabled
-- on public.user (signups from ~2026-10-28 onward). Mirrors syncSupabaseUserWithDB's insert.
-- Run once in the Supabase SQL editor after deploying the sync fix.

insert into public."user" (
  id, email, email_verified, name, picture, is_subscriber, auth_provider,
  supabase_auth_id, sentences_viewed, verb_conjugation_tenses_viewed
)
select
  substr(md5(random()::text || a.id::text), 1, 13),
  a.email,
  0,
  a.raw_user_meta_data->>'full_name',
  a.raw_user_meta_data->>'avatar_url',
  false,
  'supabase',
  a.id,
  0,
  0
from auth.users a
left join public."user" u on u.supabase_auth_id = a.id
left join public."user" e on lower(e.email) = lower(a.email)
where u.id is null
  and e.id is null
  and a.email is not null
  and a.created_at > '2026-10-01';
