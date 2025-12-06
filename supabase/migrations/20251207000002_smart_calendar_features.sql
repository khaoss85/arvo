-- =====================================================
-- SMART CALENDAR FEATURES
-- Anti-buchi, Blocchi personali, Multi-location
-- =====================================================

-- =====================================================
-- 1. SESSION LOCATION TYPE (Multi-location)
-- =====================================================

-- Create enum for session location
DO $$ BEGIN
  CREATE TYPE session_location_type AS ENUM ('in_person', 'online');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add location_type to coach_availability
ALTER TABLE coach_availability
  ADD COLUMN IF NOT EXISTS location_type session_location_type NOT NULL DEFAULT 'in_person';

-- Update unique constraint to include location_type
-- First drop the old constraint if it exists
ALTER TABLE coach_availability
  DROP CONSTRAINT IF EXISTS coach_availability_coach_id_date_start_time_key;

-- Create new unique constraint including location_type
ALTER TABLE coach_availability
  ADD CONSTRAINT coach_availability_coach_date_time_location_key
  UNIQUE (coach_id, date, start_time, location_type);

-- Add location_type and meeting_url to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS location_type session_location_type NOT NULL DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS meeting_url TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN coach_availability.location_type IS
  'Where the session takes place: in_person (at gym) or online';
COMMENT ON COLUMN bookings.location_type IS
  'Where the session takes place: in_person (at gym) or online';
COMMENT ON COLUMN bookings.meeting_url IS
  'Video call URL for online sessions (Zoom, Google Meet, etc.)';

-- =====================================================
-- 2. COACH BLOCKS (Blocchi personali)
-- =====================================================

CREATE TABLE IF NOT EXISTS coach_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'competition', 'travel', 'study', 'personal', 'custom'
  )),
  custom_reason TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,  -- NULL = full day block
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

-- Index for efficient coach + date range queries
CREATE INDEX IF NOT EXISTS idx_coach_blocks_coach_date
  ON coach_blocks(coach_id, start_date, end_date);

-- Add comments for documentation
COMMENT ON TABLE coach_blocks IS
  'Personal blocks when coach is unavailable (competition, travel, study, etc.)';
COMMENT ON COLUMN coach_blocks.block_type IS
  'Predefined block types: competition, travel, study, personal, custom';
COMMENT ON COLUMN coach_blocks.start_time IS
  'NULL means full day block; otherwise partial day block';

-- Enable RLS
ALTER TABLE coach_blocks ENABLE ROW LEVEL SECURITY;

-- Coach can fully manage their own blocks
CREATE POLICY coach_blocks_coach_all ON coach_blocks
  FOR ALL USING (coach_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_coach_blocks_updated_at
  BEFORE UPDATE ON coach_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. CALENDAR OPTIMIZATION SUGGESTIONS (Anti-buchi)
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'consolidate_gap', 'create_block', 'optimize_day'
  )),
  source_booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Proposed change
  proposed_date DATE NOT NULL,
  proposed_start_time TIME NOT NULL,
  proposed_end_time TIME NOT NULL,

  -- Gap analysis details
  gap_details JSONB NOT NULL DEFAULT '{}',
  reason_short TEXT NOT NULL,        -- Short summary (max ~50 chars)
  reason_detailed TEXT,              -- Full explanation
  benefit_score INTEGER CHECK (benefit_score >= 0 AND benefit_score <= 100),
  client_preference_score INTEGER DEFAULT 50 CHECK (client_preference_score >= 0 AND client_preference_score <= 100),

  -- Status management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'applied', 'expired'
  )),

  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for efficient pending suggestions lookup
CREATE INDEX IF NOT EXISTS idx_optimization_coach_pending
  ON calendar_optimization_suggestions(coach_id, status)
  WHERE status = 'pending';

-- Index for source booking lookups
CREATE INDEX IF NOT EXISTS idx_optimization_source_booking
  ON calendar_optimization_suggestions(source_booking_id);

-- Add comments for documentation
COMMENT ON TABLE calendar_optimization_suggestions IS
  'AI-generated suggestions to optimize coach calendar (reduce gaps, create blocks)';
COMMENT ON COLUMN calendar_optimization_suggestions.suggestion_type IS
  'consolidate_gap: move booking to close gap; create_block: consolidation creates free block; optimize_day: general day optimization';
COMMENT ON COLUMN calendar_optimization_suggestions.benefit_score IS
  'How beneficial this optimization is (0-100). Higher = more impactful';
COMMENT ON COLUMN calendar_optimization_suggestions.client_preference_score IS
  'How well the new slot matches client preferences (0-100). Based on booking history';
