-- Migration: Add workout insights and user memory system
-- Created: 2025-01-11
-- Description: Adds tables for storing user workout notes, AI-parsed insights, and consolidated user memories

-- ============================================================================
-- WORKOUT INSIGHTS TABLE
-- ============================================================================
-- Stores user notes from workouts and AI-parsed insights about pain, technique, energy, etc.

CREATE TABLE IF NOT EXISTS workout_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name text, -- Nullable, for exercise-specific insights

  -- Content
  user_note text NOT NULL, -- Original free-form note from user
  insight_type text, -- AI-parsed: 'pain', 'technique', 'energy', 'recovery', 'equipment', 'general'
  severity text, -- AI-parsed: 'info', 'caution', 'warning', 'critical'

  -- Temporal tracking
  status text DEFAULT 'active' NOT NULL, -- 'active', 'monitoring', 'resolved'
  resolution_proposed_by text, -- 'ai' | 'user' | null
  resolution_proposed_at timestamptz,
  resolved_at timestamptz,
  resolved_by text, -- 'ai' | 'user'

  -- AI-enriched metadata
  metadata jsonb DEFAULT '{}'::jsonb, -- {affectedMuscles[], suggestedActions[], relatedExercises[], context}
  relevance_score decimal(3,2) DEFAULT 1.0 NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  last_mentioned_at timestamptz DEFAULT now(),

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_insight_type CHECK (
    insight_type IS NULL OR
    insight_type IN ('pain', 'technique', 'energy', 'recovery', 'equipment', 'general')
  ),
  CONSTRAINT valid_severity CHECK (
    severity IS NULL OR
    severity IN ('info', 'caution', 'warning', 'critical')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'monitoring', 'resolved')
  ),
  CONSTRAINT valid_resolution_proposed_by CHECK (
    resolution_proposed_by IS NULL OR
    resolution_proposed_by IN ('ai', 'user')
  ),
  CONSTRAINT valid_resolved_by CHECK (
    resolved_by IS NULL OR
    resolved_by IN ('ai', 'user')
  )
);

-- Indexes for performance
CREATE INDEX idx_workout_insights_user ON workout_insights(user_id);
CREATE INDEX idx_workout_insights_workout ON workout_insights(workout_id);
CREATE INDEX idx_workout_insights_status ON workout_insights(status) WHERE status = 'active';
CREATE INDEX idx_workout_insights_exercise ON workout_insights(exercise_name) WHERE exercise_name IS NOT NULL;
CREATE INDEX idx_workout_insights_type ON workout_insights(insight_type) WHERE insight_type IS NOT NULL;
CREATE INDEX idx_workout_insights_severity ON workout_insights(severity) WHERE severity IS NOT NULL;

-- RLS Policies
ALTER TABLE workout_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON workout_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights"
  ON workout_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON workout_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON workout_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_workout_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_insights_updated_at
  BEFORE UPDATE ON workout_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_insights_updated_at();

-- ============================================================================
-- USER MEMORY ENTRIES TABLE
-- ============================================================================
-- Stores everything the system learns about the user (patterns, preferences, limitations, strengths)

CREATE TABLE IF NOT EXISTS user_memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Categorization
  memory_category text NOT NULL, -- 'preference', 'pattern', 'limitation', 'strength', 'equipment', 'learned_behavior'
  memory_source text NOT NULL, -- 'user_note', 'ai_observation', 'workout_pattern', 'substitution_history', 'profile_input'

  -- Content
  title text NOT NULL,
  description text,
  confidence_score decimal(3,2) DEFAULT 0.5 NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Linking
  source_id uuid, -- workout_insight_id, workout_id, or null if derived from pattern
  related_exercises text[] DEFAULT ARRAY[]::text[],
  related_muscles text[] DEFAULT ARRAY[]::text[],

  -- Lifecycle
  status text DEFAULT 'active' NOT NULL, -- 'active', 'outdated', 'archived'
  first_observed_at timestamptz DEFAULT now() NOT NULL,
  last_confirmed_at timestamptz DEFAULT now() NOT NULL,
  times_confirmed integer DEFAULT 1 NOT NULL CHECK (times_confirmed >= 0),

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_memory_category CHECK (
    memory_category IN ('preference', 'pattern', 'limitation', 'strength', 'equipment', 'learned_behavior')
  ),
  CONSTRAINT valid_memory_source CHECK (
    memory_source IN ('user_note', 'ai_observation', 'workout_pattern', 'substitution_history', 'profile_input')
  ),
  CONSTRAINT valid_memory_status CHECK (
    status IN ('active', 'outdated', 'archived')
  )
);

