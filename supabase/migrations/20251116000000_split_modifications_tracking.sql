-- Migration: Split Modifications Tracking
-- Created: 2025-11-16
-- Description: Adds table for logging user split customizations with AI validation and undo capability

-- ============================================================================
-- SPLIT MODIFICATIONS TABLE
-- ============================================================================
-- Stores all user-initiated modifications to their split plans
-- Enables AI context improvement and undo functionality

CREATE TABLE IF NOT EXISTS split_modifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  split_plan_id uuid NOT NULL REFERENCES split_plans(id) ON DELETE CASCADE,

  -- Modification details
  modification_type text NOT NULL, -- 'swap_days', 'toggle_muscle', 'change_variation'
  details jsonb NOT NULL, -- Type-specific details (e.g., {fromDay: 2, toDay: 5, fromSession: {...}, toSession: {...}})

  -- Undo capability
  previous_state jsonb NOT NULL, -- Complete state before modification for rollback

  -- AI validation
  ai_validation jsonb NOT NULL, -- {validation: 'approved'|'caution'|'not_recommended', rationale: string, warnings: [], suggestions: [], volumeImpact?: {}}

  -- User behavior tracking
  user_override boolean DEFAULT false NOT NULL, -- True if user proceeded despite AI warning
  user_reason text, -- Optional user explanation for the modification

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_modification_type CHECK (
    modification_type IN ('swap_days', 'toggle_muscle', 'change_variation')
  ),
  CONSTRAINT valid_ai_validation_level CHECK (
    ai_validation->>'validation' IN ('approved', 'caution', 'not_recommended')
  )
);

-- Indexes for performance
CREATE INDEX idx_split_modifications_user ON split_modifications(user_id);
CREATE INDEX idx_split_modifications_split_plan ON split_modifications(split_plan_id);
CREATE INDEX idx_split_modifications_type ON split_modifications(modification_type);
CREATE INDEX idx_split_modifications_created_at ON split_modifications(created_at DESC);
CREATE INDEX idx_split_modifications_override ON split_modifications(user_override) WHERE user_override = true;

-- GIN index for JSONB queries
CREATE INDEX idx_split_modifications_details ON split_modifications USING GIN (details);
CREATE INDEX idx_split_modifications_ai_validation ON split_modifications USING GIN (ai_validation);

-- RLS Policies
ALTER TABLE split_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own split modifications"
  ON split_modifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own split modifications"
  ON split_modifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own split modifications"
  ON split_modifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own split modifications"
  ON split_modifications FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_split_modifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER split_modifications_updated_at
  BEFORE UPDATE ON split_modifications
  FOR EACH ROW
  EXECUTE FUNCTION update_split_modifications_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get recent split modifications for a user
CREATE OR REPLACE FUNCTION get_recent_split_modifications(p_user_id uuid, p_limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  split_plan_id uuid,
  modification_type text,
  details jsonb,
  ai_validation jsonb,
  user_override boolean,
  user_reason text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.split_plan_id,
    sm.modification_type,
    sm.details,
    sm.ai_validation,
    sm.user_override,
    sm.user_reason,
    sm.created_at
  FROM split_modifications sm
  WHERE sm.user_id = p_user_id
  ORDER BY sm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the last modification for potential undo
CREATE OR REPLACE FUNCTION get_last_split_modification(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  split_plan_id uuid,
  modification_type text,
  details jsonb,
  previous_state jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.split_plan_id,
    sm.modification_type,
    sm.details,
    sm.previous_state,
    sm.created_at
  FROM split_modifications sm
  WHERE sm.user_id = p_user_id
  ORDER BY sm.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE split_modifications IS 'Tracks all user customizations to split plans with AI validation and undo capability';
COMMENT ON COLUMN split_modifications.modification_type IS 'Type of modification: swap_days (swap two cycle days), toggle_muscle (add/remove muscle from session), change_variation (A <-> B)';
COMMENT ON COLUMN split_modifications.details IS 'Type-specific modification details in JSONB format';
COMMENT ON COLUMN split_modifications.previous_state IS 'Complete split plan state before modification for undo/rollback functionality';
COMMENT ON COLUMN split_modifications.ai_validation IS 'AI validation result with validation level, rationale, warnings, and suggestions';
COMMENT ON COLUMN split_modifications.user_override IS 'Whether user proceeded with modification despite AI caution or not_recommended warning';
COMMENT ON COLUMN split_modifications.user_reason IS 'Optional user-provided reason for making the modification';
COMMENT ON FUNCTION get_recent_split_modifications IS 'Returns recent split modifications for AI context, default last 20';
COMMENT ON FUNCTION get_last_split_modification IS 'Returns the most recent modification for undo functionality, includes previous_state';
