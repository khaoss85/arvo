-- Create progress_checks table for tracking body composition checks
CREATE TABLE progress_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cycle_number INTEGER,
    cycle_day INTEGER,
    weight NUMERIC(5, 2), -- kg with 2 decimal places (e.g., 85.50)
    notes TEXT,
    is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_progress_checks_user_id ON progress_checks(user_id);
CREATE INDEX idx_progress_checks_taken_at ON progress_checks(taken_at DESC);
CREATE INDEX idx_progress_checks_user_taken ON progress_checks(user_id, taken_at DESC);

-- Enable RLS
ALTER TABLE progress_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see/modify their own checks
CREATE POLICY "Users can view their own checks"
    ON progress_checks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checks"
    ON progress_checks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checks"
    ON progress_checks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checks"
    ON progress_checks FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_progress_checks_updated_at
    BEFORE UPDATE ON progress_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
