-- ============================================
-- COACH CANCELLATION POLICIES
-- Configurable cancellation rules per coach
-- ============================================

-- Cancellation policies table
CREATE TABLE coach_cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cancellation window configuration
  free_cancellation_hours INTEGER NOT NULL DEFAULT 24,
  late_cancel_charges_session BOOLEAN NOT NULL DEFAULT true,
  late_cancel_refund_percentage INTEGER DEFAULT 0 CHECK (late_cancel_refund_percentage >= 0 AND late_cancel_refund_percentage <= 100),

  -- Policy text (AI-generated or coach-written)
  policy_summary_en TEXT,
  policy_summary_it TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One policy per coach
  UNIQUE(coach_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE coach_cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own policy
CREATE POLICY coach_cancellation_policy_coach_all ON coach_cancellation_policies
  FOR ALL USING (coach_id = auth.uid());

-- Clients can view their coach's policy (if active relationship exists)
CREATE POLICY coach_cancellation_policy_client_view ON coach_cancellation_policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_client_relationships
      WHERE coach_client_relationships.coach_id = coach_cancellation_policies.coach_id
      AND coach_client_relationships.client_id = auth.uid()
      AND coach_client_relationships.status = 'active'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_coach_cancellation_policies_updated_at
  BEFORE UPDATE ON coach_cancellation_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if a cancellation would be late based on coach policy
CREATE OR REPLACE FUNCTION check_cancellation_status(
  p_booking_id UUID
) RETURNS TABLE (
  is_late BOOLEAN,
  hours_until_booking NUMERIC,
  will_charge_session BOOLEAN,
  policy_hours INTEGER
) AS $$
DECLARE
  v_booking RECORD;
  v_policy RECORD;
  v_booking_datetime TIMESTAMPTZ;
  v_hours_remaining NUMERIC;
BEGIN
  -- Get booking details
  SELECT b.*, b.scheduled_date, b.start_time, b.coach_id
  INTO v_booking
  FROM bookings b
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get coach policy (or use defaults)
  SELECT COALESCE(cp.free_cancellation_hours, 24) as free_cancellation_hours,
         COALESCE(cp.late_cancel_charges_session, true) as late_cancel_charges_session
  INTO v_policy
  FROM coach_cancellation_policies cp
  WHERE cp.coach_id = v_booking.coach_id;

  -- Use defaults if no policy exists
  IF NOT FOUND THEN
    v_policy.free_cancellation_hours := 24;
    v_policy.late_cancel_charges_session := true;
  END IF;

  -- Calculate hours until booking
  v_booking_datetime := (v_booking.scheduled_date::DATE + v_booking.start_time::TIME)::TIMESTAMPTZ;
  v_hours_remaining := EXTRACT(EPOCH FROM (v_booking_datetime - now())) / 3600;

  -- Return results
  RETURN QUERY SELECT
    v_hours_remaining < v_policy.free_cancellation_hours,
    v_hours_remaining,
    v_hours_remaining < v_policy.free_cancellation_hours AND v_policy.late_cancel_charges_session,
    v_policy.free_cancellation_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
