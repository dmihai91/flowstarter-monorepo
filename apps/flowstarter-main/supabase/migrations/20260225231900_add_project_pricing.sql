-- Add pricing and project type fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN projects.project_type IS 'Type of project: standard, premium, enterprise';
COMMENT ON COLUMN projects.setup_fee IS 'One-time setup fee charged for the project';
COMMENT ON COLUMN projects.monthly_fee IS 'Recurring monthly fee for the project';
COMMENT ON COLUMN projects.is_paid IS 'Whether the project has been paid for';
