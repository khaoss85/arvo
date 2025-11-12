-- Migration: Add caloric intake tracking
-- Description: Adds caloric_intake_kcal field to track daily caloric surplus/deficit
--              in both user_profiles (current state) and caloric_phase_history (historical tracking)

-- Add caloric_intake_kcal to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS caloric_intake_kcal INTEGER
  CHECK (caloric_intake_kcal >= -1500 AND caloric_intake_kcal <= 1500);

-- Add caloric_intake_kcal to caloric_phase_history
ALTER TABLE caloric_phase_history
  ADD COLUMN IF NOT EXISTS caloric_intake_kcal INTEGER
  CHECK (caloric_intake_kcal >= -1500 AND caloric_intake_kcal <= 1500);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.caloric_intake_kcal IS
  'Daily caloric intake in kcal. Positive for surplus (bulk), negative for deficit (cut), null/0 for maintenance. Range: -1500 to +1500 kcal.';

COMMENT ON COLUMN caloric_phase_history.caloric_intake_kcal IS
  'Historical record of daily caloric intake during this phase. Positive for surplus, negative for deficit.';

-- Update the archive_previous_caloric_phase trigger function to also capture caloric_intake_kcal
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

    -- Create new history entry for the new phase (including caloric_intake_kcal)
    INSERT INTO caloric_phase_history (
      user_id,
      phase,
      started_at,
      is_active,
      caloric_intake_kcal
    ) VALUES (
      NEW.user_id,
      NEW.caloric_phase,
      COALESCE(NEW.caloric_phase_start_date, NOW()),
      TRUE,
      NEW.caloric_intake_kcal  -- Include the caloric intake from the profile
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
