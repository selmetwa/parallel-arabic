ALTER TABLE public.user
  ADD COLUMN IF NOT EXISTS tts_calls_count integer NOT NULL DEFAULT 0;
