-- Add Google Analytics columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS ga_property_id TEXT,
  ADD COLUMN IF NOT EXISTS ga_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS ga_connected_at TIMESTAMPTZ;

-- Add Calendly columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS calendly_url TEXT,
  ADD COLUMN IF NOT EXISTS calendly_api_key TEXT;

-- Add domain/publishing columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'none'
    CHECK (domain_status IN ('none', 'pending', 'active', 'error'));

COMMENT ON COLUMN projects.ga_property_id IS 'GA4 property ID (numeric, e.g. 123456789)';
COMMENT ON COLUMN projects.ga_refresh_token IS 'Google OAuth refresh token for analytics access';
COMMENT ON COLUMN projects.calendly_url IS 'Calendly scheduling page URL';
COMMENT ON COLUMN projects.calendly_api_key IS 'Calendly Personal Access Token (optional, for event types)';
COMMENT ON COLUMN projects.domain_status IS 'Custom domain status: none, pending verification, active, error';
