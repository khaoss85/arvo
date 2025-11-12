-- Create user_approach_history table to track training approach changes over time
CREATE TABLE IF NOT EXISTS user_approach_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approach_id UUID NOT NULL REFERENCES training_approaches(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT false,

  -- Snapshot metadata at the time of switch
  total_workouts_completed INTEGER DEFAULT 0,
  total_weeks INTEGER DEFAULT 0,
  final_split_plan_id UUID REFERENCES split_plans(id) ON DELETE SET NULL,

  -- Optional notes
  switch_reason TEXT,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Only one active approach per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_approach_per_user
  ON user_approach_history(user_id) WHERE is_active = true;

-- Index for historical queries
CREATE INDEX IF NOT EXISTS idx_approach_history_user_date
  ON user_approach_history(user_id, started_at DESC);

-- Index for active lookups
CREATE INDEX IF NOT EXISTS idx_approach_history_active
  ON user_approach_history(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_approach_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own approach history"
  ON user_approach_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own approach history"
  ON user_approach_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own approach history"
  ON user_approach_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_approach_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_approach_history_updated_at
  BEFORE UPDATE ON user_approach_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_approach_history_updated_at();

-- Migrate existing user approaches to history table
-- This creates an initial history entry for users who already have an approach selected
INSERT INTO user_approach_history (user_id, approach_id, started_at, is_active)
SELECT
  user_id,
  approach_id,
  created_at,
  true
FROM user_profiles
WHERE approach_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Comment explaining the table
COMMENT ON TABLE user_approach_history IS 'Tracks the history of training approaches used by each user, enabling approach switching and historical analysis';
