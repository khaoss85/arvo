-- Migration: Create caloric phase history tracking table
-- Description: Tracks historical changes in user's caloric phase (bulk/cut/maintenance)
--              for long-term analytics and insights on phase cycling patterns.

-- Create caloric_phase_history table
CREATE TABLE IF NOT EXISTS caloric_phase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('bulk', 'cut', 'maintenance')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  duration_weeks INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (ended_at - started_at)) / 604800  -- seconds in a week
      ELSE
        EXTRACT(EPOCH FROM (NOW() - started_at)) / 604800
    END
  ) STORED,
  avg_weight_change DECIMAL(5,2),  -- kg gained/lost during phase (for analytics)
  notes TEXT,  -- optional user notes about the phase
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE caloric_phase_history IS
  'Historical record of user caloric phase changes (bulk/cut/maintenance) for long-term tracking and analytics.';

COMMENT ON COLUMN caloric_phase_history.phase IS
  'The caloric phase: bulk (surplus), cut (deficit), or maintenance (balance).';

COMMENT ON COLUMN caloric_phase_history.duration_weeks IS
  'Automatically calculated duration of the phase in weeks.';

COMMENT ON COLUMN caloric_phase_history.avg_weight_change IS
  'Average weight change in kg during this phase (positive for gain, negative for loss). Optional analytics field.';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_caloric_phase_history_user_id
  ON caloric_phase_history(user_id);

CREATE INDEX IF NOT EXISTS idx_caloric_phase_history_is_active
  ON caloric_phase_history(user_id, is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_caloric_phase_history_started_at
  ON caloric_phase_history(user_id, started_at DESC);

-- Enable Row Level Security
ALTER TABLE caloric_phase_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own phase history
CREATE POLICY "Users can view their own caloric phase history"
  ON caloric_phase_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own caloric phase history"
  ON caloric_phase_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caloric phase history"
  ON caloric_phase_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caloric phase history"
  ON caloric_phase_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to archive previous active phase when user changes phase
CREATE OR REPLACE FUNCTION archive_previous_caloric_phase()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if caloric_phase actually changed and is not null
  IF NEW.caloric_phase IS NOT NULL AND
     (OLD.caloric_phase IS NULL OR NEW.caloric_phase != OLD.caloric_phase) THEN

    -- End any currently active phases
    UPDATE caloric_phase_history
    SET
      is_active = FALSE,
      ended_at = NOW(),
      updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND is_active = TRUE;

    -- Create new history entry for the new phase
    INSERT INTO caloric_phase_history (
      user_id,
      phase,
      started_at,
      is_active
    ) VALUES (
      NEW.user_id,
      NEW.caloric_phase,
      COALESCE(NEW.caloric_phase_start_date, NOW()),
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically archive phase when user_profiles.caloric_phase changes
CREATE TRIGGER trigger_archive_caloric_phase
  AFTER UPDATE OF caloric_phase ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION archive_previous_caloric_phase();

-- Create updated_at trigger for caloric_phase_history table
CREATE TRIGGER set_updated_at_caloric_phase_history
  BEFORE UPDATE ON caloric_phase_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
