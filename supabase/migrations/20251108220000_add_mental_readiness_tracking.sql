-- Migration: Add Mental Readiness Tracking
-- Description: Add mental/psychological state tracking at both set and workout level
-- Created: 2025-11-08

-- Add mental_readiness to sets_log (optional, set-level tracking)
ALTER TABLE public.sets_log
  ADD COLUMN mental_readiness integer CHECK (mental_readiness >= 1 AND mental_readiness <= 5);

COMMENT ON COLUMN public.sets_log.mental_readiness IS
  'Optional mental/psychological readiness rating for individual sets:
   1 😫 = Drained/Burnout - Struggling to focus, mentally exhausted
   2 😕 = Struggling - Mind elsewhere, lacking motivation
   3 😐 = Neutral - Going through the motions, ok but not great
   4 🙂 = Engaged - Present and focused, good headspace
   5 🔥 = Locked In - Flow state, completely dialed in';

-- Add mental_readiness_overall to workouts (required for completed workouts)
ALTER TABLE public.workouts
  ADD COLUMN mental_readiness_overall integer CHECK (mental_readiness_overall >= 1 AND mental_readiness_overall <= 5);

COMMENT ON COLUMN public.workouts.mental_readiness_overall IS
  'Overall mental/psychological state during the workout session (required when completing workout):
   1 😫 = Drained/Burnout - Struggled mentally throughout session
   2 😕 = Below Average - Lacked motivation, mind elsewhere
   3 😐 = Neutral - Average mental state, neither good nor bad
   4 🙂 = Engaged - Focused and present throughout
   5 🔥 = Locked In - Peak mental state, flow state achieved';

-- Create index for analytics queries on sets mental readiness
CREATE INDEX idx_sets_log_mental_readiness
  ON public.sets_log(mental_readiness)
  WHERE mental_readiness IS NOT NULL;

-- Create index for analytics queries on workout mental readiness
CREATE INDEX idx_workouts_mental_readiness
  ON public.workouts(mental_readiness_overall, completed_at)
  WHERE mental_readiness_overall IS NOT NULL AND completed = true;

-- Create composite index for mental readiness trend analysis by user
CREATE INDEX idx_workouts_user_mental_trends
  ON public.workouts(user_id, completed_at, mental_readiness_overall)
  WHERE completed = true AND mental_readiness_overall IS NOT NULL;
