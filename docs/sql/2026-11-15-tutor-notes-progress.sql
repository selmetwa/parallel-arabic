-- Tutor notes: each lesson remembers its own resume step (see docs/plans/2026-11-15-tutor-notes-lessons.md).
-- Run after 2026-11-15-tutor-notes.sql, before deploying the code that reads tutor_lesson.last_step.

begin;

alter table public.tutor_lesson
  add column if not exists last_step integer not null default 0; -- 0-based index of the step to reopen at

-- One-off: the lesson tested on 2026-11-15 was left at step 70 of 236 before resume was saved per lesson.
update public.tutor_lesson set last_step = 69 where id = '3bd4eb92-9201-4838-a4a3-ac007406e3a7';

commit;
