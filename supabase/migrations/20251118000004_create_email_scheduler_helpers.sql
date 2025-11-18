-- Database helper functions for email scheduling
-- These functions are called by Supabase Edge Functions to find users who need scheduled emails

-- Function 1: Get users needing first workout reminder
-- Finds users who completed onboarding 24h ago but haven't started their first workout
CREATE OR REPLACE FUNCTION get_users_needing_first_workout_reminder()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  workout_id UUID,
  workout_name TEXT,
  workout_type TEXT,
  target_muscles TEXT[],
  preferred_language VARCHAR(5)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id AS user_id,
    u.email::TEXT AS email,
    p.first_name,
    w.id AS workout_id,
    w.workout_name,
    w.workout_type,
    w.target_muscle_groups AS target_muscles,
    p.preferred_language
  FROM auth.users u
  INNER JOIN user_profiles p ON p.user_id = u.id
  INNER JOIN workouts w ON w.user_id = u.id
  WHERE
    -- User has email notifications enabled
    p.email_notifications_enabled = true
    -- User completed onboarding at least 24 hours ago
    AND p.created_at < NOW() - INTERVAL '24 hours'
    -- This is their first workout (by creation order)
    AND w.id = (
      SELECT id FROM workouts
      WHERE user_id = u.id
      ORDER BY created_at ASC
      LIMIT 1
    )
    -- Workout not yet started
    AND w.started_at IS NULL
    -- Email not already sent
    AND NOT EXISTS (
      SELECT 1 FROM email_events
      WHERE user_id = u.id
      AND event_type = 'first_workout_reminder'
      AND sent_at > NOW() - INTERVAL '7 days'
    );
END;
$$;

-- Function 2: Get users needing weekly progress email
-- Finds active users who should receive a weekly recap
CREATE OR REPLACE FUNCTION get_users_needing_weekly_progress()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  week_number INTEGER,
  preferred_language VARCHAR(5)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id AS user_id,
    u.email::TEXT AS email,
    p.first_name,
    CEIL(EXTRACT(DAY FROM NOW() - p.created_at) / 7.0)::INTEGER AS week_number,
    p.preferred_language
  FROM auth.users u
  INNER JOIN user_profiles p ON p.user_id = u.id
  WHERE
    -- User has email notifications enabled
    p.email_notifications_enabled = true
    -- User has completed at least one workout
    AND EXISTS (
      SELECT 1 FROM workouts
      WHERE user_id = u.id
      AND completed = true
    )
    -- User has completed a workout in last 7 days (active user)
    AND EXISTS (
      SELECT 1 FROM workouts
      WHERE user_id = u.id
      AND completed = true
      AND completed_at > NOW() - INTERVAL '7 days'
    )
    -- Email not sent this week yet
    AND NOT EXISTS (
      SELECT 1 FROM email_events
      WHERE user_id = u.id
      AND event_type = 'weekly_progress'
      AND sent_at > NOW() - INTERVAL '7 days'
    )
    -- Only send on Mondays (weekday 1)
    AND EXTRACT(DOW FROM NOW()) = 1;
END;
$$;

-- Function 3: Get users needing re-engagement email
-- Finds users who have been inactive for 7+ days
CREATE OR REPLACE FUNCTION get_users_needing_reengagement()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  days_since_last_workout INTEGER,
  preferred_language VARCHAR(5)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id AS user_id,
    u.email::TEXT AS email,
    p.first_name,
    EXTRACT(DAY FROM NOW() - MAX(w.completed_at))::INTEGER AS days_since_last_workout,
    p.preferred_language
  FROM auth.users u
  INNER JOIN user_profiles p ON p.user_id = u.id
  INNER JOIN workouts w ON w.user_id = u.id
  WHERE
    -- User has email notifications enabled
    p.email_notifications_enabled = true
    -- User has completed at least one workout (not a new user)
    AND w.completed = true
  GROUP BY u.id, u.email, p.first_name, p.preferred_language
  HAVING
    -- Last completed workout was 7+ days ago
    MAX(w.completed_at) < NOW() - INTERVAL '7 days'
    -- Email not sent in last 7 days
    AND NOT EXISTS (
      SELECT 1 FROM email_events
      WHERE user_id = u.id
      AND event_type = 'reengagement'
      AND sent_at > NOW() - INTERVAL '7 days'
    );
END;
$$;

-- Grant execute permissions to authenticated and service_role
GRANT EXECUTE ON FUNCTION get_users_needing_first_workout_reminder() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_users_needing_weekly_progress() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_users_needing_reengagement() TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION get_users_needing_first_workout_reminder IS 'Returns users who completed onboarding 24h ago but haven''t started their first workout. Called hourly by email-scheduler Edge Function.';
COMMENT ON FUNCTION get_users_needing_weekly_progress IS 'Returns active users who need a weekly progress email. Called on Mondays by email-scheduler Edge Function.';
COMMENT ON FUNCTION get_users_needing_reengagement IS 'Returns users who have been inactive for 7+ days and need a re-engagement email. Called daily by email-scheduler Edge Function.';