COMMENT ON COLUMN calendar_optimization_suggestions.gap_details IS
  'JSONB with gap analysis: { originalSlot, gapBefore, gapAfter, freedMinutes, etc. }';

-- Enable RLS
ALTER TABLE calendar_optimization_suggestions ENABLE ROW LEVEL SECURITY;

-- Coach can fully manage suggestions for their calendar
CREATE POLICY optimization_coach_all ON calendar_optimization_suggestions
  FOR ALL USING (coach_id = auth.uid());

-- =====================================================
-- 4. UPDATE is_slot_available FUNCTION
-- =====================================================
-- New version that checks blocks and handles location types

-- Drop old function first (different signature)
DROP FUNCTION IF EXISTS is_slot_available(UUID, DATE, TIME, TIME);

CREATE OR REPLACE FUNCTION is_slot_available(
  p_coach_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_location_type session_location_type DEFAULT 'in_person'
) RETURNS BOOLEAN AS $$
DECLARE
  has_availability BOOLEAN;
  has_conflict BOOLEAN;
  is_blocked BOOLEAN;
BEGIN
  -- 1. Check if date/time falls within any coach block
  SELECT EXISTS (
    SELECT 1 FROM coach_blocks
    WHERE coach_id = p_coach_id
    AND p_date BETWEEN start_date AND end_date
    AND (
      -- Full day block
      (start_time IS NULL AND end_time IS NULL)
      OR
      -- Partial day block that overlaps
      (start_time IS NOT NULL AND end_time IS NOT NULL
       AND p_start_time < end_time AND p_end_time > start_time)
    )
  ) INTO is_blocked;

  IF is_blocked THEN
    RETURN false;
  END IF;

  -- 2. Check if coach has availability for this location type
  SELECT EXISTS (
    SELECT 1 FROM coach_availability
    WHERE coach_id = p_coach_id
    AND date = p_date
    AND start_time <= p_start_time
    AND end_time >= p_end_time
    AND is_available = true
    AND location_type = p_location_type
  ) INTO has_availability;

  IF NOT has_availability THEN
    RETURN false;
  END IF;

  -- 3. Check for booking conflicts (ANY location type - coach can only be in one place)
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE coach_id = p_coach_id
    AND scheduled_date = p_date
    AND status = 'confirmed'
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
  ) INTO has_conflict;

  RETURN NOT has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION is_slot_available IS
  'Check if a time slot is available for booking. Considers: blocks, availability, existing bookings across all locations.';

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to check if a date range is blocked
CREATE OR REPLACE FUNCTION is_coach_blocked(
  p_coach_id UUID,
  p_date DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  is_blocked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM coach_blocks
    WHERE coach_id = p_coach_id
    AND p_date BETWEEN start_date AND end_date
    AND (
      -- Full day block
      (start_time IS NULL AND end_time IS NULL)
      OR
      -- Time range not specified - any block counts
      (p_start_time IS NULL AND p_end_time IS NULL)
      OR
      -- Partial day block that overlaps with given times
      (start_time IS NOT NULL AND end_time IS NOT NULL
       AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL
       AND p_start_time < end_time AND p_end_time > start_time)
    )
  ) INTO is_blocked;

  RETURN is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find bookings that conflict with a block
CREATE OR REPLACE FUNCTION get_block_conflicts(
  p_coach_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL
) RETURNS TABLE (
  booking_id UUID,
  client_id UUID,
  client_name TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id as booking_id,
    b.client_id,
    COALESCE(up.display_name, up.full_name, 'Unknown') as client_name,
    b.scheduled_date,
    b.start_time,
    b.end_time,
    b.status
  FROM bookings b
  LEFT JOIN user_profiles up ON up.user_id = b.client_id
  WHERE b.coach_id = p_coach_id
  AND b.scheduled_date BETWEEN p_start_date AND p_end_date
  AND b.status = 'confirmed'
  AND (
    -- Full day block
    (p_start_time IS NULL AND p_end_time IS NULL)
    OR
    -- Partial day block that overlaps
    (p_start_time IS NOT NULL AND p_end_time IS NOT NULL
     AND b.start_time < p_end_time AND b.end_time > p_start_time)
  )
  ORDER BY b.scheduled_date, b.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_slot_available(UUID, DATE, TIME, TIME, session_location_type) TO authenticated;
GRANT EXECUTE ON FUNCTION is_coach_blocked(UUID, DATE, TIME, TIME) TO authenticated;
GRANT EXECUTE ON FUNCTION get_block_conflicts(UUID, DATE, DATE, TIME, TIME) TO authenticated;
