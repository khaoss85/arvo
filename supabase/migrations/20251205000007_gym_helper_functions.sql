-- ============================================
-- Migration: Gym helper functions
-- Purpose: Utility functions for gym operations
-- ============================================

-- 1. Generate unique gym invite code
CREATE OR REPLACE FUNCTION public.generate_gym_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character uppercase alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

    -- Check if code already exists in gyms
    SELECT EXISTS(
      SELECT 1 FROM public.gyms WHERE invite_code = code
    ) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_gym_invite_code IS 'Generates a unique 6-character invite code for a gym';

-- 2. Generate unique gym slug from name
CREATE OR REPLACE FUNCTION public.generate_gym_slug(gym_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Convert name to URL-friendly slug
  base_slug := lower(regexp_replace(gym_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 50);

  final_slug := base_slug;

  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.gyms WHERE slug = final_slug
    ) INTO slug_exists;

    EXIT WHEN NOT slug_exists;

    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_gym_slug IS 'Generates a unique URL-friendly slug from gym name';

-- 3. Get user's gym context (for branding)
CREATE OR REPLACE FUNCTION public.get_user_gym_context(p_user_id UUID)
RETURNS TABLE (
  gym_id UUID,
  gym_name TEXT,
  gym_slug TEXT,
  is_owner BOOLEAN,
  is_staff BOOLEAN,
  is_member BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Check if user is a gym owner
  SELECT
    g.id,
    g.name,
    g.slug,
    true AS is_owner,
    false AS is_staff,
    false AS is_member
  FROM public.gyms g
  WHERE g.owner_id = p_user_id
  AND g.subscription_status IN ('trial', 'active')

  UNION ALL

  -- Check if user is gym staff
  SELECT
    g.id,
    g.name,
    g.slug,
    false AS is_owner,
    true AS is_staff,
    false AS is_member
  FROM public.gym_staff gs
  JOIN public.gyms g ON g.id = gs.gym_id
  WHERE gs.user_id = p_user_id
  AND gs.status = 'active'
  AND g.subscription_status IN ('trial', 'active')

  UNION ALL

  -- Check if user is gym member
  SELECT
    g.id,
    g.name,
    g.slug,
    false AS is_owner,
    false AS is_staff,
    true AS is_member
  FROM public.gym_members gm
  JOIN public.gyms g ON g.id = gm.gym_id
  WHERE gm.user_id = p_user_id
  AND gm.status = 'active'
  AND g.subscription_status IN ('trial', 'active')

  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_gym_context IS 'Returns the gym context for a user (owner, staff, or member)';

-- 4. Check if gym has capacity for new staff
CREATE OR REPLACE FUNCTION public.gym_can_add_staff(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_staff_count INTEGER;
  max_staff INTEGER;
BEGIN
  SELECT g.max_staff INTO max_staff
  FROM public.gyms g
  WHERE g.id = p_gym_id;

  SELECT COUNT(*) INTO current_staff_count
  FROM public.gym_staff
  WHERE gym_id = p_gym_id
  AND status IN ('pending', 'active');

  RETURN current_staff_count < max_staff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.gym_can_add_staff IS 'Checks if gym has capacity for new staff members';

-- 5. Check if gym has capacity for new members
CREATE OR REPLACE FUNCTION public.gym_can_add_member(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_member_count INTEGER;
  max_members INTEGER;
BEGIN
  SELECT g.max_members INTO max_members
  FROM public.gyms g
  WHERE g.id = p_gym_id;

  SELECT COUNT(*) INTO current_member_count
  FROM public.gym_members
  WHERE gym_id = p_gym_id
  AND status IN ('pending', 'active');

  RETURN current_member_count < max_members;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.gym_can_add_member IS 'Checks if gym has capacity for new members';

-- 6. Create gym with branding (transaction helper)
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

  -- Update owner's user role to gym_owner
  UPDATE public.users
  SET role = 'gym_owner'
  WHERE id = p_owner_id;

  RETURN new_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_gym_with_branding IS 'Creates a new gym with default branding and updates owner role';

-- 7. Register member via gym invite code
CREATE OR REPLACE FUNCTION public.register_gym_member_by_code(
  p_user_id UUID,
  p_invite_code TEXT
)
RETURNS UUID AS $$
DECLARE
  v_gym_id UUID;
  v_membership_id UUID;
BEGIN
  -- Find gym by invite code
  SELECT id INTO v_gym_id
  FROM public.gyms
  WHERE invite_code = upper(p_invite_code)
  AND subscription_status IN ('trial', 'active');

  IF v_gym_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired gym invite code';
  END IF;

  -- Check capacity
  IF NOT public.gym_can_add_member(v_gym_id) THEN
    RAISE EXCEPTION 'Gym has reached maximum member capacity';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.gym_members
    WHERE gym_id = v_gym_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this gym';
  END IF;

  -- Create membership
  INSERT INTO public.gym_members (gym_id, user_id, registration_source, status)
  VALUES (v_gym_id, p_user_id, 'invite_code', 'active')
  RETURNING id INTO v_membership_id;

  -- Update user_profiles.gym_id
  UPDATE public.user_profiles
  SET gym_id = v_gym_id
  WHERE user_id = p_user_id;

  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.register_gym_member_by_code IS 'Registers a user as a gym member using an invite code';

-- 8. Register member via gym slug (URL)
CREATE OR REPLACE FUNCTION public.register_gym_member_by_slug(
  p_user_id UUID,
  p_slug TEXT
)
RETURNS UUID AS $$
DECLARE
  v_gym_id UUID;
  v_membership_id UUID;
BEGIN
  -- Find gym by slug
  SELECT id INTO v_gym_id
  FROM public.gyms
  WHERE slug = lower(p_slug)
  AND subscription_status IN ('trial', 'active');

  IF v_gym_id IS NULL THEN
    RAISE EXCEPTION 'Gym not found or not active';
  END IF;

  -- Check capacity
  IF NOT public.gym_can_add_member(v_gym_id) THEN
    RAISE EXCEPTION 'Gym has reached maximum member capacity';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.gym_members
    WHERE gym_id = v_gym_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this gym';
  END IF;

  -- Create membership
  INSERT INTO public.gym_members (gym_id, user_id, registration_source, status)
  VALUES (v_gym_id, p_user_id, 'slug_url', 'active')
  RETURNING id INTO v_membership_id;

  -- Update user_profiles.gym_id
  UPDATE public.user_profiles
  SET gym_id = v_gym_id
  WHERE user_id = p_user_id;

  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.register_gym_member_by_slug IS 'Registers a user as a gym member using gym slug from URL';

-- 9. Get gym branding by slug (for registration page)
CREATE OR REPLACE FUNCTION public.get_gym_branding_by_slug(p_slug TEXT)
RETURNS TABLE (
  gym_id UUID,
  gym_name TEXT,
  gym_description TEXT,
  logo_url TEXT,
  logo_dark_url TEXT,
  splash_image_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  font_family TEXT,
  welcome_message JSONB,
  tagline JSONB,
  app_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    gb.logo_url,
    gb.logo_dark_url,
    gb.splash_image_url,
    gb.primary_color,
    gb.secondary_color,
    gb.accent_color,
    gb.font_family,
    gb.welcome_message,
    gb.tagline,
    gb.app_name
  FROM public.gyms g
  LEFT JOIN public.gym_branding gb ON gb.gym_id = g.id
  WHERE g.slug = lower(p_slug)
  AND g.subscription_status IN ('trial', 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_gym_branding_by_slug IS 'Returns gym branding info for public registration page';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_gym_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_gym_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_gym_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gym_can_add_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gym_can_add_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_gym_with_branding(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_gym_member_by_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_gym_member_by_slug(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_gym_branding_by_slug(TEXT) TO anon, authenticated;
