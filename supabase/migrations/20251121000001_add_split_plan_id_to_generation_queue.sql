-- Migration: Add split_plan_id to workout_generation_queue
-- Purpose: Track which split plan was created during onboarding generation
-- Date: 2025-11-21
-- Related to: Fix race condition where dashboard loads before split is visible

-- Add split_plan_id column to track generated split plans
ALTER TABLE public.workout_generation_queue
ADD COLUMN split_plan_id UUID REFERENCES public.split_plans(id) ON DELETE SET NULL;

-- Create index for performance (queries by split_plan_id)
CREATE INDEX idx_generation_queue_split_plan_id
ON public.workout_generation_queue(split_plan_id);

-- Add comment for documentation
COMMENT ON COLUMN public.workout_generation_queue.split_plan_id IS 'Reference to the split plan created during onboarding generation (if applicable)';
