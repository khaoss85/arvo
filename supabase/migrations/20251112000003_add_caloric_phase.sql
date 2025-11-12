-- Migration: Add caloric phase tracking to user profiles
-- Description: Adds caloric_phase and caloric_phase_start_date fields to track
--              whether user is in bulk (surplus), cut (deficit), or maintenance phase.
--              This influences workout volume, exercise selection, and rep ranges.

-- Add caloric_phase column to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS caloric_phase TEXT
  CHECK (caloric_phase IN ('bulk', 'cut', 'maintenance'));

-- Add caloric_phase_start_date for tracking phase duration
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS caloric_phase_start_date TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.caloric_phase IS
  'Current nutritional phase: bulk (caloric surplus for muscle gain), cut (caloric deficit for fat loss), or maintenance (caloric balance). Influences workout volume and exercise selection.';

COMMENT ON COLUMN user_profiles.caloric_phase_start_date IS
  'Start date of current caloric phase for tracking duration and history.';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_caloric_phase
  ON user_profiles(caloric_phase)
  WHERE caloric_phase IS NOT NULL;
