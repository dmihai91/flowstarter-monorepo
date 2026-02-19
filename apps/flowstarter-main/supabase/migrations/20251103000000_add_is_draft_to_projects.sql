-- Add is_draft field to projects table to support draft state
-- Drafts will be stored as regular projects with is_draft=true

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false NOT NULL;

-- Create index on is_draft for efficient filtering
CREATE INDEX IF NOT EXISTS idx_projects_is_draft ON projects(is_draft);

-- Add unique constraint to ensure one draft per user (must be before migration)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_draft_unique 
ON projects(user_id) 
WHERE is_draft = true;

-- Migrate existing drafts from project_drafts table if it exists
DO $$
BEGIN
  -- Check if project_drafts table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_drafts') THEN
    -- For each user with a draft in project_drafts, create or update a draft project
    INSERT INTO projects (
      user_id,
      name,
      description,
      chat,
      template_id,
      domain_type,
      domain_name,
      domain_provider,
      status,
      is_draft,
      created_at,
      updated_at
    )
    SELECT 
      pd.user_id,
      COALESCE((pd.draft->>'name')::text, 'Untitled Project'),
      COALESCE((pd.draft->>'description')::text, ''),
      pd.draft::text,
      NULLIF((pd.draft->'template'->>'id')::text, ''),
      COALESCE((pd.draft->'domainConfig'->>'domainType')::text, 'hosted'),
      NULLIF((pd.draft->'domainConfig'->>'domain')::text, ''),
      COALESCE((pd.draft->'domainConfig'->>'provider')::text, 'platform'),
      'draft',
      true,
      NOW(),
      pd.updated_at
    FROM project_drafts pd
    ON CONFLICT (user_id) WHERE is_draft = true
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      chat = EXCLUDED.chat,
      template_id = EXCLUDED.template_id,
      domain_type = EXCLUDED.domain_type,
      domain_name = EXCLUDED.domain_name,
      domain_provider = EXCLUDED.domain_provider,
      updated_at = EXCLUDED.updated_at;
  END IF;
END $$;
