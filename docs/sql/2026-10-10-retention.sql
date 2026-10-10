-- Retention work (docs/retention-plan.md). Run before deploying the branch.

-- 1. The learner's time zone, so streak days and reminders follow their clock.
--    Null means UTC (what every streak used until now).
alter table public."user" add column if not exists timezone text;

-- 2. Streak freezes: one earned every 7 streak days, up to 2 held. A missed day
--    uses one up instead of resetting the streak.
alter table public."user" add column if not exists streak_freezes smallint not null default 0;

-- 3. When the last streak reminder went out, so the reminder runs (four a day,
--    six hours apart) never email the same person twice in one evening.
alter table public."user" add column if not exists streak_reminder_sent_at bigint;

-- 4. Daily game challenge completions reuse daily_challenge (one row per user per
--    day, already enforced by daily_challenge_user_date_unique).
alter table public.daily_challenge drop constraint if exists daily_challenge_challenge_type_check;
alter table public.daily_challenge add constraint daily_challenge_challenge_type_check
  check (challenge_type in ('story', 'sentence', 'game'));
