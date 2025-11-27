-- Add category field to training_approaches table
-- Existing approaches default to 'bodybuilding', new powerlifting approaches will be 'powerlifting'

ALTER TABLE training_approaches
ADD COLUMN category TEXT NOT NULL DEFAULT 'bodybuilding'
CHECK (category IN ('bodybuilding', 'powerlifting'));

-- Add index for filtered queries by category
CREATE INDEX idx_training_approaches_category ON training_approaches(category);

COMMENT ON COLUMN training_approaches.category IS
  'Training approach category: bodybuilding (hypertrophy-focused) or powerlifting (strength-focused)';
