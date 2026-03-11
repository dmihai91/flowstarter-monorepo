-- Leads captured from generated client sites
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  
  -- Metadata
  source TEXT,            -- page path where form was submitted
  ip_address TEXT,        -- for spam filtering
  user_agent TEXT,
  referrer TEXT,
  
  -- Extra fields (catch-all for custom form fields)
  extra JSONB DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'spam', 'archived')),
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_project_id ON leads(project_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Team members can read leads for their projects
CREATE POLICY leads_select_policy ON leads FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  ));

-- Only service role can insert (from API)
CREATE POLICY leads_insert_policy ON leads FOR INSERT
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

COMMENT ON TABLE leads IS 'Form submissions captured from generated client sites';

-- Helper function: get lead counts by status for a project
CREATE OR REPLACE FUNCTION get_lead_counts(p_project_id UUID)
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT status, count(*)
  FROM leads
  WHERE project_id = p_project_id
  GROUP BY status;
$$;
