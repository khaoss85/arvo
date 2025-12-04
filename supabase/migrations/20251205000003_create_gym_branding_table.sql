-- ============================================
-- Migration: Create gym_branding table
-- Purpose: White-label branding configuration for gyms
-- ============================================

-- 1. Create gym_branding table
CREATE TABLE IF NOT EXISTS public.gym_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL UNIQUE REFERENCES public.gyms(id) ON DELETE CASCADE,

  -- Visual Identity
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  splash_image_url TEXT,

  -- Colors (HSL format: "h s% l%" e.g., "221 83% 53%")
  primary_color TEXT DEFAULT '221 83% 53%',
  secondary_color TEXT DEFAULT '210 40% 96%',
  accent_color TEXT DEFAULT '142 76% 36%',
  background_color TEXT,
  text_color TEXT,

  -- Typography
  font_family TEXT,
  font_heading TEXT,

  -- Custom Texts (JSONB for i18n support: {"en": "...", "it": "..."})
  welcome_message JSONB DEFAULT '{"en": "Welcome!", "it": "Benvenuto!"}'::jsonb,
  tagline JSONB,
  footer_text JSONB,
  custom_texts JSONB DEFAULT '{}'::jsonb,

  -- PWA / App Settings
  app_name TEXT,
  short_name TEXT,

  -- Feature Toggles
  show_arvo_branding BOOLEAN DEFAULT true,
  custom_domain TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add comments
COMMENT ON TABLE public.gym_branding IS 'White-label branding configuration for gyms';
COMMENT ON COLUMN public.gym_branding.primary_color IS 'HSL color values in format "h s% l%" (e.g., "221 83% 53%")';
COMMENT ON COLUMN public.gym_branding.welcome_message IS 'Localized welcome message: {"en": "...", "it": "..."}';
COMMENT ON COLUMN public.gym_branding.custom_texts IS 'Additional localized text overrides';
COMMENT ON COLUMN public.gym_branding.show_arvo_branding IS 'Whether to show "Powered by Arvo" badge';

-- 3. Create indexes
CREATE INDEX idx_gym_branding_gym ON public.gym_branding(gym_id);

-- 4. Enable RLS
ALTER TABLE public.gym_branding ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Gym owners can manage their gym branding
CREATE POLICY "gym_owner_manage_branding" ON public.gym_branding
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE id = gym_branding.gym_id
      AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE id = gym_branding.gym_id
      AND owner_id = (SELECT auth.uid())
    )
  );

-- Public can view branding (for registration/login pages)
CREATE POLICY "public_view_branding" ON public.gym_branding
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. Updated_at trigger
CREATE TRIGGER trigger_update_gym_branding_updated_at
  BEFORE UPDATE ON public.gym_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
