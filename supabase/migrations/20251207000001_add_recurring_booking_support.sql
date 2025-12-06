-- =====================================================
-- Add Recurring Booking Support
-- =====================================================
-- Adds fields to support recurring booking series
-- and AI-suggested slots for packages

-- =====================================================
-- 1. Add recurring fields to bookings table
-- =====================================================

-- Series ID to group recurring bookings together
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS recurring_series_id UUID DEFAULT NULL;

-- Recurring pattern configuration (JSONB for flexibility)
-- Structure: { frequency, endType, endValue, sourceType, packageId?, dayOfWeek[], timeSlot }
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS recurring_pattern JSONB DEFAULT NULL;

-- Position in the recurring series (1, 2, 3...)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS occurrence_index INTEGER DEFAULT NULL;

-- Index for efficient series lookups
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_series
  ON bookings(recurring_series_id)
  WHERE recurring_series_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bookings.recurring_series_id IS
  'Groups related bookings into a series. NULL for single bookings.';
COMMENT ON COLUMN bookings.recurring_pattern IS
  'JSONB storing recurrence rules: { frequency: "weekly"|"biweekly", endType: "count"|"date", endValue: number|"YYYY-MM-DD", sourceType: "manual"|"ai_package", packageId?: uuid, dayOfWeek: number[], timeSlot: "HH:MM" }';
COMMENT ON COLUMN bookings.occurrence_index IS
  'Position in series (1, 2, 3...). Used for "edit this and following" operations.';

-- =====================================================
-- 2. Add AI suggestion fields to booking_packages table
-- =====================================================

-- AI-suggested weekly slots
-- Structure: [{ dayOfWeek: 0-6, time: "HH:MM", confidence: 0-100 }]
ALTER TABLE booking_packages
  ADD COLUMN IF NOT EXISTS ai_suggested_slots JSONB DEFAULT NULL;

-- Whether coach has confirmed/adjusted the suggested slots
ALTER TABLE booking_packages
  ADD COLUMN IF NOT EXISTS slots_confirmed BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN booking_packages.ai_suggested_slots IS
  'AI-suggested weekly slots: [{ dayOfWeek: 0-6, time: "HH:MM", confidence: 0-100, reason?: string }]';
COMMENT ON COLUMN booking_packages.slots_confirmed IS
  'Whether coach has confirmed/adjusted the suggested slots';

-- =====================================================
-- 3. Helper functions for recurring bookings
-- =====================================================

-- Function to get all bookings in a series
CREATE OR REPLACE FUNCTION get_series_bookings(p_series_id UUID)
RETURNS SETOF bookings AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM bookings
  WHERE recurring_series_id = p_series_id
  ORDER BY scheduled_date, start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel all future bookings in a series from a given booking
CREATE OR REPLACE FUNCTION cancel_series_from_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_series_id UUID;
  v_booking_date DATE;
  v_cancelled_count INTEGER;
BEGIN
  -- Get series ID and date from the source booking
  SELECT recurring_series_id, scheduled_date
  INTO v_series_id, v_booking_date
  FROM bookings
  WHERE id = p_booking_id;

  -- If not part of a series, just cancel the single booking
  IF v_series_id IS NULL THEN
    UPDATE bookings
    SET status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = p_reason
    WHERE id = p_booking_id
      AND status = 'confirmed';
    RETURN 1;
  END IF;

  -- Cancel this and all future bookings in the series
  UPDATE bookings
  SET status = 'cancelled',
      cancelled_at = NOW(),
      cancellation_reason = p_reason
  WHERE recurring_series_id = v_series_id
    AND scheduled_date >= v_booking_date
    AND status = 'confirmed';

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel entire series
CREATE OR REPLACE FUNCTION cancel_entire_series(
  p_series_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  UPDATE bookings
  SET status = 'cancelled',
      cancelled_at = NOW(),
      cancellation_reason = p_reason
  WHERE recurring_series_id = p_series_id
    AND status = 'confirmed';

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check availability for a recurring pattern
CREATE OR REPLACE FUNCTION check_recurring_availability(
  p_coach_id UUID,
  p_dates DATE[],
  p_start_time TIME,
  p_end_time TIME
)
RETURNS TABLE (
  check_date DATE,
  is_available BOOLEAN,
  conflict_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_checks AS (
    SELECT unnest(p_dates) AS check_date
  )
  SELECT
    dc.check_date,
    CASE
      -- Check if coach has availability set for this date/time
      WHEN NOT EXISTS (
        SELECT 1 FROM coach_availability ca
        WHERE ca.coach_id = p_coach_id
          AND ca.date = dc.check_date
          AND ca.start_time <= p_start_time
          AND ca.end_time >= p_end_time
          AND ca.is_available = true
      ) THEN false
      -- Check if slot already booked
      WHEN EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.coach_id = p_coach_id
          AND b.scheduled_date = dc.check_date
          AND b.status = 'confirmed'
          AND (
            (b.start_time <= p_start_time AND b.end_time > p_start_time) OR
            (b.start_time < p_end_time AND b.end_time >= p_end_time) OR
            (b.start_time >= p_start_time AND b.end_time <= p_end_time)
          )
      ) THEN false
      ELSE true
    END AS is_available,
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM coach_availability ca
        WHERE ca.coach_id = p_coach_id
          AND ca.date = dc.check_date
          AND ca.start_time <= p_start_time
          AND ca.end_time >= p_end_time
          AND ca.is_available = true
      ) THEN 'Coach not available'
      WHEN EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.coach_id = p_coach_id
          AND b.scheduled_date = dc.check_date
          AND b.status = 'confirmed'
          AND (
            (b.start_time <= p_start_time AND b.end_time > p_start_time) OR
            (b.start_time < p_end_time AND b.end_time >= p_end_time) OR
            (b.start_time >= p_start_time AND b.end_time <= p_end_time)
          )
      ) THEN 'Slot already booked'
      ELSE NULL
    END AS conflict_reason
  FROM date_checks dc
  ORDER BY dc.check_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_series_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_series_from_booking(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_entire_series(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, DATE[], TIME, TIME) TO authenticated;
