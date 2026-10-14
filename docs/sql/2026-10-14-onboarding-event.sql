-- Onboarding funnel events (docs/onboarding-v3-plan.md). Run before deploying the branch.
-- Until it exists, /api/onboarding/event logs the insert error and carries on.

create table if not exists public.onboarding_event (
  id bigint generated always as identity primary key,
  user_id text not null references public."user"(id) on delete cascade,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists onboarding_event_event_created_idx on public.onboarding_event (event, created_at);
create index if not exists onboarding_event_user_idx on public.onboarding_event (user_id);
