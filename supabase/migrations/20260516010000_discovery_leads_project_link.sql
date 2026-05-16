-- Link a discovery lead to the workspace auto-created when its booking
-- deposit is paid. Nullable: most leads never convert; set once by the
-- Stripe webhook (idempotency guard — only create the workspace if this
-- is still null).

ALTER TABLE discovery_leads
  ADD COLUMN IF NOT EXISTS project_id UUID
    REFERENCES workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_discovery_leads_project
  ON discovery_leads (project_id);
