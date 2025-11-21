-- Migration: Setup Auto-Cleanup Cron Job for Workout Generation Queue
-- Purpose: Automatically clean up stale/stuck generations to prevent indefinite blocks
-- Date: 2025-11-20
-- Related: Fixes issue where failed generations remain "in_progress" forever

-- Update cleanup function to be more aggressive with timeouts
CREATE OR REPLACE FUNCTION public.cleanup_old_generations()
RETURNS void AS $$
BEGIN
  -- Delete completed generations older than 7 days (audit trail)
  DELETE FROM public.workout_generation_queue
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '7 days';

  -- Delete failed generations older than 24 hours
  DELETE FROM public.workout_generation_queue
  WHERE status = 'failed'
    AND updated_at < NOW() - INTERVAL '24 hours';

  -- Delete stale in_progress generations older than 10 minutes
  -- (2x the Inngest timeout of 5 minutes - if it's still in_progress after 10min, it's stuck)
  DELETE FROM public.workout_generation_queue
  WHERE status = 'in_progress'
    AND (started_at < NOW() - INTERVAL '10 minutes' OR started_at IS NULL);

  -- Delete stale pending generations older than 5 minutes
  -- (pending should start immediately, if not started after 5min it's abandoned)
  DELETE FROM public.workout_generation_queue
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '5 minutes';

  -- Log cleanup activity for monitoring
  RAISE NOTICE 'Cleaned up stale workout generation queue entries at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run every 15 minutes using pg_cron
-- This ensures stuck generations are cleaned up automatically
SELECT cron.schedule(
  'workout-generation-cleanup',  -- Job name
  '*/15 * * * *',                -- Every 15 minutes
  $$SELECT cleanup_old_generations()$$
);

-- Comment for documentation
COMMENT ON FUNCTION public.cleanup_old_generations() IS
  'Automatically cleans up old/stale workout generation queue entries. ' ||
  'Runs every 15 minutes via pg_cron. ' ||
  'Removes: completed (>7d), failed (>24h), in_progress (>10min), pending (>5min)';
