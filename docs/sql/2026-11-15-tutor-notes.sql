-- Tutor notes (see docs/plans/2026-11-15-tutor-notes-lessons.md)
--
-- Run BEFORE deploying the code that reads/writes tutor_lesson. Additive only.
-- One row per upload: the extracted words/concepts, what the learner kept, and the built lesson's storage path.

begin;

create table if not exists public.tutor_lesson (
  id           text primary key,
  user_id      text not null,
  title        text not null,
  dialect      text not null,
  source_text  text not null,
  extraction   jsonb not null,                    -- { items: [...], uncovered: [...] }
  selection    jsonb,                             -- indexes into extraction.items the learner kept
  status       text not null default 'extracted', -- extracted | building | ready | failed
  error        text,
  storage_path text,                              -- structured_lesson bucket: tutor-v2/{user_id}/{id}.json
  word_count   integer,
  step_count   integer,
  build_started_at bigint,                        -- lets the page spot a build that died mid-way
  created_at   bigint not null
);

create index if not exists tutor_lesson_user_idx on public.tutor_lesson (user_id, created_at desc);

-- The app reaches this table through the service role key only (see 2026-10-28-enable-rls.sql).
alter table public.tutor_lesson enable row level security;

-- Tutor lessons save their resume point under their own content type, so the home page's
-- "continue lesson" card and the retention email (both curriculum-only) leave them alone.
alter table public."user" drop constraint if exists user_last_content_type_check;
alter table public."user" add constraint user_last_content_type_check check (
  last_content_type = any (array['sentences', 'lessons', 'stories', 'vocabulary', 'alphabet', 'review', 'tutor-notes'])
);

commit;
