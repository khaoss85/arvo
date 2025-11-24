-- Add training_focus field and make gender required for gender-aware split generation

-- First, update any existing NULL gender values to 'other' to allow NOT NULL constraint
UPDATE user_profiles
SET gender = 'other'
WHERE gender IS NULL;

-- Add training_focus column with constraint
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS training_focus TEXT CHECK (training_focus IN ('upper_body', 'lower_body', 'balanced'));

-- Make gender NOT NULL (safe now after UPDATE above)
ALTER TABLE user_profiles
  ALTER COLUMN gender SET NOT NULL,
  ALTER COLUMN gender SET DEFAULT 'other';

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.training_focus IS 'User training focus preference for split generation: upper_body emphasizes chest/back/arms, lower_body emphasizes glutes/hamstrings/quads, balanced for equal distribution';
COMMENT ON COLUMN user_profiles.gender IS 'User gender (required) for personalized training recommendations and strength standards - used with training_focus for optimal split generation';
