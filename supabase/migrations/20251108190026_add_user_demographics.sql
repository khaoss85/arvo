-- Add demographic fields to user_profiles table for personalized AI training

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 13 AND age <= 120),
  ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) CHECK (weight > 0 AND weight <= 500),
  ADD COLUMN IF NOT EXISTS height DECIMAL(5,2) CHECK (height > 0 AND height <= 300);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.gender IS 'User gender for personalized training recommendations and strength standards';
COMMENT ON COLUMN user_profiles.age IS 'User age in years for recovery and progression adjustments';
COMMENT ON COLUMN user_profiles.weight IS 'Bodyweight in kilograms for relative strength calculations and Wilks score';
COMMENT ON COLUMN user_profiles.height IS 'Height in centimeters for BMI and body composition tracking';

-- Update experience_years to allow proper values (was hardcoded to 0)
COMMENT ON COLUMN user_profiles.experience_years IS 'Training experience in years - can be inferred from strength baseline or user-confirmed';
