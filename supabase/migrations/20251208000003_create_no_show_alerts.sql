-- ============================================
-- CLIENT NO-SHOW ALERTS
-- Track high no-show rate clients and notify coach
-- ============================================

CREATE TABLE client_no_show_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Statistics at time of alert
  no_show_count INTEGER NOT NULL CHECK (no_show_count >= 0),
  session_count INTEGER NOT NULL CHECK (session_count > 0),
  no_show_rate DECIMAL(5,2) NOT NULL CHECK (no_show_rate >= 0 AND no_show_rate <= 100),

  -- Coach response
  acknowledged_at TIMESTAMPTZ,
  coach_notes TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One active alert per client per coach (upsert pattern)
  UNIQUE(coach_id, client_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE client_no_show_alerts ENABLE ROW LEVEL SECURITY;

-- Coach can manage alerts for their clients
CREATE POLICY alerts_coach_all ON client_no_show_alerts
  FOR ALL USING (coach_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get no-show statistics for a client
CREATE OR REPLACE FUNCTION get_client_no_show_stats(
  p_coach_id UUID,
  p_client_id UUID,
  p_sessions_to_analyze INTEGER DEFAULT 5
) RETURNS TABLE (
  no_show_count INTEGER,
  session_count INTEGER,
  no_show_rate DECIMAL(5,2),
  exceeds_threshold BOOLEAN
) AS $$
DECLARE
  v_threshold_rate CONSTANT DECIMAL := 40.0; -- 2/5 = 40%
BEGIN
  RETURN QUERY
  WITH recent_sessions AS (
    SELECT
      b.status,
      b.completed_at
    FROM bookings b
    WHERE b.coach_id = p_coach_id
    AND b.client_id = p_client_id
    AND b.status IN ('completed', 'no_show')
    ORDER BY COALESCE(b.completed_at, b.scheduled_date::TIMESTAMPTZ) DESC
    LIMIT p_sessions_to_analyze
  ),
  stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'no_show')::INTEGER as no_shows,
      COUNT(*)::INTEGER as total
    FROM recent_sessions
  )
  SELECT
    stats.no_shows,
    stats.total,
    CASE
      WHEN stats.total = 0 THEN 0
      ELSE ROUND((stats.no_shows::DECIMAL / stats.total) * 100, 2)
    END as rate,
    CASE
      WHEN stats.total < p_sessions_to_analyze THEN false
      ELSE (stats.no_shows::DECIMAL / stats.total) * 100 >= v_threshold_rate
    END as exceeds
  FROM stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and create alert if threshold exceeded
CREATE OR REPLACE FUNCTION check_no_show_threshold(
  p_coach_id UUID,
  p_client_id UUID
) RETURNS UUID AS $$
DECLARE
  v_stats RECORD;
  v_alert_id UUID;
BEGIN
  -- Get current stats
  SELECT * INTO v_stats
  FROM get_client_no_show_stats(p_coach_id, p_client_id, 5);

  -- If threshold exceeded and we have enough data
  IF v_stats.exceeds_threshold AND v_stats.session_count >= 5 THEN
    -- Upsert alert
    INSERT INTO client_no_show_alerts (
      coach_id,
      client_id,
      no_show_count,
      session_count,
      no_show_rate
    ) VALUES (
      p_coach_id,
      p_client_id,
      v_stats.no_show_count,
      v_stats.session_count,
      v_stats.no_show_rate
    )
    ON CONFLICT (coach_id, client_id)
    DO UPDATE SET
      no_show_count = EXCLUDED.no_show_count,
      session_count = EXCLUDED.session_count,
      no_show_rate = EXCLUDED.no_show_rate,
      acknowledged_at = NULL,  -- Reset acknowledgment on new alert
      created_at = now()
    RETURNING id INTO v_alert_id;

    RETURN v_alert_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending (unacknowledged) alerts for a coach
CREATE OR REPLACE FUNCTION get_pending_no_show_alerts(
  p_coach_id UUID
) RETURNS TABLE (
  alert_id UUID,
  client_id UUID,
  client_name TEXT,
  no_show_count INTEGER,
  session_count INTEGER,
  no_show_rate DECIMAL(5,2),
  alert_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.client_id,
    COALESCE(up.display_name, up.full_name, 'Unknown') as client_name,
    a.no_show_count,
    a.session_count,
    a.no_show_rate,
    a.created_at
  FROM client_no_show_alerts a
  LEFT JOIN user_profiles up ON up.user_id = a.client_id
  WHERE a.coach_id = p_coach_id
  AND a.acknowledged_at IS NULL
  ORDER BY a.no_show_rate DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
