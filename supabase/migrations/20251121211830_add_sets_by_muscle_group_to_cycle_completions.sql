-- Add sets_by_muscle_group column to cycle_completions table
-- This stores the number of sets performed per muscle group, unlike volume_by_muscle_group which stores weight (kg)
--
-- Context: The MuscleRadarChart component expects sets count, not volume.
-- Previously we were passing volume data causing incorrect visualizations (values appearing as zero).
--
-- Migration strategy:
-- 1. Add new column sets_by_muscle_group
-- 2. Set default to empty object for existing records
-- 3. Future cycle completions will populate both volume_by_muscle_group AND sets_by_muscle_group
--
-- Note: Existing cycle_completions will have empty sets_by_muscle_group.
-- They can be recalculated by re-running calculateCycleStats() if needed.

ALTER TABLE public.cycle_completions
ADD COLUMN IF NOT EXISTS sets_by_muscle_group JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.cycle_completions.sets_by_muscle_group IS
'Number of sets performed per muscle group. Used by radar charts which expect sets count, not volume. Format: {"chest": 12, "back": 10, "legs": 8, ...}';

-- Add index for JSON queries if needed in future
CREATE INDEX IF NOT EXISTS idx_cycle_completions_sets_by_muscle_group
ON public.cycle_completions USING gin (sets_by_muscle_group);
