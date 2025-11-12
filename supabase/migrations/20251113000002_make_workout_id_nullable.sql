-- Migration: Allow proactive injury/limitation reporting
-- This enables users to report injuries/pain without having completed a workout first
-- Proactive insights will have workout_id = NULL

-- Make workout_id nullable to support proactive user-reported limitations
ALTER TABLE workout_insights
  ALTER COLUMN workout_id DROP NOT NULL;

-- Add index for efficient querying of proactive insights
-- (insights created without a workout, where workout_id IS NULL)
CREATE INDEX idx_workout_insights_proactive
  ON workout_insights(user_id, status)
  WHERE workout_id IS NULL AND status = 'active';

-- Update column comment to document the new behavior
COMMENT ON COLUMN workout_insights.workout_id IS
  'Workout ID where insight originated. NULL for proactive user-reported injuries/limitations that were not discovered during a workout.';

-- Add helpful comment on table
COMMENT ON TABLE workout_insights IS
  'Stores user insights about exercises, pain, recovery, etc.
  Can be created either:
  1. Post-workout (workout_id present) - AI analyzes workout notes
  2. Proactively (workout_id NULL) - User reports injury/limitation directly in Settings';
