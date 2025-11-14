-- Fix RLS policies for workout_generation_metrics to allow users to track their own metrics
-- This is needed because GenerationMetricsService.startGeneration() is called with user credentials

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Service role can manage workout generation metrics" ON workout_generation_metrics;
DROP POLICY IF EXISTS "Users can read own workout generation metrics" ON workout_generation_metrics;

-- Allow users to insert their own metrics
CREATE POLICY "Users can insert own workout generation metrics"
ON workout_generation_metrics
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own metrics
CREATE POLICY "Users can read own workout generation metrics"
ON workout_generation_metrics
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Allow users to update their own metrics (needed for completeGeneration)
CREATE POLICY "Users can update own workout generation metrics"
ON workout_generation_metrics
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Keep service role access for admin operations
CREATE POLICY "Service role can manage all workout generation metrics"
ON workout_generation_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
