-- ============================================
-- EXTEND BOOKINGS FOR CANCELLATION TRACKING
-- Add columns for late cancellation and waitlist integration
-- ============================================

-- Add columns to track late cancellations
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS was_late_cancellation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_charged_on_cancel BOOLEAN DEFAULT false;

-- ============================================
-- EXTEND NOTIFICATION TYPES
-- Add new notification types for cancellation, no-show, and waitlist
-- ============================================

-- Drop existing constraint and add extended one
ALTER TABLE booking_notifications DROP CONSTRAINT IF EXISTS booking_notifications_notification_type_check;

ALTER TABLE booking_notifications ADD CONSTRAINT booking_notifications_notification_type_check
  CHECK (notification_type IN (
    -- Existing types
    'booking_confirmed',
    'booking_cancelled',
    'booking_rescheduled',
    'reminder_24h',
    'reminder_1h',
    'package_low',
    'package_expired',
    -- New types
    'no_show_alert',
    'waitlist_slot_available',
    'waitlist_offer_expired',
    'late_cancellation'
  ));

-- ============================================
-- TRIGGER: Auto-check no-show threshold after marking no-show
-- ============================================

CREATE OR REPLACE FUNCTION trigger_check_no_show_on_booking_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'no_show'
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    -- Check threshold and create alert if needed
    PERFORM check_no_show_threshold(NEW.coach_id, NEW.client_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on bookings
DROP TRIGGER IF EXISTS bookings_check_no_show_trigger ON bookings;
CREATE TRIGGER bookings_check_no_show_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_no_show_on_booking_update();

-- ============================================
-- FUNCTION: Process cancellation with policy check
-- ============================================

CREATE OR REPLACE FUNCTION process_booking_cancellation(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_cancelled_by TEXT DEFAULT 'client'
) RETURNS TABLE (
  booking_id UUID,
  was_late BOOLEAN,
  session_charged BOOLEAN,
  hours_before NUMERIC
) AS $$
DECLARE
  v_booking RECORD;
  v_status RECORD;
  v_package RECORD;
BEGIN
  -- Get booking
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Check if already cancelled
  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking already cancelled';
  END IF;

  -- Get cancellation status
  SELECT * INTO v_status FROM check_cancellation_status(p_booking_id);

  -- If cancelled by coach, never charge session
  IF p_cancelled_by = 'coach' THEN
    v_status.will_charge_session := false;
  END IF;

  -- Update booking
  UPDATE bookings SET
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    was_late_cancellation = v_status.is_late,
    session_charged_on_cancel = v_status.will_charge_session
  WHERE id = p_booking_id;

  -- If session charged and booking has package, increment sessions_used
  IF v_status.will_charge_session AND v_booking.package_id IS NOT NULL THEN
    UPDATE booking_packages SET
      sessions_used = sessions_used + 1
    WHERE id = v_booking.package_id
    AND sessions_used < total_sessions;
  END IF;

  RETURN QUERY SELECT
    p_booking_id,
    v_status.is_late,
    v_status.will_charge_session,
    v_status.hours_until_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Trigger waitlist check when slot becomes available
-- ============================================

CREATE OR REPLACE FUNCTION get_waitlist_for_cancelled_slot(
  p_booking_id UUID
) RETURNS TABLE (
  waitlist_id UUID,
  client_id UUID,
  client_name TEXT,
  priority_score INTEGER,
  has_active_package BOOLEAN
) AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- Get the cancelled booking details
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Return matching waitlist candidates
  RETURN QUERY
  SELECT
    w.id,
    w.client_id,
    COALESCE(up.display_name, up.full_name, 'Unknown'),
    calculate_waitlist_priority(w.id, v_booking.scheduled_date, v_booking.start_time),
    (w.package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM booking_packages bp
      WHERE bp.id = w.package_id
      AND bp.status = 'active'
      AND bp.sessions_used < bp.total_sessions
    ))
  FROM waitlist_entries w
  LEFT JOIN user_profiles up ON up.user_id = w.client_id
  WHERE w.coach_id = v_booking.coach_id
  AND w.status = 'active'
  AND (
    array_length(w.preferred_days, 1) IS NULL
    OR array_length(w.preferred_days, 1) = 0
    OR EXTRACT(DOW FROM v_booking.scheduled_date)::INTEGER = ANY(w.preferred_days)
  )
  AND (
    w.preferred_time_start IS NULL
    OR (
      v_booking.start_time >= w.preferred_time_start
      AND v_booking.end_time <= COALESCE(w.preferred_time_end, '23:59:59'::TIME)
    )
  )
  ORDER BY calculate_waitlist_priority(w.id, v_booking.scheduled_date, v_booking.start_time) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
