-- Add custom_equipment column to user_profiles table
-- This allows users to add their own equipment that isn't in the predefined taxonomy

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS custom_equipment jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_profiles.custom_equipment IS 'Array of custom equipment added by user. Structure: [{ id, name, category, validated, addedAt, exampleExercises }]';

-- Create index for JSONB queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_user_profiles_custom_equipment
ON public.user_profiles USING GIN (custom_equipment);
