-- =====================================================
-- Migration: Admin Users Support
-- Purpose: Add RPC and indexes for admin users view
-- Date: 2025-11-30
-- =====================================================

-- 1. RPC to access auth.users.last_sign_in_at (SECURITY DEFINER bypasses RLS on auth.users)
CREATE OR REPLACE FUNCTION public.get_users_auth_data(user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id as user_id, au.last_sign_in_at
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
$$;

-- Grant execute to authenticated users (admin check is done in application layer)
GRANT EXECUTE ON FUNCTION public.get_users_auth_data(uuid[]) TO authenticated;

-- 2. Performance indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_approach_id
  ON public.user_profiles (approach_id);

CREATE INDEX IF NOT EXISTS idx_users_created_at
  ON public.users (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workouts_user_status
  ON public.workouts (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id
  ON public.user_milestones (user_id);

-- 3. Comments
COMMENT ON FUNCTION public.get_users_auth_data IS 'Returns auth data (last_sign_in_at) for given user IDs. Admin use only.';
