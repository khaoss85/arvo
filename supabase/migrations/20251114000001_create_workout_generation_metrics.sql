-- Create table for tracking workout generation metrics
CREATE TABLE IF NOT EXISTS workout_generation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT FALSE,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_workout_generation_metrics_user_id ON workout_generation_metrics(user_id);
CREATE INDEX idx_workout_generation_metrics_request_id ON workout_generation_metrics(request_id);
CREATE INDEX idx_workout_generation_metrics_completed_at ON workout_generation_metrics(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_workout_generation_metrics_user_success ON workout_generation_metrics(user_id, success) WHERE success = TRUE;

-- Enable RLS
ALTER TABLE workout_generation_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own metrics
CREATE POLICY "Users can read own workout generation metrics"
  ON workout_generation_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert/update metrics
CREATE POLICY "Service role can manage workout generation metrics"
  ON workout_generation_metrics
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE workout_generation_metrics IS 'Tracks workout generation performance metrics for ETA calculation';
