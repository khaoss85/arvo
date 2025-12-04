-- ============================================
-- Migration: Fix infinite recursion in gym_staff RLS policies
-- Problem: gym_staff policy queries gyms, gyms policy queries gym_staff
-- Solution: Use SECURITY DEFINER functions to bypass RLS for ownership checks
-- ============================================

-- 1. Create helper function to check if user is gym owner (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_gym_owner(p_gym_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gyms
    WHERE id = p_gym_id
    AND owner_id = p_user_id
  );
$$;

-- 2. Create helper function to check if user is gym staff (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_gym_staff(p_gym_id UUID, p_user_id UUID DEFAULT auth.uid())
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
  );
$$;

-- 3. Drop existing problematic policies
DROP POLICY IF EXISTS "gym_owner_manage_staff" ON public.gym_staff;
DROP POLICY IF EXISTS "gym_staff_view_gym" ON public.gyms;

-- 4. Recreate gym_staff policy using helper function
CREATE POLICY "gym_owner_manage_staff" ON public.gym_staff
  FOR ALL
  USING (public.is_gym_owner(gym_id))
  WITH CHECK (public.is_gym_owner(gym_id));

-- 5. Recreate gyms policy using helper function
CREATE POLICY "gym_staff_view_gym" ON public.gyms
  FOR SELECT
  USING (public.is_gym_staff(id));

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_gym_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gym_staff TO authenticated;
