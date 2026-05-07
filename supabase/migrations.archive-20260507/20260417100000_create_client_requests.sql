-- Client Requests
-- Escalated requests from the constrained client editor to the team dashboard.
-- Team-side access is via service role client (bypasses RLS); public has no access.

CREATE TABLE IF NOT EXISTS client_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL,
  client_user_id       TEXT NOT NULL,          -- Clerk user ID of the client
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  original_prompt      TEXT,
  editor_context       JSONB,
  status               TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'in_progress', 'resolved', 'rejected')),
  priority             TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to          TEXT,                   -- Clerk user ID of assigned team member
  rejection_reason     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at          TIMESTAMPTZ,
  resolved_at          TIMESTAMPTZ,
  workspace_session_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_requests_status  ON client_requests (status);
CREATE INDEX IF NOT EXISTS idx_client_requests_project ON client_requests (project_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_created ON client_requests (created_at DESC);

-- RLS: team routes use service role client (bypasses RLS). Public has no access;
-- all reads/writes go through server-side API routes that enforce Clerk role checks.
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_public_access" ON client_requests
  FOR ALL TO public USING (false);
