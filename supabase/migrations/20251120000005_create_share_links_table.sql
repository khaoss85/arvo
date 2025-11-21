-- Create share_links table for Strava-style public sharing
CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type text NOT NULL CHECK (share_type IN ('cycle', 'progress', 'workout')),
  entity_id uuid NOT NULL,
  privacy_settings jsonb DEFAULT '{
    "showName": false,
    "showPhoto": false,
    "showStats": true,
    "showCharts": true,
    "showExercises": true,
    "showNotes": false
  }'::jsonb,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_share_links_token ON public.share_links(share_token);
CREATE INDEX idx_share_links_user_id ON public.share_links(user_id);
CREATE INDEX idx_share_links_type_entity ON public.share_links(share_type, entity_id);
CREATE INDEX idx_share_links_created_at ON public.share_links(created_at DESC);

-- Enable RLS
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own share links
CREATE POLICY "Users can view own share links"
  ON public.share_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own share links
CREATE POLICY "Users can create own share links"
  ON public.share_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own share links
CREATE POLICY "Users can update own share links"
  ON public.share_links
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own share links
CREATE POLICY "Users can delete own share links"
  ON public.share_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view share links (for public landing pages)
-- IMPORTANT: This allows anonymous users to access share links via token
CREATE POLICY "Anyone can view share links"
  ON public.share_links
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Anyone can view non-expired shares
    expires_at IS NULL OR expires_at > now()
  );

-- Allow anonymous users to view shared cycle completions
-- This policy checks if a valid, non-expired share link exists
CREATE POLICY "Anyone can view shared cycle completions"
  ON public.cycle_completions
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.share_links
      WHERE share_links.entity_id = cycle_completions.id
        AND share_links.share_type = 'cycle'
        AND (share_links.expires_at IS NULL OR share_links.expires_at > now())
    )
    OR auth.uid() = user_id  -- Users can still see their own
  );

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_share_view_count(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.share_links
  SET view_count = view_count + 1
  WHERE share_token = token;
END;
$$;

-- Function to clean up expired share links (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_share_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.share_links
  WHERE expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_share_view_count(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_share_links() TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.share_links IS 'Stores shareable public links for fitness results (Strava-style)';
COMMENT ON COLUMN public.share_links.share_token IS 'Unique short token used in public URL (e.g., abc123xyz)';
COMMENT ON COLUMN public.share_links.share_type IS 'Type of content being shared: cycle, progress, or workout';
COMMENT ON COLUMN public.share_links.entity_id IS 'ID of the cycle_completions, progress_checks, or workouts record';
COMMENT ON COLUMN public.share_links.privacy_settings IS 'JSON object controlling what information is publicly visible';
COMMENT ON COLUMN public.share_links.view_count IS 'Number of times this share link has been viewed';
COMMENT ON COLUMN public.share_links.expires_at IS 'Optional expiration date for temporary shares';
