-- Backfill onboarding_complete milestones from user_profiles
-- This creates a milestone for each user who has completed onboarding
INSERT INTO user_milestones (user_id, milestone_type, created_at, metadata)
SELECT
  user_id,
  'onboarding_complete'::text AS milestone_type,
  created_at,
  jsonb_build_object('backfilled', true, 'source', 'user_profiles') AS metadata
FROM user_profiles
ON CONFLICT (user_id, milestone_type) DO NOTHING;

-- Backfill first_workout_complete milestones
-- This creates a milestone for the first completed workout of each user
WITH first_workouts AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    id AS workout_id,
    completed_at,
    workout_name
  FROM workouts
  WHERE status = 'completed'
    AND completed_at IS NOT NULL
  ORDER BY user_id, completed_at ASC
)
INSERT INTO user_milestones (user_id, milestone_type, created_at, metadata)
SELECT
  user_id,
  'first_workout_complete'::text AS milestone_type,
  completed_at AS created_at,
  jsonb_build_object(
    'workoutId', workout_id,
    'workoutName', COALESCE(workout_name, 'Unnamed Workout'),
    'backfilled', true,
    'source', 'workouts'
  ) AS metadata
FROM first_workouts
ON CONFLICT (user_id, milestone_type) DO NOTHING;

-- Log results
DO $$
DECLARE
  onboarding_count INTEGER;
  workout_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO onboarding_count
  FROM user_milestones
  WHERE milestone_type = 'onboarding_complete';

  SELECT COUNT(*) INTO workout_count
  FROM user_milestones
  WHERE milestone_type = 'first_workout_complete';

  RAISE NOTICE 'Backfill complete: % onboarding milestones, % first workout milestones',
    onboarding_count, workout_count;
END $$;
