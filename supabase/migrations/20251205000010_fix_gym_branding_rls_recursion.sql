-- ============================================
-- Migration: Fix potential recursion in gym_branding RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "gym_members_view_branding" ON public.gym_branding;
DROP POLICY IF EXISTS "gym_owner_manage_branding" ON public.gym_branding;
DROP POLICY IF EXISTS "gym_staff_view_branding" ON public.gym_branding;

-- Recreate using helper functions
CREATE POLICY "gym_owner_manage_branding" ON public.gym_branding
  FOR ALL
  USING (public.is_gym_owner(gym_id))
  WITH CHECK (public.is_gym_owner(gym_id));

CREATE POLICY "gym_staff_view_branding" ON public.gym_branding
  FOR SELECT
  USING (public.is_gym_staff(gym_id));

CREATE POLICY "gym_members_view_branding" ON public.gym_branding
  FOR SELECT
  USING (public.is_gym_member(gym_id));
