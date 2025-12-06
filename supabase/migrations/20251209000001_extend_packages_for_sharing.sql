-- ============================================
-- SMART PACKAGES: Shared Packages, Expiration & Upgrades
-- Extends booking_packages with sharing support and upgrade suggestions
-- ============================================

-- ============================================
-- 1. EXTEND BOOKING_PACKAGES FOR SHARING
-- ============================================

-- Add shared package support columns
ALTER TABLE booking_packages
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_with_client_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_shared_users INTEGER DEFAULT 1 CHECK (max_shared_users >= 1 AND max_shared_users <= 10);

-- Add comment for documentation
COMMENT ON COLUMN booking_packages.is_shared IS 'Whether this package can be used by multiple clients';
COMMENT ON COLUMN booking_packages.shared_with_client_ids IS 'Array of client IDs who can use this package (in addition to the primary client)';
COMMENT ON COLUMN booking_packages.max_shared_users IS 'Maximum number of clients who can share this package';

-- ============================================
-- 2. EXTEND BOOKINGS FOR SHARED PACKAGE TRACKING
-- ============================================

-- Track which client used each session (for shared packages)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS session_used_by_client_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN bookings.session_used_by_client_id IS 'For shared packages: which client actually used this session';

-- ============================================
-- 3. PACKAGE UPGRADE SUGGESTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS package_upgrade_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES booking_packages(id) ON DELETE CASCADE,

  -- Suggestion data
  reason TEXT NOT NULL CHECK (reason IN ('fast_usage', 'frequent_rebuy', 'high_attendance')),
  suggested_sessions INTEGER NOT NULL CHECK (suggested_sessions > 0),
  current_sessions INTEGER NOT NULL CHECK (current_sessions > 0),
  days_to_complete INTEGER NOT NULL CHECK (days_to_complete > 0),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'dismissed')),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- One suggestion per package (don't spam)
  UNIQUE(package_id)
);

-- Index for coach dashboard queries
CREATE INDEX IF NOT EXISTS idx_upgrade_suggestions_coach_status
  ON package_upgrade_suggestions(coach_id, status)
  WHERE status IN ('pending', 'sent');

-- RLS Policies
ALTER TABLE package_upgrade_suggestions ENABLE ROW LEVEL SECURITY;

-- Coaches can manage suggestions for their clients
CREATE POLICY upgrade_suggestions_coach_all
  ON package_upgrade_suggestions
  FOR ALL
  USING (coach_id = auth.uid());

-- ============================================
-- 4. EXTEND NOTIFICATION TYPES
-- ============================================

-- Drop existing constraint and add extended one with new types
ALTER TABLE booking_notifications DROP CONSTRAINT IF EXISTS booking_notifications_notification_type_check;

