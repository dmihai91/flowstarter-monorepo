-- First disable RLS
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Convert user_id to TEXT for Clerk IDs
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_user_id_fkey,
  ALTER COLUMN user_id TYPE TEXT;

-- Add an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Recreate policies using JWT sub claim
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY; 