-- Workspaces — per master doc §4 "Workspace data model".
--
-- One row per client. Each workspace is either an Astro service site or
-- a Shopify Liquid store. Hostnames (custom domain + preview/editor
-- subdomains) live in workspace_hosts so a single workspace can answer
-- to multiple URLs.
--
-- Matches the existing prod schema (project ref avptvzherjxymmbtbbbr).

CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  site_kind   TEXT NOT NULL
    CHECK (site_kind IN ('shopify_liquid', 'astro')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_slug
  ON workspaces (LOWER(slug));

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ─── workspace_hosts ───────────────────────────────────────────────────────
-- Each workspace can have multiple hostnames (e.g. acme.flowstarter.app
-- + acme.preview.flowstarter.app + acme.com). Caddy on the Hetzner host
-- reverse-proxies based on these.

CREATE TABLE IF NOT EXISTS workspace_hosts (
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hostname      TEXT PRIMARY KEY,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_hosts_workspace
  ON workspace_hosts (workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_hosts_one_primary_per_workspace
  ON workspace_hosts (workspace_id)
  WHERE is_primary = true;

ALTER TABLE workspace_hosts ENABLE ROW LEVEL SECURITY;
