-- ============================================
-- BOOKING SYSTEM FOR COACH
-- AI-driven booking with packages support
-- ============================================

-- 1. BOOKING PACKAGES (create first for foreign key reference)
-- Lesson packages for recurring clients
CREATE TABLE booking_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Package structure
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  sessions_per_week INTEGER DEFAULT 1 CHECK (sessions_per_week > 0),
  sessions_used INTEGER DEFAULT 0 CHECK (sessions_used >= 0),
  -- Validity
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. COACH AVAILABILITY
-- Flexible week-by-week slots
CREATE TABLE coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Prevent duplicate slots
  UNIQUE(coach_id, date, start_time)
);

-- 3. BOOKINGS
-- Individual training sessions
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Time slot
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
  -- Status management
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  -- Package tracking (optional)
  package_id UUID REFERENCES booking_packages(id) ON DELETE SET NULL,
  -- AI interaction tracking
  ai_scheduled BOOLEAN DEFAULT false,
  ai_suggestion_accepted BOOLEAN,
  -- Notes
  coach_notes TEXT,
  client_notes TEXT,
  cancellation_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 4. BOOKING NOTIFICATIONS
-- Queue for in-app + email reminders
CREATE TABLE booking_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'booking_confirmed',
    'booking_cancelled',
    'booking_rescheduled',
    'reminder_24h',
    'reminder_1h',
    'package_low',
    'package_expired'
  )),
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Coach availability: lookup by coach and date range
CREATE INDEX idx_coach_availability_coach_date ON coach_availability(coach_id, date);

-- Bookings: coach schedule view
CREATE INDEX idx_bookings_coach_date ON bookings(coach_id, scheduled_date);

-- Bookings: client view
CREATE INDEX idx_bookings_client_status ON bookings(client_id, status);

-- Bookings: package tracking
CREATE INDEX idx_bookings_package ON bookings(package_id) WHERE package_id IS NOT NULL;

-- Notifications: process pending
CREATE INDEX idx_booking_notifications_pending ON booking_notifications(scheduled_for, status)
  WHERE status = 'pending';

-- Packages: active packages lookup
CREATE INDEX idx_booking_packages_client ON booking_packages(client_id, coach_id, status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

-- COACH AVAILABILITY POLICIES
-- Coach can manage their own availability
CREATE POLICY coach_availability_coach_all ON coach_availability
  FOR ALL USING (coach_id = auth.uid());

-- Clients can view their coach's availability (if active relationship)
CREATE POLICY coach_availability_client_view ON coach_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_client_relationships
      WHERE coach_client_relationships.coach_id = coach_availability.coach_id
      AND coach_client_relationships.client_id = auth.uid()
      AND coach_client_relationships.status = 'active'
    )
  );

-- BOOKINGS POLICIES
-- Coach can manage bookings where they are the coach
CREATE POLICY bookings_coach_all ON bookings
  FOR ALL USING (coach_id = auth.uid());

-- Client can view and update their own bookings
CREATE POLICY bookings_client_select ON bookings
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY bookings_client_update ON bookings
  FOR UPDATE USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- PACKAGES POLICIES
-- Coach can manage packages where they are the coach
CREATE POLICY packages_coach_all ON booking_packages
  FOR ALL USING (coach_id = auth.uid());

-- Client can view their own packages
CREATE POLICY packages_client_select ON booking_packages
  FOR SELECT USING (client_id = auth.uid());

-- NOTIFICATIONS POLICIES
-- Recipients can view their own notifications
CREATE POLICY notifications_recipient_select ON booking_notifications
  FOR SELECT USING (recipient_id = auth.uid());

-- System can manage all notifications (for edge function)
-- Note: Edge functions use service role which bypasses RLS

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_availability_updated_at
  BEFORE UPDATE ON coach_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_packages_updated_at
  BEFORE UPDATE ON booking_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if a time slot is available for a coach
CREATE OR REPLACE FUNCTION is_slot_available(
  p_coach_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
  has_availability BOOLEAN;
  has_conflict BOOLEAN;
BEGIN
  -- Check if coach has availability for this slot
  SELECT EXISTS (
    SELECT 1 FROM coach_availability
    WHERE coach_id = p_coach_id
    AND date = p_date
    AND start_time <= p_start_time
    AND end_time >= p_end_time
    AND is_available = true
  ) INTO has_availability;

  IF NOT has_availability THEN
    RETURN false;
  END IF;

  -- Check for conflicting bookings
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE coach_id = p_coach_id
    AND scheduled_date = p_date
    AND status = 'confirmed'
    AND (
      (start_time <= p_start_time AND end_time > p_start_time)
      OR (start_time < p_end_time AND end_time >= p_end_time)
      OR (start_time >= p_start_time AND end_time <= p_end_time)
    )
  ) INTO has_conflict;

  RETURN NOT has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get coach's bookings for a date range
CREATE OR REPLACE FUNCTION get_coach_bookings(
  p_coach_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT,
  package_name TEXT,
  coach_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.client_id,
    COALESCE(up.display_name, up.full_name, 'Unknown') as client_name,
    b.scheduled_date,
    b.start_time,
    b.end_time,
    b.duration_minutes,
    b.status,
    bp.name as package_name,
    b.coach_notes
  FROM bookings b
  LEFT JOIN user_profiles up ON up.user_id = b.client_id
  LEFT JOIN booking_packages bp ON bp.id = b.package_id
  WHERE b.coach_id = p_coach_id
  AND b.scheduled_date BETWEEN p_start_date AND p_end_date
  ORDER BY b.scheduled_date, b.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get client's upcoming bookings
CREATE OR REPLACE FUNCTION get_client_upcoming_bookings(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  coach_id UUID,
  coach_name TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT,
  package_name TEXT,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.coach_id,
    COALESCE(cp.display_name, 'Coach') as coach_name,
    b.scheduled_date,
    b.start_time,
    b.end_time,
    b.duration_minutes,
    b.status,
    bp.name as package_name,
    (b.scheduled_date - CURRENT_DATE)::INTEGER as days_until
  FROM bookings b
  LEFT JOIN coach_profiles cp ON cp.user_id = b.coach_id
  LEFT JOIN booking_packages bp ON bp.id = b.package_id
  WHERE b.client_id = p_client_id
  AND b.scheduled_date >= CURRENT_DATE
  AND b.status = 'confirmed'
  ORDER BY b.scheduled_date, b.start_time
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
