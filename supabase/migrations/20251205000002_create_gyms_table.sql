-- ============================================
-- Migration: Create gyms table
-- Purpose: Core gym/organization entity for white-labeling
-- ============================================

-- 1. Create gyms table
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Registration
  invite_code TEXT NOT NULL UNIQUE,

  -- Subscription & Limits
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic'
    CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  max_staff INTEGER DEFAULT 5,
  max_members INTEGER DEFAULT 100,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),

  -- Contact Info
  email TEXT,
  phone TEXT,
  website TEXT,
  address JSONB,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add comments
COMMENT ON TABLE public.gyms IS 'Gym/organization entities for white-label branding';
COMMENT ON COLUMN public.gyms.slug IS 'URL-friendly identifier used in /join/gym/{slug}';
COMMENT ON COLUMN public.gyms.invite_code IS '6-character unique code for quick registration';
COMMENT ON COLUMN public.gyms.settings IS 'Additional gym-specific settings as JSON';
COMMENT ON COLUMN public.gyms.address IS 'Address JSON: {street, city, state, country, postal_code}';

-- 3. Create indexes
CREATE INDEX idx_gyms_owner ON public.gyms(owner_id);
CREATE INDEX idx_gyms_slug ON public.gyms(slug);
CREATE INDEX idx_gyms_invite_code ON public.gyms(invite_code);
CREATE INDEX idx_gyms_subscription_status ON public.gyms(subscription_status);

-- 4. Enable RLS
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Gym owners can manage their own gyms
CREATE POLICY "gym_owner_manage_own_gym" ON public.gyms
  FOR ALL
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Gym staff can view their gym (policy depends on gym_staff table, created later)
-- We'll add this policy in the gym_staff migration

-- Public can view gym by slug (for registration page) - limited fields exposed at app level
CREATE POLICY "public_view_gym_for_registration" ON public.gyms
  FOR SELECT
  TO anon, authenticated
  USING (subscription_status IN ('trial', 'active'));

-- Admins can view all gyms
CREATE POLICY "admin_view_all_gyms" ON public.gyms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- 6. Updated_at trigger
CREATE TRIGGER trigger_update_gyms_updated_at
  BEFORE UPDATE ON public.gyms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
