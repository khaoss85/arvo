-- ============================================
-- Migration: Fix gym creation to preserve admin role
-- Purpose: Modify create_gym_with_branding to only upgrade
--          regular 'user' role to 'gym_owner', preserving
--          admin and coach roles
-- ============================================

-- 1. Fix the create_gym_with_branding function
CREATE OR REPLACE FUNCTION public.create_gym_with_branding(
  p_owner_id UUID,
  p_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_primary_color TEXT DEFAULT '221 83% 53%'
)
RETURNS UUID AS $$
DECLARE
  new_gym_id UUID;
  new_slug TEXT;
  new_invite_code TEXT;
BEGIN
  -- Generate slug and invite code
  new_slug := public.generate_gym_slug(p_name);
  new_invite_code := public.generate_gym_invite_code();

  -- Create gym
  INSERT INTO public.gyms (owner_id, name, slug, invite_code, email)
  VALUES (p_owner_id, p_name, new_slug, new_invite_code, p_email)
  RETURNING id INTO new_gym_id;

  -- Create default branding
  INSERT INTO public.gym_branding (gym_id, logo_url, primary_color)
  VALUES (new_gym_id, p_logo_url, p_primary_color);

  -- Update owner's user role to gym_owner ONLY if they are a regular user
  -- This preserves admin and coach roles (which have higher privileges)
  UPDATE public.users
  SET role = 'gym_owner'
  WHERE id = p_owner_id
  AND role = 'user';

  RETURN new_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_gym_with_branding IS 'Creates a new gym with default branding. Only upgrades regular users to gym_owner role, preserving admin/coach roles.';

-- 2. Reset any admin users who were incorrectly downgraded to gym_owner
-- Find users who own gyms but should remain admins based on ADMIN_EMAIL
-- Note: This is a one-time fix. For the specific user, we'll run a separate query.
