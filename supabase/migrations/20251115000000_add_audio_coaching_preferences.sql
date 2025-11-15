-- Add audio coaching preferences to user_profiles
ALTER TABLE user_profiles
ADD COLUMN audio_coaching_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN audio_coaching_autoplay BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN audio_coaching_speed NUMERIC(3,2) DEFAULT 0.9 NOT NULL CHECK (audio_coaching_speed >= 0.5 AND audio_coaching_speed <= 2.0);

-- Add audio_scripts field to workouts table for caching generated scripts
ALTER TABLE workouts
ADD COLUMN audio_scripts JSONB DEFAULT NULL;

-- Create index for faster audio scripts retrieval
CREATE INDEX IF NOT EXISTS idx_workouts_audio_scripts ON workouts USING GIN (audio_scripts);

-- Comment the columns
COMMENT ON COLUMN user_profiles.audio_coaching_enabled IS 'Whether audio coaching feature is enabled for this user';
COMMENT ON COLUMN user_profiles.audio_coaching_autoplay IS 'Whether audio coaching should play automatically during workouts';
COMMENT ON COLUMN user_profiles.audio_coaching_speed IS 'Playback speed for audio coaching (0.5 to 2.0, default 0.9)';
COMMENT ON COLUMN workouts.audio_scripts IS 'Cached AI-generated audio scripts for workout coaching (JSON structure with workout_intro, exercises, rest_countdowns)';
