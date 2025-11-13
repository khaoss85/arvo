-- Migration: Add short_philosophy field to training_approaches
-- This enables mobile-friendly short descriptions while preserving full details
-- short_philosophy: 40-50 word summary for cards/mobile views
-- philosophy: Full detailed description for "Scopri di Più" modal

-- Add short_philosophy column to training_approaches
ALTER TABLE training_approaches
  ADD COLUMN short_philosophy TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN training_approaches.short_philosophy IS
  'Concise 40-50 word description for mobile cards and list views. Full philosophy field contains detailed information shown in modals.';

COMMENT ON COLUMN training_approaches.philosophy IS
  'Full detailed description of the training approach philosophy. Shown in detail modals and "Scopri di Più" expansions. For brief mobile summaries, use short_philosophy.';
