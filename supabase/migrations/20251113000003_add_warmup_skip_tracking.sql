-- Migration: Add warmup skip tracking fields to sets_log table
-- This enables tracking of warmup sets vs working sets, and whether they were skipped

-- Add set_type to distinguish warmup from working sets
ALTER TABLE public.sets_log
  ADD COLUMN set_type text CHECK (set_type IN ('warmup', 'working'));

COMMENT ON COLUMN public.sets_log.set_type IS
  'Type of set: warmup (preparatory) or working (main training sets)';

-- Add skipped flag to track when sets are intentionally skipped
ALTER TABLE public.sets_log
  ADD COLUMN skipped boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.sets_log.skipped IS
  'Indicates if this set was skipped by the user (e.g., warmup skipped because muscles already activated)';

-- Add skip_reason to understand why sets were skipped for analytics and intelligence
ALTER TABLE public.sets_log
  ADD COLUMN skip_reason text;

COMMENT ON COLUMN public.sets_log.skip_reason IS
  'Reason for skipping the set. Examples:
   - user_manual: User manually chose to skip
   - ai_suggested_second_compound: AI suggested skip for second similar compound exercise
   - ai_suggested_deload: AI suggested skip during deload phase
   - ai_suggested_late_exercise: AI suggested skip for later exercises in workout
   - muscles_activated: Muscles already sufficiently activated';

-- Create indexes for analytics queries
CREATE INDEX idx_sets_log_set_type ON public.sets_log(set_type) WHERE set_type IS NOT NULL;
CREATE INDEX idx_sets_log_skipped ON public.sets_log(skipped) WHERE skipped = true;
CREATE INDEX idx_sets_log_skip_reason ON public.sets_log(skip_reason) WHERE skip_reason IS NOT NULL;

-- Composite index for analytics: workout + set_type + skipped
CREATE INDEX idx_sets_log_workout_analytics ON public.sets_log(workout_id, set_type, skipped);

COMMENT ON INDEX idx_sets_log_workout_analytics IS
  'Optimizes queries for warmup skip analytics by workout, phase, and approach';
