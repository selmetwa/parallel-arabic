-- Onboarding habit questions (docs/onboarding-questions-plan.md). Run before
-- deploying the branch: the reminder crons select reminder_window and streak_goal.

-- What they find hard, e.g. {speaking,vocabulary}.
alter table public."user" add column if not exists learning_challenges text[];
-- Minutes a day they said they can study (5, 10, 15, 20 or 30).
alter table public."user" add column if not exists daily_minutes smallint;
-- When the one daily reminder may go out: morning, afternoon, evening, night or off.
-- Null means evening, the only window there was before.
alter table public."user" add column if not exists reminder_window text;
-- The streak they committed to: 7, 14, 30 or 50 days.
alter table public."user" add column if not exists streak_goal smallint;
