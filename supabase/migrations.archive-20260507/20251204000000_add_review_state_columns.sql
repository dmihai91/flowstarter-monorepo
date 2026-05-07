-- Add columns to store generated site data from the review step
-- This allows resuming the review state when continuing from dashboard

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS generated_code TEXT,
ADD COLUMN IF NOT EXISTS generated_files JSONB,
ADD COLUMN IF NOT EXISTS preview_html TEXT,
ADD COLUMN IF NOT EXISTS quality_metrics JSONB,
ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index on generation_completed_at for filtering generated projects
CREATE INDEX IF NOT EXISTS idx_projects_generation_completed_at ON projects(generation_completed_at);

-- Add comment to document the columns
COMMENT ON COLUMN projects.generated_code IS 'Main generated code from AI';
COMMENT ON COLUMN projects.generated_files IS 'Array of generated files with path and content';
COMMENT ON COLUMN projects.preview_html IS 'HTML content for preview rendering';
COMMENT ON COLUMN projects.quality_metrics IS 'Quality assessment data from code review';
COMMENT ON COLUMN projects.generation_completed_at IS 'Timestamp when site generation completed';
