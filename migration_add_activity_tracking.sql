-- ============================================
-- Migration: Add Daily Activity Tracking & Streaks
-- ============================================

-- 1. Create user_daily_activity table for historical tracking
CREATE TABLE IF NOT EXISTS public.user_daily_activity (
  id text NOT NULL,
  user_id text NOT NULL,
  activity_date bigint NOT NULL,  -- Timestamp normalized to start of day (midnight UTC)
  reviews_count integer DEFAULT 0,
  sentences_viewed integer DEFAULT 0,
  stories_viewed integer DEFAULT 0,
  lessons_viewed integer DEFAULT 0,
  saved_words_count integer DEFAULT 0,  -- Words saved on this day
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL,
  CONSTRAINT user_daily_activity_pkey PRIMARY KEY (id),
  CONSTRAINT user_daily_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id),
  CONSTRAINT user_daily_activity_user_date_unique UNIQUE (user_id, activity_date)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date 
ON public.user_daily_activity(user_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_activity_date 
ON public.user_daily_activity(user_id, activity_date DESC) 
WHERE reviews_count > 0 OR sentences_viewed > 0 OR stories_viewed > 0 OR lessons_viewed > 0 OR saved_words_count > 0;

-- 2. Add streak and stats columns to user table
ALTER TABLE public.user 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date bigint,
-- Overall stats (cached for performance)
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sentences_viewed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_stories_viewed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_lessons_viewed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_saved_words integer DEFAULT 0,
-- Weekly stats (cached, updated daily)
ADD COLUMN IF NOT EXISTS reviews_this_week integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS sentences_viewed_this_week integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stories_viewed_this_week integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lessons_viewed_this_week integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS saved_words_this_week integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS week_start_date bigint; -- Timestamp of Monday of current week (midnight UTC)

-- Index for week queries
CREATE INDEX IF NOT EXISTS idx_user_week_start_date 
ON public.user(week_start_date) 
WHERE week_start_date IS NOT NULL;

