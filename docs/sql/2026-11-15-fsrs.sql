-- FSRS scheduling (see docs/plans/2026-11-15-fsrs-review-redesign.md)
--
-- Additive: run BEFORE deploying the code that reads/writes these columns.
-- Old code keeps working against this schema (new columns have defaults, difficulty is still accepted).

begin;

-- 1. Card state for FSRS on saved_word.
alter table public.saved_word
  add column if not exists fsrs_stability  real,
  add column if not exists fsrs_difficulty real,
  add column if not exists fsrs_state      smallint not null default 0, -- 0 New, 1 Learning, 2 Review, 3 Relearning
  add column if not exists lapses          integer  not null default 0;

-- 2. Review log: 1-4 rating (Again/Hard/Good/Easy) replaces the old 1-3 difficulty.
alter table public.word_review
  add column if not exists rating          smallint check (rating between 1 and 4),
  add column if not exists fsrs_stability  real,
  add column if not exists fsrs_difficulty real,
  add column if not exists fsrs_state      smallint,
  alter column difficulty drop not null;

alter table public.word_review drop constraint if exists word_review_difficulty_check;

-- 3. Convert existing review history.
--    interval_days -> stability (days until recall drops to 90%)
--    ease 1.3..2.5  -> difficulty 8..4 (FSRS scale 1-10, higher = harder)
update public.saved_word set
  fsrs_state      = 2,
  fsrs_stability  = greatest(coalesce(interval_days, 0), 1),
  fsrs_difficulty = least(10, greatest(1, 8 - (coalesce(ease_factor, 2.5) - 1.3) * (4 / 1.2))),
  next_review_date = coalesce(next_review_date, (extract(epoch from now()) * 1000)::bigint),
  is_learning     = greatest(coalesce(interval_days, 0), 1) < 21,
  -- same buckets as masteryLevel() in src/lib/srs/fsrs.ts (stability is >= 1 here, so never level 1)
  mastery_level   = case
    when greatest(coalesce(interval_days, 0), 1) < 7  then 2
    when greatest(coalesce(interval_days, 0), 1) < 21 then 3
    when greatest(coalesce(interval_days, 0), 1) < 90 then 4
    else 5
  end
where coalesce(repetitions, 0) > 0
  and fsrs_state = 0; -- only words not yet converted, so re-running never clobbers FSRS progress

commit;
