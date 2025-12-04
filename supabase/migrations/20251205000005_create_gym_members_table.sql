-- ============================================
-- Migration: Create gym_members table
-- Purpose: Members registered to a gym via white-label registration
-- ============================================

-- 1. Create gym_members table
CREATE TABLE IF NOT EXISTS public.gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Registration source
  registration_source TEXT NOT NULL DEFAULT 'invite_code'
    CHECK (registration_source IN ('invite_code', 'slug_url', 'staff_invite', 'import')),

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'suspended', 'churned')),

  -- Membership details
  membership_type TEXT DEFAULT 'standard'
    CHECK (membership_type IN ('trial', 'standard', 'premium', 'vip')),
  membership_expires_at TIMESTAMPTZ,

  -- Assigned coach (optional)
  assigned_coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tracking
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,

  -- Notes
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(gym_id, user_id)
);

-- 2. Add comments
COMMENT ON TABLE public.gym_members IS 'Members registered to a gym via white-label registration';
COMMENT ON COLUMN public.gym_members.registration_source IS 'How the member joined: invite_code, slug_url, staff_invite, import';
COMMENT ON COLUMN public.gym_members.assigned_coach_id IS 'Optional coach assignment within the gym';

-- 3. Create indexes
CREATE INDEX idx_gym_members_gym ON public.gym_members(gym_id);
CREATE INDEX idx_gym_members_user ON public.gym_members(user_id);
CREATE INDEX idx_gym_members_status ON public.gym_members(status);
CREATE INDEX idx_gym_members_coach ON public.gym_members(assigned_coach_id);

-- 4. Enable RLS
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Gym owners can manage all members
CREATE POLICY "gym_owner_manage_members" ON public.gym_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE id = gym_members.gym_id
      AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE id = gym_members.gym_id
      AND owner_id = (SELECT auth.uid())
    )
  );

-- Gym staff with permission can view/manage members
CREATE POLICY "gym_staff_manage_members" ON public.gym_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_staff gs
      WHERE gs.gym_id = gym_members.gym_id
      AND gs.user_id = (SELECT auth.uid())
      AND gs.status = 'active'
      AND (gs.permissions->>'can_manage_members')::boolean = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_staff gs
      WHERE gs.gym_id = gym_members.gym_id
      AND gs.user_id = (SELECT auth.uid())
      AND gs.status = 'active'
      AND (gs.permissions->>'can_manage_members')::boolean = true
    )
  );

-- Members can view their own record
CREATE POLICY "member_view_own_record" ON public.gym_members
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Members can insert their own record (self-registration)
CREATE POLICY "member_self_register" ON public.gym_members
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 6. Add policy to gyms table for members viewing
CREATE POLICY "gym_members_view_gym" ON public.gyms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_members
      WHERE gym_id = gyms.id
      AND user_id = (SELECT auth.uid())
      AND status = 'active'
    )
  );

-- 7. Add policy to gym_branding for members viewing
CREATE POLICY "gym_members_view_branding" ON public.gym_branding
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_members
      WHERE gym_id = gym_branding.gym_id
      AND user_id = (SELECT auth.uid())
      AND status = 'active'
    )
  );

-- 8. Updated_at trigger
CREATE TRIGGER trigger_update_gym_members_updated_at
  BEFORE UPDATE ON public.gym_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
