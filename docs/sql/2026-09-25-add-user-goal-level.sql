-- Onboarding goal screen: the CEFR level a learner is aiming for.
-- Nullable: the goal step can be skipped, and existing users have no goal.
alter table public."user" add column if not exists goal_level text;

alter table public."user" drop constraint if exists user_goal_level_check;
alter table public."user" add constraint user_goal_level_check
  check (goal_level is null or goal_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
