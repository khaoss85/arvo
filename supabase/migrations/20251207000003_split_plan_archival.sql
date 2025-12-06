-- Coach Overlay: Add archival and source tracking to split_plans
-- This enables preserving client's original split when coach assigns a new one,
-- and allows restoration when client disconnects from coach.

-- Add columns for archival tracking
ALTER TABLE split_plans
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS archived_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'self';

-- Add comments for documentation
COMMENT ON COLUMN split_plans.archived_at IS 'Timestamp when this split plan was archived (null = active or just inactive)';
COMMENT ON COLUMN split_plans.archived_reason IS 'Reason for archival: coach_replaced (coach assigned new split), user_changed (user changed split)';
COMMENT ON COLUMN split_plans.source IS 'Who created this split plan: self (user-generated or AI) or coach (assigned by coach)';

-- Create index for efficient querying of archived splits by user
CREATE INDEX IF NOT EXISTS idx_split_plans_archived_lookup
ON split_plans(user_id, archived_reason, archived_at DESC)
WHERE archived_reason IS NOT NULL;
