-- Create email_events table to track all emails sent to users
-- This prevents duplicate emails and provides audit trail

CREATE TABLE IF NOT EXISTS email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  email_subject text NOT NULL,
  email_template text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_email_events_user_id ON email_events(user_id);
CREATE INDEX idx_email_events_event_type ON email_events(event_type);
CREATE INDEX idx_email_events_sent_at ON email_events(sent_at);
CREATE INDEX idx_email_events_user_event ON email_events(user_id, event_type);

-- Add RLS policies
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own email events
CREATE POLICY "Users can view own email events"
  ON email_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert email events (server-side only)
CREATE POLICY "Service role can insert email events"
  ON email_events
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create helper function to check if email was already sent
CREATE OR REPLACE FUNCTION check_email_already_sent(
  p_user_id uuid,
  p_event_type text,
  p_hours_ago integer DEFAULT 24
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM email_events
    WHERE user_id = p_user_id
      AND event_type = p_event_type
      AND sent_at > now() - (p_hours_ago || ' hours')::interval
  );
END;
$$;

-- Create function to get user onboarding stats for email personalization
CREATE OR REPLACE FUNCTION get_user_onboarding_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_profile record;
  v_approach_name text;
  v_split_plan record;
  v_first_workout record;
  v_workouts_count integer;
  v_total_volume decimal;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Note: Approach names are stored in JSON files, not in database
  -- The approach_id is stored in user_profiles.approach_id
  -- The application will resolve the approach name from the filesystem
  v_approach_name := v_profile.approach_id;

  -- Get active split plan
  SELECT * INTO v_split_plan
  FROM split_plans
  WHERE user_id = p_user_id
    AND active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get first workout
  SELECT * INTO v_first_workout
  FROM workouts
  WHERE user_id = p_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  -- Get workout stats
  SELECT
    COUNT(*),
    COALESCE(SUM(total_volume), 0)
  INTO v_workouts_count, v_total_volume
  FROM workouts
  WHERE user_id = p_user_id
    AND completed = true;

  -- Build result JSON
  v_result := jsonb_build_object(
    'firstName', v_profile.first_name,
    'approachName', v_approach_name,
    'splitType', v_profile.preferred_split,
    'weeklyFrequency', CASE
      WHEN v_split_plan.id IS NOT NULL THEN
        CASE v_split_plan.split_type
          WHEN 'push_pull_legs' THEN 6
          WHEN 'upper_lower' THEN 4
          WHEN 'full_body' THEN 3
          WHEN 'bro_split' THEN 5
          ELSE 4
        END
      ELSE 4
    END,
    'weakPoints', v_profile.weak_points,
    'experienceYears', v_profile.experience_years,
    'firstWorkoutId', v_first_workout.id,
    'firstWorkoutType', v_first_workout.workout_type,
    'firstWorkoutName', v_first_workout.workout_name,
    'firstWorkoutStarted', v_first_workout.started_at IS NOT NULL,
    'firstWorkoutCompleted', v_first_workout.completed,
    'workoutsCompleted', v_workouts_count,
    'totalVolume', v_total_volume,
    'currentCycleDay', v_profile.current_cycle_day,
    'cyclesCompleted', v_profile.cycles_completed,
    'language', COALESCE(v_profile.preferred_language, 'it')
  );

  RETURN v_result;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE email_events IS 'Tracks all emails sent to users for onboarding and engagement campaigns';
COMMENT ON FUNCTION check_email_already_sent IS 'Checks if a specific email type was already sent to a user within a time window';
COMMENT ON FUNCTION get_user_onboarding_stats IS 'Returns comprehensive user stats for email personalization';
