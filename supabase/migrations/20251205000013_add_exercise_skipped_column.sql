-- ============================================
-- Migration: Document exercise skipping feature
-- Purpose: Allow users to skip exercises and still complete workouts
-- ============================================

-- NOTE: Exercises are stored as JSONB array in workouts.exercises column.
-- The skipped field will be added to each exercise object in the JSONB array.
-- No schema changes needed - JSONB is flexible.
--
-- Exercise JSONB structure after this feature:
-- {
--   "name": "Bench Press",
--   "targetSets": 3,
--   "targetReps": 10,
--   "targetWeight": 80,
--   "skipped": false,  -- NEW FIELD
--   ...
-- }

-- Add comment to document the feature
COMMENT ON COLUMN public.workouts.exercises IS 'Array of exercise objects. Each exercise can have a "skipped" boolean field to indicate if user skipped this exercise during the workout.';
