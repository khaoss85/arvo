-- Add injuries_notes column to user_profiles table
-- This field stores user-reported injuries, limitations, and pain points
-- for personalized exercise selection during onboarding

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS injuries_notes TEXT;

COMMENT ON COLUMN user_profiles.injuries_notes IS 'Free text field for user-reported injuries, limitations, and pain points. Used for personalized exercise selection and workout adaptation.';
