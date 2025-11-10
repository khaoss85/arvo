-- Add workout status enum and field to workouts table
-- This enables pre-generation of workouts with draft/ready/in_progress/completed states

-- Create workout_status enum type
CREATE TYPE workout_status AS ENUM ('draft', 'ready', 'in_progress', 'completed');

-- Add status column to workouts table
ALTER TABLE workouts
ADD COLUMN status workout_status DEFAULT 'completed';

-- Update existing workouts based on their current state
-- If workout has started_at but not completed_at, it's in_progress
UPDATE workouts
SET status = 'in_progress'
WHERE started_at IS NOT NULL AND completed_at IS NULL;

-- If workout has completed_at, it's completed (already default)
UPDATE workouts
SET status = 'completed'
WHERE completed_at IS NOT NULL;

-- If workout has neither (shouldn't happen in current system, but just in case), mark as ready
UPDATE workouts
SET status = 'ready'
WHERE started_at IS NULL AND completed_at IS NULL;

-- Add index for efficient status queries
CREATE INDEX idx_workouts_status ON workouts(status);
CREATE INDEX idx_workouts_user_cycle ON workouts(user_id, split_plan_id, cycle_day, status);

-- Add comment explaining the status field
COMMENT ON COLUMN workouts.status IS 'Workout lifecycle status: draft (pre-generated, not reviewed), ready (reviewed, ready to start), in_progress (currently executing), completed (finished)';
