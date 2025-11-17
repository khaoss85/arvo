-- Migration: Add change_split_type to split modifications
-- Created: 2025-11-17
-- Description: Adds 'change_split_type' as a valid modification type for split_modifications table

-- Drop the existing constraint
ALTER TABLE split_modifications
  DROP CONSTRAINT IF EXISTS valid_modification_type;

-- Add the updated constraint with change_split_type included
ALTER TABLE split_modifications
  ADD CONSTRAINT valid_modification_type CHECK (
    modification_type IN ('swap_days', 'toggle_muscle', 'change_variation', 'change_split_type')
  );

-- Update the comment to reflect the new modification type
COMMENT ON COLUMN split_modifications.modification_type IS 'Type of modification: swap_days (swap two cycle days), toggle_muscle (add/remove muscle from session), change_variation (A <-> B), change_split_type (change the split type entirely)';
