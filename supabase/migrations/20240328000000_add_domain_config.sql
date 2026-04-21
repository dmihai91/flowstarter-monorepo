-- Add domain configuration fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS domain_type TEXT DEFAULT 'hosted' CHECK (domain_type IN ('custom', 'hosted')),
ADD COLUMN IF NOT EXISTS domain_name TEXT,
ADD COLUMN IF NOT EXISTS domain_provider TEXT DEFAULT 'platform';

-- Create index on domain_type for filtering
CREATE INDEX IF NOT EXISTS idx_projects_domain_type ON projects(domain_type);

-- Create index on domain_name for lookups
CREATE INDEX IF NOT EXISTS idx_projects_domain_name ON projects(domain_name);

-- Update existing projects to have default domain configuration
UPDATE projects 
SET domain_type = 'hosted', 
    domain_provider = 'platform' 
WHERE domain_type IS NULL;