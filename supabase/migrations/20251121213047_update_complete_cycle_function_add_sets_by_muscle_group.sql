-- Update complete_cycle() RPC function to accept and save sets_by_muscle_group
-- This fixes the bug where setsByMuscleGroup was calculated but not saved to DB

-- Drop old function first (required when changing parameter signature)
DROP FUNCTION IF EXISTS complete_cycle(UUID, UUID, INTEGER, INTEGER, DECIMAL, INTEGER, DECIMAL, INTEGER, INTEGER, JSONB, JSONB);

CREATE OR REPLACE FUNCTION complete_cycle(
  p_user_id UUID,
  p_split_plan_id UUID,
  p_cycle_number INTEGER,
  p_next_cycle_day INTEGER,
  p_total_volume DECIMAL,
  p_total_workouts_completed INTEGER,
  p_avg_mental_readiness DECIMAL,
  p_total_sets INTEGER,
  p_total_duration_seconds INTEGER,
  p_volume_by_muscle_group JSONB,
  p_sets_by_muscle_group JSONB DEFAULT '{}'::jsonb,  -- NEW PARAMETER
  p_workouts_by_type JSONB DEFAULT '{}'::jsonb       -- Added DEFAULT for backwards compatibility
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cycle_id UUID;
  v_cycles_completed INTEGER;
BEGIN
  -- Insert cycle completion record
  INSERT INTO cycle_completions (
    user_id,
    split_plan_id,
    cycle_number,
    completed_at,
    total_volume,
    total_workouts_completed,
    avg_mental_readiness,
    total_sets,
    total_duration_seconds,
    volume_by_muscle_group,
    sets_by_muscle_group,  -- NEW FIELD
    workouts_by_type,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_split_plan_id,
    p_cycle_number,
    NOW(),
    p_total_volume,
    p_total_workouts_completed,
    p_avg_mental_readiness,
    p_total_sets,
    p_total_duration_seconds,
    p_volume_by_muscle_group,
    p_sets_by_muscle_group,  -- NEW VALUE
    p_workouts_by_type,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_cycle_id;

  -- Get current cycles_completed count
  SELECT cycles_completed INTO v_cycles_completed
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Update user profile atomically
  UPDATE user_profiles
  SET
    current_cycle_day = p_next_cycle_day,
    cycles_completed = COALESCE(v_cycles_completed, 0) + 1,
    last_cycle_completed_at = NOW(),
    current_cycle_start_date = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Return success with cycle_id for email trigger
  RETURN jsonb_build_object(
    'success', true,
    'cycle_id', v_cycle_id,
    'cycles_completed', COALESCE(v_cycles_completed, 0) + 1,
    'next_cycle_day', p_next_cycle_day
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error details for debugging
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;

-- Update comment
COMMENT ON FUNCTION complete_cycle IS 'Atomically completes a training cycle by inserting cycle_completion record (including sets_by_muscle_group) and updating user_profiles. Called by split-plan.service.ts when user wraps around to day 1.';
