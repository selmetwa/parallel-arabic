-- Migration: add daily challenges feature
-- Run this in your Supabase SQL editor

CREATE TABLE public.daily_challenge (
  id              text NOT NULL,
  user_id         text NOT NULL,
  challenge_date  bigint NOT NULL,
  challenge_type  text NOT NULL CHECK (challenge_type IN ('story', 'sentence')),
  dialect         text NOT NULL,
  story_id        text,
  sentences       jsonb,
  used_word_ids   jsonb,
  bonus_xp        integer NOT NULL DEFAULT 10,
  completed       boolean NOT NULL DEFAULT false,
  completed_at    bigint,
  xp_awarded      boolean NOT NULL DEFAULT false,
  created_at      bigint NOT NULL,
  CONSTRAINT daily_challenge_pkey PRIMARY KEY (id),
  CONSTRAINT daily_challenge_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id),
  CONSTRAINT daily_challenge_story_fkey FOREIGN KEY (story_id) REFERENCES public.generated_story(id),
  CONSTRAINT daily_challenge_user_date_unique UNIQUE (user_id, challenge_date)
);

CREATE INDEX daily_challenge_user_id_idx ON public.daily_challenge (user_id);
CREATE INDEX daily_challenge_date_idx ON public.daily_challenge (challenge_date);
