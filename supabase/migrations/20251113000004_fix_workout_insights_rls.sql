-- Migration: Fix workout_insights RLS policies
-- Issue: INSERT policy was not active, causing "new row violates row-level security policy" error
-- This migration explicitly drops and recreates all policies to ensure they're active

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own insights" ON workout_insights;
DROP POLICY IF EXISTS "Users can create their own insights" ON workout_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON workout_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON workout_insights;

-- Ensure RLS is enabled on the table
ALTER TABLE workout_insights ENABLE ROW LEVEL SECURITY;

-- Recreate all policies with correct permissions

-- SELECT policy: Users can view their own insights
CREATE POLICY "Users can view their own insights"
  ON workout_insights FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy: Users can create their own insights
-- This is the critical policy that was missing/inactive
CREATE POLICY "Users can create their own insights"
  ON workout_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own insights
CREATE POLICY "Users can update their own insights"
  ON workout_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE policy: Users can delete their own insights
CREATE POLICY "Users can delete their own insights"
  ON workout_insights FOR DELETE
  USING (auth.uid() = user_id);
