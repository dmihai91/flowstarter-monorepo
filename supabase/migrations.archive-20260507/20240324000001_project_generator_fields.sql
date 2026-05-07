-- Add new fields to projects table for project generation
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS template_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS target_users TEXT,
ADD COLUMN IF NOT EXISTS business_goals TEXT,
ADD COLUMN IF NOT EXISTS tech_stack JSONB,
ADD COLUMN IF NOT EXISTS features JSONB;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Create index on template_id for analytics
CREATE INDEX IF NOT EXISTS idx_projects_template_id ON projects(template_id);

-- Create table for generated files
CREATE TABLE IF NOT EXISTS generated_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on project_id for generated_files
CREATE INDEX IF NOT EXISTS idx_generated_files_project_id ON generated_files(project_id);

-- Create updated_at trigger for generated_files
CREATE TRIGGER set_updated_at_generated_files
  BEFORE UPDATE ON generated_files
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime (updated_at);

-- Create table for deployment configurations
CREATE TABLE IF NOT EXISTS deployment_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- 'vercel', 'netlify', etc.
  config JSONB NOT NULL,
  env_vars JSONB,
  deployed_url TEXT,
  deployment_status TEXT DEFAULT 'pending',
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on project_id for deployment_configs
CREATE INDEX IF NOT EXISTS idx_deployment_configs_project_id ON deployment_configs(project_id);

-- Create updated_at trigger for deployment_configs
CREATE TRIGGER set_updated_at_deployment_configs
  BEFORE UPDATE ON deployment_configs
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime (updated_at); 