-- Retention: daily goal, activity log, weekly recap and comeback emails
-- (docs/retention-daily-goal-plan.md). Run before deploying the branch.

-- Up to three {kind, target} items, e.g. [{"kind":"game","target":1},{"kind":"speak","target":5}].
alter table public."user" add column if not exists daily_goal jsonb;
-- When the Sunday recap and the 3/7-day comeback email last went out (ms).
alter table public."user" add column if not exists weekly_email_sent_at bigint;
alter table public."user" add column if not exists comeback_email_sent_at bigint;

-- Activity with no table of its own, counted toward the daily goal:
-- 'game' (a round started) and 'speak' (a sentence transcribed).
create table if not exists public.activity_event (
  id bigint generated always as identity primary key,
  user_id text not null references public."user"(id) on delete cascade,
  kind text not null,
  created_at bigint not null
);
create index if not exists activity_event_user_kind_created_idx
  on public.activity_event (user_id, kind, created_at);
