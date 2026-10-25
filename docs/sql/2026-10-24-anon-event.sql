-- Game funnel events from signed-out visitors (onboarding_event needs a user).
-- Run before deploying the branch. Until it exists, /api/onboarding/event logs
-- the insert error and carries on.
--
-- anon_id is a random id kept in the visitor's browser. Once they sign up, the
-- game_account_created event in onboarding_event carries the same anon_id in
-- its props, which joins the two halves of the funnel.

create table if not exists public.anon_event (
  id bigint generated always as identity primary key,
  anon_id text not null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists anon_event_event_created_idx on public.anon_event (event, created_at);
create index if not exists anon_event_anon_idx on public.anon_event (anon_id);

-- The server writes with the publishable key. Allow inserts only, so the
-- table can't be read through the public API.
alter table public.anon_event enable row level security;
drop policy if exists anon_event_insert on public.anon_event;
create policy anon_event_insert on public.anon_event for insert to anon, authenticated with check (true);
