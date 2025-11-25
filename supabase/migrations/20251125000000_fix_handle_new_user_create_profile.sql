-- Fix handle_new_user trigger to also create user_profiles record
-- This ensures that when a user signs up, they have both:
-- 1. A record in public.users (existing behavior)
-- 2. A record in public.user_profiles with minimal defaults (new behavior)
--
-- The onboarding flow uses upsert with onConflict: 'user_id', so it will
-- update the existing record with full profile data when user completes onboarding.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create users record (existing behavior)
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  -- Create user_profiles record with minimal defaults (new behavior)
  -- This ensures the user can login without errors before completing onboarding
  INSERT INTO public.user_profiles (user_id, gender)
  VALUES (new.id, 'other')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on_auth_user_created already exists and calls this function,
-- so we only need to update the function definition.
