-- Add preferred_language column to user_profiles table
-- This enables users to choose their preferred interface language (English or Italian)

ALTER TABLE public.user_profiles
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'en' NOT NULL;

-- Add check constraint to ensure only valid language codes
ALTER TABLE public.user_profiles
ADD CONSTRAINT valid_language_code CHECK (preferred_language IN ('en', 'it'));

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.preferred_language IS 'User preferred language for UI and AI-generated content. Valid values: en (English), it (Italian)';

-- Create index for potential future queries filtering by language
CREATE INDEX idx_user_profiles_preferred_language ON public.user_profiles(preferred_language);
