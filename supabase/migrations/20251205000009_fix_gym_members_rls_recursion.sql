-- ============================================
-- Migration: Fix infinite recursion in gym_members RLS policies
-- ============================================

-- 1. Create helper function to check if user is gym member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_gym_member(p_gym_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_members
    WHERE gym_id = p_gym_id
    AND user_id = p_user_id
    AND status = 'active'
  );
$$;

-- 2. Create helper function to check if staff can manage members (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_gym_staff_with_member_permission(p_gym_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_staff
    WHERE gym_id = p_gym_id
    AND user_id = p_user_id
    AND status = 'active'
    AND (permissions->>'can_manage_members')::boolean = true
  );
$$;

-- 3. Drop existing problematic policies
DROP POLICY IF EXISTS "gym_owner_manage_members" ON public.gym_members;
DROP POLICY IF EXISTS "gym_staff_manage_members" ON public.gym_members;
DROP POLICY IF EXISTS "gym_members_view_gym" ON public.gyms;

-- 4. Recreate gym_members policies using helper functions
CREATE POLICY "gym_owner_manage_members" ON public.gym_members
  FOR ALL
  USING (public.is_gym_owner(gym_id))
  WITH CHECK (public.is_gym_owner(gym_id));

CREATE POLICY "gym_staff_manage_members" ON public.gym_members
  FOR ALL
  USING (public.is_gym_staff_with_member_permission(gym_id))
  WITH CHECK (public.is_gym_staff_with_member_permission(gym_id));

-- 5. Recreate gyms policy for members using helper function
CREATE POLICY "gym_members_view_gym" ON public.gyms
  FOR SELECT
  USING (public.is_gym_member(id));

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_gym_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gym_staff_with_member_permission TO authenticated;
