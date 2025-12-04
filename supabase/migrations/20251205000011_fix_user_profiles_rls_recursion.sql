-- ============================================
-- Migration: Fix infinite recursion in user_profiles RLS policies
-- ============================================

-- 1. Create helper function to check if user is member of any gym owned by a specific owner
CREATE OR REPLACE FUNCTION public.is_member_of_owned_gym(p_member_user_id UUID, p_owner_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gyms g
    JOIN public.gym_members gm ON gm.gym_id = g.id
    WHERE g.owner_id = p_owner_user_id
    AND gm.user_id = p_member_user_id
    AND gm.status = 'active'
  );
$$;

-- 2. Create helper function to check if user is member of gym where staff works
CREATE OR REPLACE FUNCTION public.is_member_of_staff_gym(p_member_user_id UUID, p_staff_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gym_staff gs
    JOIN public.gym_members gm ON gm.gym_id = gs.gym_id
    WHERE gs.user_id = p_staff_user_id
    AND gs.status = 'active'
    AND gm.user_id = p_member_user_id
    AND gm.status = 'active'
  );
$$;

-- 3. Drop existing problematic policies
DROP POLICY IF EXISTS "gym_owner_view_member_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "gym_staff_view_member_profiles" ON public.user_profiles;

-- 4. Recreate policies using helper functions
CREATE POLICY "gym_owner_view_member_profiles" ON public.user_profiles
  FOR SELECT
  USING (public.is_member_of_owned_gym(user_id));

CREATE POLICY "gym_staff_view_member_profiles" ON public.user_profiles
  FOR SELECT
  USING (public.is_member_of_staff_gym(user_id));

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_member_of_owned_gym TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_staff_gym TO authenticated;
