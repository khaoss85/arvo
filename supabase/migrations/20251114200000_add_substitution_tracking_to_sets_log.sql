-- Add exercise substitution tracking to sets_log table
-- This allows us to track when an exercise was substituted during workout execution

-- Add columns for tracking exercise substitutions
ALTER TABLE public.sets_log
ADD COLUMN IF NOT EXISTS original_exercise_name TEXT,
ADD COLUMN IF NOT EXISTS substitution_reason TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN public.sets_log.original_exercise_name IS 'If this set belongs to an exercise that was substituted, this stores the name of the original exercise. NULL means no substitution occurred.';
COMMENT ON COLUMN public.sets_log.substitution_reason IS 'The reason why the exercise was substituted (e.g., equipment_unavailable, injury, user_preference)';

-- Create index for efficient queries on substitutions
CREATE INDEX IF NOT EXISTS idx_sets_log_substitutions ON public.sets_log (workout_id, original_exercise_name)
WHERE original_exercise_name IS NOT NULL;

-- Create index for efficient queries on skipped sets (improve existing skip queries)
CREATE INDEX IF NOT EXISTS idx_sets_log_skipped ON public.sets_log (workout_id, skipped)
WHERE skipped = true;
