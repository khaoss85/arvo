-- Add RLS policies to allow public access to workouts and progress_checks via share links
-- This fixes 404 errors when accessing shared workout and progress check links

-- Policy for workouts table
-- Allows anyone (anonymous or authenticated) to view a workout if:
-- 1. A valid share link exists for this workout, OR
-- 2. The user is the owner of the workout
CREATE POLICY "Anyone can view shared workouts"
  ON public.workouts
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.share_links
      WHERE share_links.entity_id = workouts.id
        AND share_links.share_type = 'workout'
        AND (share_links.expires_at IS NULL OR share_links.expires_at > now())
    )
    OR auth.uid() = user_id
  );

-- Policy for progress_checks table
-- Allows anyone (anonymous or authenticated) to view a progress check if:
-- 1. A valid share link exists for this progress check, OR
-- 2. The user is the owner of the progress check
CREATE POLICY "Anyone can view shared progress checks"
  ON public.progress_checks
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.share_links
      WHERE share_links.entity_id = progress_checks.id
        AND share_links.share_type = 'progress'
        AND (share_links.expires_at IS NULL OR share_links.expires_at > now())
    )
    OR auth.uid() = user_id
  );
