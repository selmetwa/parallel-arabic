-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.email_verification_token (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  expires bigint NOT NULL,
  CONSTRAINT email_verification_token_pkey PRIMARY KEY (id),
  CONSTRAINT email_verification_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.generated_lesson (
  id text NOT NULL,
  user_id text NOT NULL,
  title text,
  title_arabic text,
  description text,
  level text NOT NULL CHECK (level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  dialect text NOT NULL CHECK (dialect = ANY (ARRAY['egyptian-arabic'::text, 'fusha'::text, 'levantine'::text, 'darija'::text])),
  lesson_body text NOT NULL,
  sub_lesson_count integer,
  estimated_duration integer,
  created_at text NOT NULL,
  CONSTRAINT generated_lesson_pkey PRIMARY KEY (id),
  CONSTRAINT generated_lesson_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
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
  forgotten_in_session boolean DEFAULT false,
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
CREATE TABLE public.structured_lesson_progress (
  id text NOT NULL,
  user_id text NOT NULL,
  topic_id text NOT NULL,
  dialect text NOT NULL CHECK (dialect = ANY (ARRAY['egyptian-arabic'::text, 'fusha'::text, 'levantine'::text, 'darija'::text])),
  status text NOT NULL DEFAULT 'not_started'::text CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])),
  started_at bigint,
  completed_at bigint,
  last_accessed_at bigint,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at bigint NOT NULL DEFAULT EXTRACT(epoch FROM now()),
  updated_at bigint NOT NULL DEFAULT EXTRACT(epoch FROM now()),
  CONSTRAINT structured_lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT structured_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.tutor_conversation (
  id text NOT NULL,
  user_id text NOT NULL,
  dialect text NOT NULL,
  created_at bigint NOT NULL,
  ended_at bigint,
  summary text,
  topics_discussed ARRAY,
  new_vocabulary ARRAY,
  CONSTRAINT tutor_conversation_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_conversation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.tutor_learning_insight (
  id text NOT NULL,
  user_id text NOT NULL,
  dialect text NOT NULL,
  insight_type text NOT NULL CHECK (insight_type = ANY (ARRAY['weakness'::text, 'strength'::text, 'topic_interest'::text, 'vocabulary_gap'::text])),
  content text NOT NULL,
  confidence real DEFAULT 0.5,
  occurrences integer DEFAULT 1,
  last_observed_at bigint NOT NULL,
  created_at bigint NOT NULL,
  CONSTRAINT tutor_learning_insight_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_learning_insight_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.tutor_message (
  id text NOT NULL,
  conversation_id text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'tutor'::text])),
  arabic text,
  english text,
  transliteration text,
  feedback text,
  created_at bigint NOT NULL,
  CONSTRAINT tutor_message_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_message_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.tutor_conversation(id)
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
  target_dialect text CHECK (target_dialect = ANY (ARRAY['egyptian-arabic'::text, 'fusha'::text, 'levantine'::text, 'darija'::text])),
  learning_reason text,
  proficiency_level text CHECK (proficiency_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text])),
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at bigint,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date bigint,
  total_reviews integer DEFAULT 0,
  total_sentences_viewed integer DEFAULT 0,
  total_stories_viewed integer DEFAULT 0,
  total_lessons_viewed integer DEFAULT 0,
  total_saved_words integer DEFAULT 0,
  reviews_this_week integer DEFAULT 0,
  sentences_viewed_this_week integer DEFAULT 0,
  stories_viewed_this_week integer DEFAULT 0,
  lessons_viewed_this_week integer DEFAULT 0,
  saved_words_this_week integer DEFAULT 0,
  week_start_date bigint,
  daily_review_limit integer DEFAULT 20,
  show_arabic boolean DEFAULT true,
  show_transliteration boolean DEFAULT true,
  show_english boolean DEFAULT true,
  preferred_font_size text DEFAULT 'medium'::text CHECK (preferred_font_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text])),
  last_content_type text CHECK (last_content_type = ANY (ARRAY['sentences'::text, 'lessons'::text, 'stories'::text, 'vocabulary'::text, 'alphabet'::text, 'review'::text])),
  last_content_id text,
  last_content_position integer DEFAULT 0,
  last_content_dialect text CHECK (last_content_dialect = ANY (ARRAY['egyptian-arabic'::text, 'fusha'::text, 'levantine'::text, 'darija'::text])),
  last_content_accessed_at bigint,
  total_shorts_viewed integer DEFAULT 0,
  shorts_viewed_this_week integer DEFAULT 0,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_daily_activity (
  id text NOT NULL,
  user_id text NOT NULL,
  activity_date bigint NOT NULL,
  reviews_count integer DEFAULT 0,
  sentences_viewed integer DEFAULT 0,
  stories_viewed integer DEFAULT 0,
  lessons_viewed integer DEFAULT 0,
  saved_words_count integer DEFAULT 0,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL,
  shorts_viewed integer DEFAULT 0,
  CONSTRAINT user_daily_activity_pkey PRIMARY KEY (id),
  CONSTRAINT user_daily_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
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
CREATE TABLE public.youtube_shorts_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dialect text NOT NULL,
  search_query text NOT NULL,
  response jsonb NOT NULL,
  next_page_token text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '06:00:00'::interval),
  CONSTRAINT youtube_shorts_cache_pkey PRIMARY KEY (id)
);