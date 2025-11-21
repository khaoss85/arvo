-- Create user_milestones table to track user achievements independent from email system
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ensure unique milestones per user (can't have duplicate "onboarding_complete" for same user)
  CONSTRAINT unique_user_milestone UNIQUE (user_id, milestone_type)
);

-- Create indices for performance
CREATE INDEX idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_created_at ON user_milestones(created_at DESC);
CREATE INDEX idx_user_milestones_user_created ON user_milestones(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only read their own milestones
CREATE POLICY "Users can view their own milestones"
  ON user_milestones
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert milestones
CREATE POLICY "Service role can insert milestones"
  ON user_milestones
  FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE user_milestones IS 'Tracks user achievement milestones independent from email delivery system';
COMMENT ON COLUMN user_milestones.milestone_type IS 'Type of milestone: onboarding_complete, first_workout_generated, first_workout_complete, first_cycle_complete, etc.';
COMMENT ON COLUMN user_milestones.metadata IS 'Additional metadata specific to the milestone type (e.g., workout_id, cycle_id)';
