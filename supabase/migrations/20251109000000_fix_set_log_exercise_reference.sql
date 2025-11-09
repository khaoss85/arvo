-- Migration: Fix set_log exercise reference
-- Description: Make exercise_id nullable and add exercise_name for workouts without exercise DB records
-- Created: 2025-11-09

-- Make exercise_id nullable (was previously required)
ALTER TABLE public.sets_log
  ALTER COLUMN exercise_id DROP NOT NULL;

-- Add exercise_name column to identify exercises by name when ID not available
ALTER TABLE public.sets_log
  ADD COLUMN exercise_name text NOT NULL DEFAULT 'Unknown Exercise';

-- Remove default after adding column (future inserts must provide name)
ALTER TABLE public.sets_log
  ALTER COLUMN exercise_name DROP DEFAULT;

COMMENT ON COLUMN public.sets_log.exercise_name IS
  'Name of the exercise performed. Used to identify exercise when exercise_id is not available (e.g., AI-generated workouts without DB exercise records).';

-- Create index for querying by exercise name
CREATE INDEX idx_sets_log_exercise_name
  ON public.sets_log(exercise_name);

-- Create composite index for analytics by user and exercise name
CREATE INDEX idx_sets_log_user_exercise_analytics
  ON public.sets_log(workout_id, exercise_name, created_at);
