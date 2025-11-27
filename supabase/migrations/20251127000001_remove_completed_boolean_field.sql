-- Migration: Remove deprecated 'completed' boolean field from workouts table
-- The 'status' enum field now handles all workflow states
-- This eliminates the dual-tracking that was causing confusion

-- First, ensure all completed=true records have status='completed'
-- (data consistency check before removal)
UPDATE workouts
SET status = 'completed'
WHERE completed = true AND status != 'completed';

-- Drop the old trigger that depends on 'completed' field
DROP TRIGGER IF EXISTS track_exercise_usage ON workouts;

-- Recreate the trigger using 'status' field instead
CREATE TRIGGER track_exercise_usage
  AFTER UPDATE ON workouts
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION update_exercise_usage();

-- Now we can safely remove the completed column
ALTER TABLE workouts DROP COLUMN IF EXISTS completed;

-- Add comment explaining the status field is the single source of truth
COMMENT ON COLUMN workouts.status IS 'Workflow status: draft, ready, in_progress, completed. Single source of truth for workout state.';
