-- Migration: Create workout_generation_queue table
-- Purpose: Persist workout generation state to survive mobile standby and server restarts
-- Date: 2025-11-16

-- Create generation status enum
CREATE TYPE generation_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed'
);

-- Create workout generation queue table
CREATE TABLE IF NOT EXISTS public.workout_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID UNIQUE NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  target_cycle_day INTEGER,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  current_phase TEXT,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  error_message TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_generation_queue_user_id ON public.workout_generation_queue(user_id);
CREATE INDEX idx_generation_queue_request_id ON public.workout_generation_queue(request_id);
CREATE INDEX idx_generation_queue_status ON public.workout_generation_queue(status);
CREATE INDEX idx_generation_queue_created_at ON public.workout_generation_queue(created_at);

-- Create composite index for common queries
CREATE INDEX idx_generation_queue_user_status ON public.workout_generation_queue(user_id, status)
  WHERE status IN ('pending', 'in_progress');

-- Enable Row Level Security
ALTER TABLE public.workout_generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own generation queue entries
CREATE POLICY "Users can view their own generation queue entries"
  ON public.workout_generation_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own generation queue entries
CREATE POLICY "Users can insert their own generation queue entries"
  ON public.workout_generation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own generation queue entries
CREATE POLICY "Users can update their own generation queue entries"
  ON public.workout_generation_queue
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can do everything (for server-side operations)
CREATE POLICY "Service role has full access to generation queue"
  ON public.workout_generation_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_generation_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
CREATE TRIGGER set_generation_queue_updated_at
  BEFORE UPDATE ON public.workout_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_generation_queue_updated_at();

-- Function to clean up old completed/failed generations (run daily)
CREATE OR REPLACE FUNCTION public.cleanup_old_generations()
RETURNS void AS $$
BEGIN
  -- Delete completed generations older than 24 hours
  DELETE FROM public.workout_generation_queue
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '24 hours';

  -- Delete failed generations older than 1 hour
  DELETE FROM public.workout_generation_queue
  WHERE status = 'failed'
    AND updated_at < NOW() - INTERVAL '1 hour';

  -- Delete stale pending/in_progress generations (likely abandoned)
  DELETE FROM public.workout_generation_queue
  WHERE status IN ('pending', 'in_progress')
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_old_generations() TO service_role;

-- Comment on table and columns
COMMENT ON TABLE public.workout_generation_queue IS 'Tracks workout generation requests to survive mobile standby and server restarts';
COMMENT ON COLUMN public.workout_generation_queue.request_id IS 'Client-generated UUID for idempotency';
COMMENT ON COLUMN public.workout_generation_queue.progress_percent IS 'Current generation progress (0-100)';
COMMENT ON COLUMN public.workout_generation_queue.current_phase IS 'Human-readable current phase (e.g., "Selecting exercises")';
COMMENT ON COLUMN public.workout_generation_queue.context IS 'Additional generation context (workout type, options, etc.)';