-- Indexes for performance
CREATE INDEX idx_user_memory_user ON user_memory_entries(user_id);
CREATE INDEX idx_user_memory_category ON user_memory_entries(memory_category);
CREATE INDEX idx_user_memory_status ON user_memory_entries(status) WHERE status = 'active';
CREATE INDEX idx_user_memory_confidence ON user_memory_entries(confidence_score) WHERE confidence_score >= 0.5;
CREATE INDEX idx_user_memory_source ON user_memory_entries(memory_source);

-- RLS Policies
ALTER TABLE user_memory_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories"
  ON user_memory_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
  ON user_memory_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON user_memory_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON user_memory_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_memory_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_memory_entries_updated_at
  BEFORE UPDATE ON user_memory_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_entries_updated_at();

-- ============================================================================
-- EXTEND WORKOUTS TABLE
-- ============================================================================
-- Add user_notes field for general post-workout notes

ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS user_notes text;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active insights for a user
CREATE OR REPLACE FUNCTION get_active_insights(p_user_id uuid, p_min_relevance decimal DEFAULT 0.3)
RETURNS TABLE (
  id uuid,
  workout_id uuid,
  exercise_name text,
  user_note text,
  insight_type text,
  severity text,
  metadata jsonb,
  relevance_score decimal,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wi.id,
    wi.workout_id,
    wi.exercise_name,
    wi.user_note,
    wi.insight_type,
    wi.severity,
    wi.metadata,
    wi.relevance_score,
    wi.created_at
  FROM workout_insights wi
  WHERE wi.user_id = p_user_id
    AND wi.status = 'active'
    AND wi.relevance_score >= p_min_relevance
  ORDER BY wi.relevance_score DESC, wi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active memories for a user
CREATE OR REPLACE FUNCTION get_active_memories(p_user_id uuid, p_min_confidence decimal DEFAULT 0.5)
RETURNS TABLE (
  id uuid,
  memory_category text,
  title text,
  description text,
  confidence_score decimal,
  related_exercises text[],
  related_muscles text[],
  metadata jsonb,
  times_confirmed integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ume.id,
    ume.memory_category,
    ume.title,
    ume.description,
    ume.confidence_score,
    ume.related_exercises,
    ume.related_muscles,
    ume.metadata,
    ume.times_confirmed
  FROM user_memory_entries ume
  WHERE ume.user_id = p_user_id
    AND ume.status = 'active'
    AND ume.confidence_score >= p_min_confidence
  ORDER BY ume.confidence_score DESC, ume.last_confirmed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update insight relevance score (time-decay)
CREATE OR REPLACE FUNCTION update_insight_relevance_scores()
RETURNS void AS $$
BEGIN
  UPDATE workout_insights
  SET
    relevance_score = GREATEST(
      0.3,
      1.0 - (EXTRACT(EPOCH FROM (now() - created_at)) / (90 * 24 * 3600)) * 0.7
    ),
    updated_at = now()
  WHERE status = 'active'
    AND relevance_score > 0.3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to boost memory confidence when pattern repeats
CREATE OR REPLACE FUNCTION boost_memory_confidence(p_memory_id uuid, p_boost_amount decimal DEFAULT 0.1)
RETURNS void AS $$
BEGIN
  UPDATE user_memory_entries
  SET
    confidence_score = LEAST(0.95, confidence_score + p_boost_amount),
    times_confirmed = times_confirmed + 1,
    last_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workout_insights IS 'Stores user workout notes and AI-parsed insights about pain, technique, energy, and other workout feedback';
COMMENT ON TABLE user_memory_entries IS 'Consolidated system knowledge about user preferences, patterns, limitations, and strengths learned over time';
COMMENT ON COLUMN workouts.user_notes IS 'Optional free-form notes added by user after completing workout';
COMMENT ON FUNCTION get_active_insights IS 'Returns all active insights for a user with relevance score above threshold';
COMMENT ON FUNCTION get_active_memories IS 'Returns all active memories for a user with confidence score above threshold';
COMMENT ON FUNCTION update_insight_relevance_scores IS 'Applies time-decay to insight relevance scores, minimum 0.3 after 90 days';
COMMENT ON FUNCTION boost_memory_confidence IS 'Increases memory confidence score when pattern is confirmed again, max 0.95';
