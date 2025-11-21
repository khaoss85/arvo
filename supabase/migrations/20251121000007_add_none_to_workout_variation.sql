-- Add 'none' value to workout_variation enum for REST days
-- This allows split sessions to have variation='none' when workoutType='rest'

ALTER TYPE workout_variation ADD VALUE IF NOT EXISTS 'none';
