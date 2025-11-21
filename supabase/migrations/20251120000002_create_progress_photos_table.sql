-- Create progress_photos table for storing photo references
CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL REFERENCES progress_checks(id) ON DELETE CASCADE,
    photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('front', 'side_left', 'side_right', 'back')),
    photo_url TEXT NOT NULL, -- Supabase Storage path
    photo_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_progress_photos_check_id ON progress_photos(check_id);
CREATE INDEX idx_progress_photos_type ON progress_photos(photo_type);

-- Unique constraint: one photo per type per check
CREATE UNIQUE INDEX idx_progress_photos_unique ON progress_photos(check_id, photo_type);

-- Enable RLS
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see/modify photos from their own checks
CREATE POLICY "Users can view their own check photos"
    ON progress_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = progress_photos.check_id
            AND progress_checks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert photos for their own checks"
    ON progress_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = progress_photos.check_id
            AND progress_checks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete photos from their own checks"
    ON progress_photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM progress_checks
            WHERE progress_checks.id = progress_photos.check_id
            AND progress_checks.user_id = auth.uid()
        )
    );
