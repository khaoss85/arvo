-- ============================================
-- BOOKING WAITLIST ENTRIES
-- AI-driven prioritization for slot availability
-- ============================================

CREATE TABLE booking_waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Client preferences
  preferred_days INTEGER[] NOT NULL DEFAULT '{}',  -- 0=Sunday, 1=Monday, ..., 6=Saturday
  preferred_time_start TIME,
  preferred_time_end TIME,
  urgency_level INTEGER DEFAULT 50 CHECK (urgency_level >= 0 AND urgency_level <= 100),
  notes TEXT,
  package_id UUID REFERENCES booking_packages(id) ON DELETE SET NULL,

  -- AI scoring (calculated when slot becomes available)
  ai_priority_score INTEGER DEFAULT 50 CHECK (ai_priority_score >= 0 AND ai_priority_score <= 100),
  ai_score_reason TEXT,

  -- Status management
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'notified', 'booked', 'expired', 'cancelled')),
  notified_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One active entry per client per coach
  UNIQUE(coach_id, client_id) WHERE (status = 'active')
);

-- ============================================
-- INDEXES
-- ============================================

-- Active waitlist entries for a coach (for quick lookup when slot opens)
CREATE INDEX idx_booking_waitlist_coach_active ON booking_waitlist_entries(coach_id, status) WHERE status = 'active';

-- Pending notifications (for processing offers)
CREATE INDEX idx_booking_waitlist_pending_response ON booking_waitlist_entries(response_deadline, status) WHERE status = 'notified';

-- Unique constraint for one active entry per client per coach
CREATE UNIQUE INDEX idx_booking_waitlist_unique_active ON booking_waitlist_entries(coach_id, client_id) WHERE status = 'active';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE booking_waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Coach can manage waitlist entries for their clients
CREATE POLICY booking_waitlist_coach_all ON booking_waitlist_entries
  FOR ALL USING (coach_id = auth.uid());

-- Client can view and manage their own waitlist entry
CREATE POLICY booking_waitlist_client_all ON booking_waitlist_entries
  FOR ALL USING (client_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_booking_waitlist_entries_updated_at
  BEFORE UPDATE ON booking_waitlist_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Find waitlist candidates for a specific slot
CREATE OR REPLACE FUNCTION find_booking_waitlist_candidates(
  p_coach_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  preferred_days INTEGER[],
  preferred_time_start TIME,
  preferred_time_end TIME,
  urgency_level INTEGER,
  ai_priority_score INTEGER,
  has_active_package BOOLEAN,
  days_waiting INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.client_id,
    COALESCE(up.display_name, up.full_name, 'Unknown') as client_name,
    w.preferred_days,
    w.preferred_time_start,
    w.preferred_time_end,
    w.urgency_level,
    w.ai_priority_score,
    (w.package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM booking_packages bp
      WHERE bp.id = w.package_id
      AND bp.status = 'active'
      AND bp.sessions_used < bp.total_sessions
    )) as has_active_package,
    EXTRACT(DAY FROM (now() - w.created_at))::INTEGER as days_waiting
  FROM booking_waitlist_entries w
  LEFT JOIN user_profiles up ON up.user_id = w.client_id
  WHERE w.coach_id = p_coach_id
  AND w.status = 'active'
  -- Filter by day preference if specified
  AND (
    array_length(w.preferred_days, 1) IS NULL
    OR array_length(w.preferred_days, 1) = 0
    OR EXTRACT(DOW FROM p_date)::INTEGER = ANY(w.preferred_days)
  )
  -- Filter by time preference if specified
  AND (
    w.preferred_time_start IS NULL
    OR (
      p_start_time >= w.preferred_time_start
      AND p_end_time <= COALESCE(w.preferred_time_end, '23:59:59'::TIME)
    )
  )
  ORDER BY w.ai_priority_score DESC, w.urgency_level DESC, w.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate AI priority score for a waitlist entry
CREATE OR REPLACE FUNCTION calculate_booking_waitlist_priority(
  p_entry_id UUID,
  p_slot_date DATE,
  p_slot_start_time TIME
) RETURNS INTEGER AS $$
DECLARE
  v_entry RECORD;
  v_score INTEGER := 50;
  v_day_of_week INTEGER;
  v_has_package BOOLEAN;
  v_days_waiting INTEGER;
BEGIN
  -- Get entry details
  SELECT * INTO v_entry FROM booking_waitlist_entries WHERE id = p_entry_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  v_day_of_week := EXTRACT(DOW FROM p_slot_date)::INTEGER;

  -- Day preference match (30% weight)
  IF array_length(v_entry.preferred_days, 1) IS NOT NULL
     AND array_length(v_entry.preferred_days, 1) > 0
     AND v_day_of_week = ANY(v_entry.preferred_days) THEN
    v_score := v_score + 30;
  END IF;

  -- Time preference match (25% weight)
  IF v_entry.preferred_time_start IS NOT NULL
     AND p_slot_start_time >= v_entry.preferred_time_start
     AND p_slot_start_time <= COALESCE(v_entry.preferred_time_end, '23:59:59'::TIME) THEN
    v_score := v_score + 25;
  END IF;

  -- Active package check (20% weight)
  SELECT EXISTS (
    SELECT 1 FROM booking_packages bp
    WHERE bp.id = v_entry.package_id
    AND bp.status = 'active'
    AND bp.sessions_used < bp.total_sessions
  ) INTO v_has_package;
  IF v_has_package THEN
    v_score := v_score + 20;
  END IF;

  -- Waiting time bonus (10% weight, logarithmic)
  v_days_waiting := EXTRACT(DAY FROM (now() - v_entry.created_at))::INTEGER;
  v_score := v_score + LEAST(10, FLOOR(LOG(v_days_waiting + 1) * 5));

  -- Urgency level contribution (already 0-100, normalize to 15% weight)
  v_score := v_score + FLOOR(v_entry.urgency_level * 0.15);

  -- Cap at 100
  RETURN LEAST(100, v_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
