-- Add analytics fields to workouts table for progress tracking
-- This enables storing workout statistics for analytics dashboards

-- Add new columns to workouts table
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS duration_seconds integer CHECK (duration_seconds >= 0),
  ADD COLUMN IF NOT EXISTS total_volume decimal CHECK (total_volume >= 0),
  ADD COLUMN IF NOT EXISTS total_sets integer CHECK (total_sets >= 0),
  ADD COLUMN IF NOT EXISTS notes text;

-- Backfill completed_at for existing completed workouts
-- Use updated_at as fallback, or created_at if updated_at is null
UPDATE public.workouts
SET completed_at = COALESCE(updated_at, created_at)
WHERE completed = true AND completed_at IS NULL;

-- Add indexes for analytics queries
-- Time-series queries on sets_log
CREATE INDEX IF NOT EXISTS idx_sets_log_created_at
  ON public.sets_log(created_at);

-- Exercise performance tracking (exercise + time for progress charts)
CREATE INDEX IF NOT EXISTS idx_sets_log_exercise_time
  ON public.sets_log(exercise_id, created_at);

-- Completed workout queries with time filtering
CREATE INDEX IF NOT EXISTS idx_workouts_user_completed_time
  ON public.workouts(user_id, completed, completed_at)
  WHERE completed = true;

-- Workout date range queries for analytics
CREATE INDEX IF NOT EXISTS idx_workouts_completed_at_range
  ON public.workouts(user_id, completed_at)
  WHERE completed = true;

-- Add comment for documentation
COMMENT ON COLUMN public.workouts.started_at IS 'Timestamp when workout execution began';
COMMENT ON COLUMN public.workouts.completed_at IS 'Timestamp when workout was marked as completed';
COMMENT ON COLUMN public.workouts.duration_seconds IS 'Total workout duration in seconds from start to completion';
COMMENT ON COLUMN public.workouts.total_volume IS 'Sum of (weight × reps) across all sets in the workout';
COMMENT ON COLUMN public.workouts.total_sets IS 'Total number of sets completed in the workout';
COMMENT ON COLUMN public.workouts.notes IS 'User notes about the workout (fatigue, energy, etc.)';
