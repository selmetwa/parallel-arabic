-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.email_verification_token (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  expires bigint NOT NULL,
  CONSTRAINT email_verification_token_pkey PRIMARY KEY (id),
  CONSTRAINT email_verification_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.generated_story (
  id text NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL,
  story_body text NOT NULL,
  dialect text NOT NULL,
  created_at text NOT NULL,
  audio_file_key text,
  CONSTRAINT generated_story_pkey PRIMARY KEY (id),
  CONSTRAINT generated_story_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.password_reset_token (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  expires bigint NOT NULL,
  CONSTRAINT password_reset_token_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.saved_word (
  id text NOT NULL,
  user_id text NOT NULL,
  arabic_word text NOT NULL,
  english_word text NOT NULL,
  transliterated_word text NOT NULL,
  created_at bigint NOT NULL,
  word_id text,
  ease_factor real DEFAULT 2.5,
  interval_days integer DEFAULT 0,
  repetitions integer DEFAULT 0,
  next_review_date bigint,
  last_review_date bigint,
  is_learning boolean DEFAULT true,
  mastery_level integer DEFAULT 0,
  dialect text,
  CONSTRAINT saved_word_pkey PRIMARY KEY (id),
  CONSTRAINT saved_word_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id),
  CONSTRAINT fk_saved_word_word_id FOREIGN KEY (word_id) REFERENCES public.word(id)
);
CREATE TABLE public.stories (
  id character varying NOT NULL,
  title character varying NOT NULL,
  key character varying NOT NULL,
  description text NOT NULL,
  difficulty integer NOT NULL,
  created_at bigint NOT NULL,
  CONSTRAINT stories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL,
  is_subscriber boolean NOT NULL,
  subscriber_id text,
  subscription_end_date bigint,
  sentences_viewed integer,
  verb_conjugation_tenses_viewed integer,
  google_id text,
  auth_provider text,
  name text,
  picture text,
  supabase_auth_id uuid,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_key (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  hashed_password character varying,
  CONSTRAINT user_key_pkey PRIMARY KEY (id),
  CONSTRAINT user_key_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.user_session (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  active_expires bigint NOT NULL,
  idle_expires bigint NOT NULL,
  CONSTRAINT user_session_pkey PRIMARY KEY (id),
  CONSTRAINT user_session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.video (
  id text NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  url text NOT NULL,
  thumbnail_url text NOT NULL,
  dialect text NOT NULL,
  created_at text NOT NULL,
  video_body text NOT NULL,
  CONSTRAINT video_pkey PRIMARY KEY (id),
  CONSTRAINT video_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.word (
  id text NOT NULL,
  arabic_word text NOT NULL,
  english_word text NOT NULL,
  transliterated_word text NOT NULL,
  dialect text NOT NULL,
  category text NOT NULL,
  audio_url text,
  frequency integer,
  source text NOT NULL DEFAULT 'api'::text,
  created_at bigint NOT NULL DEFAULT EXTRACT(epoch FROM now()),
  updated_at bigint NOT NULL DEFAULT EXTRACT(epoch FROM now()),
  CONSTRAINT word_pkey PRIMARY KEY (id)
);
CREATE TABLE public.word_review (
  id text NOT NULL,
  saved_word_id text NOT NULL,
  user_id text NOT NULL,
  difficulty integer NOT NULL CHECK (difficulty >= 1 AND difficulty <= 3),
  ease_factor real NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  reviewed_at bigint NOT NULL,
  next_review_date bigint NOT NULL,
  created_at bigint NOT NULL,
  dialect text,
  CONSTRAINT word_review_pkey PRIMARY KEY (id),
  CONSTRAINT word_review_saved_word_id_fkey FOREIGN KEY (saved_word_id) REFERENCES public.saved_word(id),
  CONSTRAINT word_review_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);