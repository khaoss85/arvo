-- ============================================
-- Coach Split Plan Templates & Assignments
-- ============================================
-- Allows coaches to create reusable split plan templates
-- and assign complete programming to clients

-- 1. Split Plan Templates (reusable by coaches)
CREATE TABLE IF NOT EXISTS split_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  split_type TEXT NOT NULL CHECK (split_type IN ('push_pull_legs', 'upper_lower', 'full_body', 'custom', 'bro_split', 'weak_point_focus')),
  cycle_days INTEGER NOT NULL CHECK (cycle_days > 0 AND cycle_days <= 14),
  sessions JSONB NOT NULL, -- Array<SessionDefinition>
  frequency_map JSONB, -- Map of muscle group -> frequency per week
  volume_distribution JSONB, -- Map of muscle group -> total sets in cycle
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE split_plan_templates IS 'Reusable split plan templates created by coaches';
COMMENT ON COLUMN split_plan_templates.sessions IS 'Array of SessionDefinition: [{day, name, workoutType, variation, focus[], targetVolume{}, principles[]}]';
COMMENT ON COLUMN split_plan_templates.frequency_map IS 'Map of muscle group to training frequency per week: {"chest": 2, "back": 2, ...}';
COMMENT ON COLUMN split_plan_templates.volume_distribution IS 'Map of muscle group to total sets in cycle: {"chest": 12, "back": 14, ...}';

-- Indexes for split_plan_templates
CREATE INDEX idx_split_plan_templates_coach ON split_plan_templates(coach_id);
CREATE INDEX idx_split_plan_templates_split_type ON split_plan_templates(split_type);
CREATE INDEX idx_split_plan_templates_public ON split_plan_templates(is_public) WHERE is_public = true;

-- 2. Coach Split Plan Assignments (tracking)
CREATE TABLE IF NOT EXISTS coach_split_plan_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  split_plan_id UUID NOT NULL REFERENCES split_plans(id) ON DELETE CASCADE,
  template_id UUID REFERENCES split_plan_templates(id) ON DELETE SET NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('ai_generated', 'template', 'custom')),
  coach_notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE coach_split_plan_assignments IS 'Tracks coach-assigned split plans to clients';
COMMENT ON COLUMN coach_split_plan_assignments.split_plan_id IS 'The actual split_plan created for the client (copy of template or new)';
COMMENT ON COLUMN coach_split_plan_assignments.template_id IS 'Original template used (NULL if AI-generated or custom)';

-- Indexes for coach_split_plan_assignments
CREATE INDEX idx_coach_split_plan_assignments_coach ON coach_split_plan_assignments(coach_id);
CREATE INDEX idx_coach_split_plan_assignments_client ON coach_split_plan_assignments(client_id);
CREATE INDEX idx_coach_split_plan_assignments_split_plan ON coach_split_plan_assignments(split_plan_id);

-- Unique constraint: one active assignment per client (a client can only have one split plan from a coach at a time)
-- Note: We don't enforce this at DB level since the client might have multiple historical assignments

-- 3. RLS Policies for split_plan_templates

ALTER TABLE split_plan_templates ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own templates
CREATE POLICY "coach_manage_own_templates" ON split_plan_templates
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Public templates are viewable by all coaches
CREATE POLICY "coaches_view_public_templates" ON split_plan_templates
  FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('coach', 'admin')
    )
  );

-- 4. RLS Policies for coach_split_plan_assignments

ALTER TABLE coach_split_plan_assignments ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own assignments
CREATE POLICY "coach_manage_own_split_assignments" ON coach_split_plan_assignments
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Clients can view assignments made to them
CREATE POLICY "client_view_own_split_assignments" ON coach_split_plan_assignments
  FOR SELECT
  USING (client_id = auth.uid());

-- 5. Update trigger for updated_at on split_plan_templates
CREATE OR REPLACE FUNCTION update_split_plan_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_split_plan_template_updated_at
  BEFORE UPDATE ON split_plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_split_plan_template_updated_at();

-- 6. Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_split_plan_template_usage(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE split_plan_templates
  SET usage_count = usage_count + 1
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
