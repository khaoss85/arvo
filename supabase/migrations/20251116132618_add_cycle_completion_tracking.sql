-- Add cycle tracking fields to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN cycles_completed INTEGER DEFAULT 0 CHECK (cycles_completed >= 0),
  ADD COLUMN current_cycle_start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN last_cycle_completed_at TIMESTAMP WITH TIME ZONE;

-- Create cycle_completions table for historical tracking
CREATE TABLE cycle_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  split_plan_id UUID NOT NULL REFERENCES split_plans(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL CHECK (cycle_number > 0),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Aggregated statistics
  total_volume DECIMAL(10, 2) NOT NULL CHECK (total_volume >= 0),
  total_workouts_completed INTEGER NOT NULL CHECK (total_workouts_completed >= 0),
  avg_mental_readiness DECIMAL(3, 2) CHECK (avg_mental_readiness >= 1 AND avg_mental_readiness <= 5),
  total_sets INTEGER NOT NULL CHECK (total_sets >= 0),
  total_duration_seconds INTEGER CHECK (total_duration_seconds >= 0),

  -- Detailed breakdowns
  volume_by_muscle_group JSONB DEFAULT '{}',
  workouts_by_type JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_cycle_completions_user_id ON cycle_completions(user_id);
CREATE INDEX idx_cycle_completions_completed_at ON cycle_completions(completed_at DESC);
CREATE INDEX idx_cycle_completions_user_split ON cycle_completions(user_id, split_plan_id);

-- Add unique constraint to ensure cycle numbers are sequential per user
CREATE UNIQUE INDEX idx_cycle_completions_user_cycle_number ON cycle_completions(user_id, cycle_number);

-- Add RLS policies
ALTER TABLE cycle_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cycle completions"
  ON cycle_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cycle completions"
  ON cycle_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_cycle_completions_updated_at
  BEFORE UPDATE ON cycle_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE cycle_completions IS 'Historical record of completed training cycles with aggregated statistics';
COMMENT ON COLUMN user_profiles.cycles_completed IS 'Total number of split cycles completed by the user';
COMMENT ON COLUMN user_profiles.current_cycle_start_date IS 'When the current cycle started';
COMMENT ON COLUMN user_profiles.last_cycle_completed_at IS 'When the last cycle was completed';
