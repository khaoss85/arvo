-- Create complete_cycle() RPC function for atomic cycle completion
-- This function is called by split-plan.service.ts to complete a training cycle

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
  p_workouts_by_type JSONB
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

-- Add comment for documentation
COMMENT ON FUNCTION complete_cycle IS 'Atomically completes a training cycle by inserting cycle_completion record and updating user_profiles. Called by split-plan.service.ts when user wraps around to day 1.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_cycle TO authenticated;
