-- Daily quests: one row per learner per local day on which all three quests
-- were done and the reward (bonus XP, and a streak freeze on the 5th day of a
-- week) was paid (docs/today-path-and-quests-plan.md). Run before deploying.
--
-- Until this runs, the quests card still shows and counts progress, but the
-- reward can't be claimed.

create table if not exists public.quest_claim (
  user_id text not null references public."user"(id) on delete cascade,
  -- The learner's local calendar day, e.g. '2026-11-24'.
  day_key text not null,
  claimed_at bigint not null,
  primary key (user_id, day_key)
);

-- The app reaches this table through the service role key only (see 2026-10-28-enable-rls.sql).
alter table public.quest_claim enable row level security;
