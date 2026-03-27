-- Migration: Leaderboard
-- Run this in the Supabase SQL editor before deploying the leaderboard feature.

ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS xp_this_week       INTEGER  DEFAULT 0     NOT NULL,
  ADD COLUMN IF NOT EXISTS leaderboard_opt_out BOOLEAN  DEFAULT false NOT NULL;
