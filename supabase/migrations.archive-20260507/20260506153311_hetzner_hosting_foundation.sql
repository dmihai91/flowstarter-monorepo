-- Hetzner hosting foundation
-- Tracks Hetzner servers (shared multi-tenant Caddy hosts), client sites
-- (one per project, mounted on a server), and individual deployments
-- (versioned, rollback-able).

-- ─── hosting_servers ─────────────────────────────────────────────────────
-- One row per provisioned Hetzner Cloud server.

CREATE TABLE IF NOT EXISTS hosting_servers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           TEXT NOT NULL DEFAULT 'hetzner'
    CHECK (provider IN ('hetzner')),
  hetzner_server_id  TEXT,                        -- Hetzner Cloud server.id (numeric, stored as text for safety)
  name               TEXT NOT NULL,               -- human-readable name, e.g. "caddy-fra-01"
  ipv4               INET,
  ipv6               INET,
  location           TEXT NOT NULL DEFAULT 'fsn1',-- Hetzner location code
  server_type        TEXT NOT NULL DEFAULT 'cx22',-- Hetzner server type (cx22, cx32, etc.)
  status             TEXT NOT NULL DEFAULT 'provisioning'
    CHECK (status IN ('provisioning', 'active', 'draining', 'decommissioned', 'error')),
  status_detail      TEXT,                         -- last error or status note
  caddy_admin_url    TEXT,                         -- internal Caddy admin endpoint (e.g. http://127.0.0.1:2019)
  deploy_agent_url   TEXT,                         -- e.g. https://10.x.x.x:8443 (internal network)
  -- vault reference (Supabase Vault secret name) for the per-server bearer
  -- shared between operator and deploy-agent. NEVER store secret value directly.
  deploy_agent_secret_ref TEXT,
  site_capacity      INTEGER NOT NULL DEFAULT 50
    CHECK (site_capacity > 0),
  sites_count        INTEGER NOT NULL DEFAULT 0
    CHECK (sites_count >= 0),
  cloud_init_version INTEGER NOT NULL DEFAULT 1,   -- bumps when bootstrap script changes
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  decommissioned_at  TIMESTAMPTZ,
  created_by         TEXT                          -- Clerk userId of the team member who initiated
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hosting_servers_hetzner_id_unique
  ON hosting_servers (hetzner_server_id)
  WHERE hetzner_server_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hosting_servers_status
  ON hosting_servers (status);

CREATE INDEX IF NOT EXISTS idx_hosting_servers_capacity_active
  ON hosting_servers (site_capacity, sites_count)
  WHERE status = 'active';

CREATE TRIGGER set_updated_at_hosting_servers
  BEFORE UPDATE ON hosting_servers
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

ALTER TABLE hosting_servers ENABLE ROW LEVEL SECURITY;

-- Team-only access; non-team users never read hosting infra.
CREATE POLICY "hosting_servers_team_only"
  ON hosting_servers
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE hosting_servers IS
  'Hetzner Cloud servers in the shared multi-tenant Caddy fleet.';

-- ─── client_sites ────────────────────────────────────────────────────────
-- One row per project that has been allocated to a hosting server.

CREATE TABLE IF NOT EXISTS client_sites (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  server_id           UUID REFERENCES hosting_servers(id) ON DELETE SET NULL,
  -- site_slug must be unique per server (used as a directory name + Caddy
  -- vhost ID). Typically matches projects.client_editor_slug.
  site_slug           TEXT NOT NULL,
  site_directory      TEXT,                         -- e.g. /var/www/sites/acme/
  primary_domain      TEXT,                         -- e.g. acme.com
  additional_domains  TEXT[] NOT NULL DEFAULT '{}',
  preview_domain      TEXT,                         -- e.g. acme.preview.flowstarter.app
  deploy_status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (deploy_status IN ('pending', 'deploying', 'live', 'failed', 'rolled_back', 'archived')),
  last_deploy_id      UUID,                         -- FK to deployments(id), nullable
  last_deployed_at    TIMESTAMPTZ,
  cloudflare_zone_id  TEXT,                         -- if we manage the zone
  cloudflare_record_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  ssl_status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (ssl_status IN ('pending', 'issued', 'failed', 'renewing')),
  ssl_issued_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_sites_server_slug_unique
  ON client_sites (server_id, LOWER(site_slug))
  WHERE server_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_sites_project
  ON client_sites (project_id);

CREATE INDEX IF NOT EXISTS idx_client_sites_server
  ON client_sites (server_id);

CREATE INDEX IF NOT EXISTS idx_client_sites_deploy_status
  ON client_sites (deploy_status);

CREATE TRIGGER set_updated_at_client_sites
  BEFORE UPDATE ON client_sites
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

ALTER TABLE client_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_sites_team_only"
  ON client_sites
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE client_sites IS
  'One row per project that has been allocated to a hosting_servers row. site_slug is the per-server directory + Caddy vhost identifier.';

-- ─── deployments ─────────────────────────────────────────────────────────
-- Versioned deploy log. Every successful deploy adds a row; rollback inserts
-- a new row with rolled_back_from_id pointing to the previous deploy.

CREATE TABLE IF NOT EXISTS deployments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             UUID NOT NULL REFERENCES client_sites(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version             INTEGER NOT NULL,            -- monotonic per site
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'building', 'uploading', 'live', 'failed', 'rolled_back', 'superseded')),
  status_detail       TEXT,
  artifact_url        TEXT,                         -- HTTPS URL the deploy-agent pulls from (or null if pushed)
  artifact_sha256     TEXT,
  artifact_bytes      BIGINT,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at         TIMESTAMPTZ,
  deployed_by         TEXT,                         -- Clerk userId of the team member or 'system'
  rolled_back_from_id UUID REFERENCES deployments(id) ON DELETE SET NULL,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deployments_site_version_unique
  ON deployments (site_id, version);

CREATE INDEX IF NOT EXISTS idx_deployments_site
  ON deployments (site_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_deployments_project
  ON deployments (project_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_deployments_status
  ON deployments (status);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deployments_team_only"
  ON deployments
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE deployments IS
  'Versioned deploy log per client_site. version is monotonic per site_id.';

-- Now that deployments exists, add the FK on client_sites.last_deploy_id.
ALTER TABLE client_sites
  ADD CONSTRAINT client_sites_last_deploy_fk
  FOREIGN KEY (last_deploy_id) REFERENCES deployments(id) ON DELETE SET NULL;
