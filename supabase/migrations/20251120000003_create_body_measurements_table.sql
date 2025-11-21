-- Create body_measurements table for tracking body measurements
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL REFERENCES progress_checks(id) ON DELETE CASCADE,
    measurement_type VARCHAR(30) NOT NULL CHECK (
        measurement_type IN ('waist', 'chest', 'arm_left', 'arm_right', 'thigh_left', 'thigh_right', 'hips', 'shoulders', 'calf_left', 'calf_right')
    ),
    value NUMERIC(6, 2) NOT NULL, -- cm with 2 decimal places (e.g., 85.50)
    unit VARCHAR(10) NOT NULL DEFAULT 'cm',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_body_measurements_check_id ON body_measurements(check_id);
CREATE INDEX idx_body_measurements_type ON body_measurements(measurement_type);

-- Unique constraint: one measurement per type per check
CREATE UNIQUE INDEX idx_body_measurements_unique ON body_measurements(check_id, measurement_type);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see/modify measurements from their own checks
CREATE POLICY "Users can view their own measurements"
    ON body_measurements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = body_measurements.check_id
            AND progress_checks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert measurements for their own checks"
    ON body_measurements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = body_measurements.check_id
            AND progress_checks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update measurements for their own checks"
    ON body_measurements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = body_measurements.check_id
            AND progress_checks.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = body_measurements.check_id
            AND progress_checks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete measurements from their own checks"
    ON body_measurements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = body_measurements.check_id
            AND progress_checks.user_id = auth.uid()
        )
    );
