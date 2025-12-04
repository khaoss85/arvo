-- ============================================
-- Migration: Alter existing tables for gym support
-- Purpose: Add gym_id to user_profiles and coach_profiles
-- ============================================

-- 1. Add gym_id to user_profiles (denormalized for quick access)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.user_profiles.gym_id IS
'Associated gym (if user is a gym member). Denormalized for quick access.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_gym ON public.user_profiles(gym_id);

-- 2. Add gym_id to coach_profiles (links coach to gym as staff)
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.coach_profiles.gym_id IS
'Gym this coach works for (if any). When set, coach inherits gym branding.';

CREATE INDEX IF NOT EXISTS idx_coach_profiles_gym ON public.coach_profiles(gym_id);

-- 3. Update user_profiles RLS to allow gym staff to view members' profiles
CREATE POLICY "gym_staff_view_member_profiles" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.gym_staff gs
      JOIN public.gym_members gm ON gm.gym_id = gs.gym_id
      WHERE gs.user_id = (SELECT auth.uid())
      AND gs.status = 'active'
      AND gm.user_id = user_profiles.user_id
      AND gm.status = 'active'
    )
  );

-- 4. Gym owners can view their members' profiles
CREATE POLICY "gym_owner_view_member_profiles" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.gyms g
      JOIN public.gym_members gm ON gm.gym_id = g.id
      WHERE g.owner_id = (SELECT auth.uid())
      AND gm.user_id = user_profiles.user_id
      AND gm.status = 'active'
    )
  );
