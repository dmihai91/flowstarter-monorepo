-- Allow multiple drafts per user by removing the unique constraint
-- This enables each project to maintain its own draft state

-- Drop the unique constraint that enforced one draft per user
DROP INDEX IF EXISTS idx_projects_user_draft_unique;

-- Keep the index for efficient filtering but remove uniqueness
-- (The index already exists from the previous migration, this is just for clarity)
-- CREATE INDEX IF NOT EXISTS idx_projects_is_draft ON projects(is_draft);

-- Add comment to document the change
COMMENT ON COLUMN projects.is_draft IS 'Indicates if project is in draft state. Multiple drafts per user are now allowed.';
