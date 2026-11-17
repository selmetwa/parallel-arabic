-- Country variety inside the learner's dialect: 'lebanese' for Levantine, 'kuwaiti' for Khaleeji.
-- Null means the dialect's default (see src/lib/constants/varieties.ts).
-- Run before setting NUR_ENABLED = true (docs/nur-voices-and-varieties-plan.md).

alter table public."user"
  add column if not exists target_variety text;
