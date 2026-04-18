-- Editor Workspaces
-- Tracks Daytona sandbox provisioning state for both team members and clients.
-- Team auth: Clerk JWT (RLS). Client auth: validated at API layer via Convex clientSessions.

CREATE TABLE IF NOT EXISTS editor_workspaces (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,
  user_type      TEXT NOT NULL DEFAULT 'team'
    CHECK (user_type IN ('team', 'client')),
  project_id     TEXT NOT NULL,
  sandbox_id     TEXT,
  workspace_url  TEXT,
  access_level   TEXT NOT NULL DEFAULT 'full'
    CHECK (access_level IN ('view', 'customize', 'full')),
  status         TEXT NOT NULL DEFAULT 'provisioning'
    CHECK (status IN ('provisioning', 'ready', 'building', 'running', 'error', 'stopped', 'archived')),
  snapshot_id    TEXT,
  error_message  TEXT,
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ew_user       ON editor_workspaces (user_id, user_type);
CREATE INDEX idx_ew_project    ON editor_workspaces (project_id);
CREATE UNIQUE INDEX idx_ew_sandbox ON editor_workspaces (sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX idx_ew_status     ON editor_workspaces (status);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_editor_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_editor_workspaces_updated_at
  BEFORE UPDATE ON editor_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_editor_workspaces_updated_at();

-- Row-Level Security
ALTER TABLE editor_workspaces ENABLE ROW LEVEL SECURITY;

-- Team members see their own workspaces via Clerk JWT sub claim
CREATE POLICY team_own_workspaces ON editor_workspaces
  FOR ALL TO authenticated
  USING (user_type = 'team' AND user_id = current_setting('request.jwt.claims')::json->>'sub');

-- Service role has full access (API routes validate client sessions via Convex)
CREATE POLICY service_role_all ON editor_workspaces
  FOR ALL TO service_role
  USING (true);