ALTER TABLE booking_notifications ADD CONSTRAINT booking_notifications_notification_type_check
  CHECK (notification_type IN (
    -- Existing booking types
    'booking_confirmed',
    'booking_cancelled',
    'booking_rescheduled',
    'reminder_24h',
    'reminder_1h',
    -- Existing package types (now actually used)
    'package_low',
    'package_expired',
    -- Cancellation/Waitlist types
    'no_show_alert',
    'waitlist_slot_available',
    'waitlist_offer_expired',
    'late_cancellation',
    -- New package types
    'package_expiring_soon',
    'package_upgrade_suggestion'
  ));

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get packages expiring within N days
CREATE OR REPLACE FUNCTION get_expiring_packages(
  p_coach_id UUID,
  p_within_days INTEGER DEFAULT 7
) RETURNS TABLE (
  package_id UUID,
  client_id UUID,
  client_name TEXT,
  package_name TEXT,
  end_date DATE,
  days_until_expiry INTEGER,
  sessions_remaining INTEGER,
  is_shared BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id,
    bp.client_id,
    COALESCE(up.display_name, up.full_name, 'Unknown')::TEXT,
    bp.name,
    bp.end_date,
    (bp.end_date - CURRENT_DATE)::INTEGER,
    (bp.total_sessions - bp.sessions_used)::INTEGER,
    bp.is_shared
  FROM booking_packages bp
  LEFT JOIN user_profiles up ON up.user_id = bp.client_id
  WHERE bp.coach_id = p_coach_id
    AND bp.status = 'active'
    AND bp.end_date IS NOT NULL
    AND bp.end_date <= CURRENT_DATE + p_within_days
    AND bp.end_date >= CURRENT_DATE
    AND bp.sessions_used < bp.total_sessions
  ORDER BY bp.end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if upgrade suggestion should be created
CREATE OR REPLACE FUNCTION should_suggest_upgrade(
  p_package_id UUID
) RETURNS TABLE (
  should_suggest BOOLEAN,
  reason TEXT,
  days_to_complete INTEGER,
  suggested_sessions INTEGER
) AS $$
DECLARE
  v_package RECORD;
  v_days INTEGER;
  v_suggested INTEGER;
BEGIN
  -- Get package details
  SELECT * INTO v_package FROM booking_packages WHERE id = p_package_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Only check completed packages
  IF v_package.sessions_used < v_package.total_sessions THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check if already suggested
  IF EXISTS (SELECT 1 FROM package_upgrade_suggestions WHERE package_id = p_package_id) THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Calculate days to complete
  v_days := EXTRACT(DAY FROM (now() - v_package.start_date))::INTEGER;

  -- If completed in less than 14 days, suggest upgrade
  IF v_days < 14 AND v_package.total_sessions >= 5 THEN
    -- Suggest 50% more sessions, rounded to common package sizes
    v_suggested := CASE
      WHEN v_package.total_sessions <= 5 THEN 10
      WHEN v_package.total_sessions <= 10 THEN 15
      WHEN v_package.total_sessions <= 15 THEN 20
      ELSE v_package.total_sessions + 5
    END;

    RETURN QUERY SELECT true, 'fast_usage'::TEXT, v_days, v_suggested;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shared package usage breakdown
CREATE OR REPLACE FUNCTION get_shared_package_usage(
  p_package_id UUID
) RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  sessions_used BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  v_total_used INTEGER;
BEGIN
  -- Get total sessions used
  SELECT bp.sessions_used INTO v_total_used
  FROM booking_packages bp
  WHERE bp.id = p_package_id;

  IF v_total_used = 0 THEN
    v_total_used := 1; -- Avoid division by zero
  END IF;

  RETURN QUERY
  SELECT
    b.session_used_by_client_id,
    COALESCE(up.display_name, up.full_name, 'Unknown')::TEXT,
    COUNT(*)::BIGINT,
    ROUND((COUNT(*)::NUMERIC / v_total_used * 100), 1)
  FROM bookings b
  LEFT JOIN user_profiles up ON up.user_id = b.session_used_by_client_id
  WHERE b.package_id = p_package_id
    AND b.session_used_by_client_id IS NOT NULL
    AND b.status IN ('completed', 'confirmed')
  GROUP BY b.session_used_by_client_id, up.display_name, up.full_name
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a client can use a package (for shared packages)
CREATE OR REPLACE FUNCTION can_client_use_package(
  p_package_id UUID,
  p_client_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_package RECORD;
BEGIN
  SELECT * INTO v_package FROM booking_packages WHERE id = p_package_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if active and has remaining sessions
  IF v_package.status != 'active' OR v_package.sessions_used >= v_package.total_sessions THEN
    RETURN false;
  END IF;

  -- Check if expired
  IF v_package.end_date IS NOT NULL AND v_package.end_date < CURRENT_DATE THEN
    RETURN false;
  END IF;

  -- Primary client can always use
  IF v_package.client_id = p_client_id THEN
    RETURN true;
  END IF;

  -- For shared packages, check if client is in shared list
  IF v_package.is_shared AND p_client_id = ANY(v_package.shared_with_client_ids) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGER: Auto-check upgrade on package completion
-- ============================================

CREATE OR REPLACE FUNCTION trigger_check_upgrade_on_package_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_suggestion RECORD;
BEGIN
  -- Only trigger when package becomes fully used
  IF NEW.sessions_used = NEW.total_sessions AND OLD.sessions_used < OLD.total_sessions THEN
    -- Check if should suggest upgrade
    SELECT * INTO v_suggestion FROM should_suggest_upgrade(NEW.id);

    IF v_suggestion.should_suggest THEN
      -- Create suggestion
      INSERT INTO package_upgrade_suggestions (
        coach_id, client_id, package_id,
        reason, suggested_sessions, current_sessions, days_to_complete
      ) VALUES (
        NEW.coach_id, NEW.client_id, NEW.id,
        v_suggestion.reason, v_suggestion.suggested_sessions,
        NEW.total_sessions, v_suggestion.days_to_complete
      )
      ON CONFLICT (package_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS package_check_upgrade_trigger ON booking_packages;
CREATE TRIGGER package_check_upgrade_trigger
  AFTER UPDATE ON booking_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_upgrade_on_package_complete();

-- ============================================
-- 7. UPDATE RLS FOR SHARED PACKAGES
-- ============================================

-- Extend booking_packages RLS to allow shared clients to view
DROP POLICY IF EXISTS client_can_view_own_packages ON booking_packages;
CREATE POLICY client_can_view_own_packages ON booking_packages
  FOR SELECT
  USING (
    client_id = auth.uid()
    OR auth.uid() = ANY(shared_with_client_ids)
  );
