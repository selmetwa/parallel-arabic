-- Allow Iraqi, Khaleeji and Saudi (Hijazi) everywhere a dialect is constrained.
-- See docs/iraqi-khaleeji-saudi-plan.md. Safe to run before launch: the app keeps
-- these dialects out of pickers until they are marked selectable.

begin;

alter table public."user" drop constraint user_target_dialect_check;
alter table public."user" add constraint user_target_dialect_check
	check (target_dialect = any (array['egyptian-arabic', 'fusha', 'levantine', 'darija', 'iraqi', 'khaleeji', 'saudi']));

alter table public."user" drop constraint user_last_content_dialect_check;
alter table public."user" add constraint user_last_content_dialect_check
	check (last_content_dialect = any (array['egyptian-arabic', 'fusha', 'levantine', 'darija', 'iraqi', 'khaleeji', 'saudi']));

alter table public.generated_lesson drop constraint generated_lesson_dialect_check;
alter table public.generated_lesson add constraint generated_lesson_dialect_check
	check (dialect = any (array['egyptian-arabic', 'fusha', 'levantine', 'darija', 'iraqi', 'khaleeji', 'saudi']));

alter table public.structured_lesson_progress drop constraint structured_lesson_progress_dialect_check;
alter table public.structured_lesson_progress add constraint structured_lesson_progress_dialect_check
	check (dialect = any (array['egyptian-arabic', 'fusha', 'levantine', 'darija', 'iraqi', 'khaleeji', 'saudi', 'alphabet']));

alter table public.game_progress drop constraint game_progress_dialect_check;
alter table public.game_progress add constraint game_progress_dialect_check
	check (dialect = any (array['egyptian-arabic', 'fusha', 'levantine', 'darija', 'iraqi', 'khaleeji', 'saudi']));

alter table public.word_of_the_day drop constraint word_of_the_day_dialect_check;
alter table public.word_of_the_day add constraint word_of_the_day_dialect_check
	check (dialect = any (array['egyptian-arabic', 'fusha', 'levantine', 'darija', 'iraqi', 'khaleeji', 'saudi']));

-- Example sentences for Word of the Day, alongside example_egyptian etc.
alter table public.word_of_the_day add column if not exists example_iraqi text;
alter table public.word_of_the_day add column if not exists example_khaleeji text;
alter table public.word_of_the_day add column if not exists example_saudi text;

commit;
