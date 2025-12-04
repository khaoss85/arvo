-- ============================================
-- Migration: Add gym_owner role
-- Purpose: Extend user roles to include gym owners
-- ============================================

-- 1. Update the role constraint to include 'coach' and 'gym_owner'
-- This is idempotent - will work whether 'coach' was already added or not
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'coach', 'gym_owner'));

COMMENT ON COLUMN public.users.role IS
'User role: user (default), coach (can manage clients), gym_owner (owns a gym with white-label branding), admin (system administrator)';
