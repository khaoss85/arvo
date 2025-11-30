-- =====================================================
-- Migration: Create Credit/Token Tracking System
-- Purpose: Track AI resource consumption per user
-- Date: 2025-11-30
-- =====================================================

-- 1. Create operation_type enum for type safety
CREATE TYPE credit_operation_type AS ENUM (
  'workout_generation',
  'split_generation',
  'audio_script_generation',
  'tts_synthesis',
  'embedding_generation',
  'exercise_substitution',
  'approach_recommendation',
  'insight_generation',
  'memory_consolidation',
  'technique_recommendation',
  'weight_estimation',
  'modification_validation',
  'other'
);

-- 2. Create credit_usage table
CREATE TABLE IF NOT EXISTS public.credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  operation_type credit_operation_type NOT NULL,
  credits_used NUMERIC(10, 4) NOT NULL DEFAULT 0,

  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_reasoning INTEGER,
  characters_processed INTEGER,

  estimated_cost_usd NUMERIC(10, 6),

  model_used TEXT,
  agent_name TEXT,
  reasoning_effort TEXT CHECK (reasoning_effort IN ('none', 'minimal', 'low', 'medium', 'high')),

  request_id UUID,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT credit_usage_credits_positive CHECK (credits_used >= 0)
);

-- 3. Create indexes for credit_usage
CREATE INDEX idx_credit_usage_user_id ON public.credit_usage(user_id);
CREATE INDEX idx_credit_usage_operation_type ON public.credit_usage(operation_type);
CREATE INDEX idx_credit_usage_created_at ON public.credit_usage(created_at DESC);
CREATE INDEX idx_credit_usage_user_date ON public.credit_usage(user_id, created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for credit_usage
CREATE POLICY "Users can read own credit usage"
  ON public.credit_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert credit usage"
  ON public.credit_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read all credit usage"
  ON public.credit_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Comments
COMMENT ON TABLE public.credit_usage IS 'Tracks credit/token consumption per user for AI operations';
COMMENT ON COLUMN public.credit_usage.credits_used IS 'Abstract credit units consumed (for display/billing)';
COMMENT ON COLUMN public.credit_usage.estimated_cost_usd IS 'Estimated actual cost in USD based on API pricing';
