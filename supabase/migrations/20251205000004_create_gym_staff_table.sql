-- ============================================
-- Migration: Create gym_staff table
-- Purpose: Staff members (coaches/managers) working for a gym
-- ============================================

-- 1. Create gym_staff table
CREATE TABLE IF NOT EXISTS public.gym_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role within the gym
  staff_role TEXT NOT NULL DEFAULT 'coach'
    CHECK (staff_role IN ('coach', 'manager', 'admin')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),

  -- Permissions (customizable per staff member)
  permissions JSONB DEFAULT '{
    "can_manage_members": true,
    "can_create_templates": true,
    "can_view_analytics": true,
    "can_invite_staff": false,
    "can_edit_branding": false
  }'::jsonb,

  -- Invitation tracking
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(gym_id, user_id)
);

-- 2. Add comments
COMMENT ON TABLE public.gym_staff IS 'Staff members (coaches/managers) working for a gym';
COMMENT ON COLUMN public.gym_staff.staff_role IS 'Role: coach (trains clients), manager (manages gym ops), admin (full access)';
COMMENT ON COLUMN public.gym_staff.permissions IS 'Custom permissions for this staff member';

-- 3. Create indexes
CREATE INDEX idx_gym_staff_gym ON public.gym_staff(gym_id);
CREATE INDEX idx_gym_staff_user ON public.gym_staff(user_id);
CREATE INDEX idx_gym_staff_status ON public.gym_staff(status);
CREATE INDEX idx_gym_staff_role ON public.gym_staff(staff_role);

-- 4. Enable RLS
ALTER TABLE public.gym_staff ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Gym owners can manage all staff
CREATE POLICY "gym_owner_manage_staff" ON public.gym_staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE id = gym_staff.gym_id
      AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE id = gym_staff.gym_id
      AND owner_id = (SELECT auth.uid())
    )
  );

-- Staff can view their own record
CREATE POLICY "staff_view_own_record" ON public.gym_staff
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Staff can view colleagues in same gym
CREATE POLICY "staff_view_colleagues" ON public.gym_staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_staff gs
      WHERE gs.gym_id = gym_staff.gym_id
      AND gs.user_id = (SELECT auth.uid())
      AND gs.status = 'active'
    )
  );

-- 6. Add policy to gyms table for staff viewing
CREATE POLICY "gym_staff_view_gym" ON public.gyms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_staff
      WHERE gym_id = gyms.id
      AND user_id = (SELECT auth.uid())
      AND status = 'active'
    )
  );

-- 7. Add policy to gym_branding for staff viewing
CREATE POLICY "gym_staff_view_branding" ON public.gym_branding
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_staff
      WHERE gym_id = gym_branding.gym_id
      AND user_id = (SELECT auth.uid())
      AND status = 'active'
    )
  );

-- 8. Updated_at trigger
CREATE TRIGGER trigger_update_gym_staff_updated_at
  BEFORE UPDATE ON public.gym_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
