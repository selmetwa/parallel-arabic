-- ============================================
-- Migration: Add Structured Lesson Progress Tracking
-- ============================================

-- Create structured_lesson_progress table to track user completion of structured lessons
CREATE TABLE IF NOT EXISTS public.structured_lesson_progress (
  id text NOT NULL,
  user_id text NOT NULL,
  topic_id text NOT NULL,
  dialect text NOT NULL CHECK (dialect = ANY (ARRAY['egyptian-arabic'::text, 'fusha'::text, 'levantine'::text, 'darija'::text])),
  status text NOT NULL DEFAULT 'not_started' CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])),
  started_at bigint,
  completed_at bigint,
  last_accessed_at bigint,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at bigint NOT NULL DEFAULT EXTRACT(epoch FROM now()),
  updated_at bigint NOT NULL DEFAULT EXTRACT(epoch FROM now()),
  CONSTRAINT structured_lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT structured_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id),
  CONSTRAINT structured_lesson_progress_unique UNIQUE (user_id, topic_id, dialect)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_structured_lesson_progress_user_id 
ON public.structured_lesson_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_structured_lesson_progress_topic_dialect 
ON public.structured_lesson_progress(topic_id, dialect);

CREATE INDEX IF NOT EXISTS idx_structured_lesson_progress_status 
ON public.structured_lesson_progress(status);

CREATE INDEX IF NOT EXISTS idx_structured_lesson_progress_user_dialect 
ON public.structured_lesson_progress(user_id, dialect, status);

