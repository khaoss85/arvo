-- Add email notification preferences to user_profiles

-- Create enum for email frequency if not exists
DO $$ BEGIN
  CREATE TYPE email_frequency AS ENUM ('immediate', 'daily_digest', 'weekly_digest', 'none');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add email preference columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_frequency email_frequency DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS last_email_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS email_unsubscribed_at timestamptz;

-- Add index for email notification queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_enabled
  ON user_profiles(email_notifications_enabled)
  WHERE email_notifications_enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.email_notifications_enabled IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN user_profiles.email_frequency IS 'How often user wants to receive emails: immediate, daily_digest, weekly_digest, or none';
COMMENT ON COLUMN user_profiles.last_email_sent_at IS 'Timestamp of last email sent to user';
COMMENT ON COLUMN user_profiles.email_unsubscribed_at IS 'Timestamp when user unsubscribed from emails';
