-- Workspace memberships + client constraint profiles.
--
-- workspace_memberships maps Clerk users to workspaces with a role
-- (admin = team, client = the customer who owns the workspace).
-- This is the core auth gate for the multi-tenant editor.
--
-- client_constraint_profiles holds the constraint layer per master doc
-- §4 "Constraints Layer" — system_prompt + allowed_operations that
-- limit what the client editor can ask Claude Code to do. Each
-- workspace can have multiple profiles (e.g. 'view-only' vs 'content-edit')
-- with one is_default = true profile that activates by default.
--
-- Matches the existing prod schema (project ref avptvzherjxymmbtbbbr).

CREATE TABLE IF NOT EXISTS workspace_memberships (
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  clerk_user_id   TEXT NOT NULL,
  role            TEXT NOT NULL
    CHECK (role IN ('admin', 'client')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user
  ON workspace_memberships (clerk_user_id);

ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;

-- ─── Client constraint profiles ─────────────────────────────────────────────
-- The constraint layer that gates what a client-role user can do in the
-- editor. system_prompt is the strict prompt fed to Claude Code on every
-- request from this workspace's client; allowed_operations is a JSON array
-- of structured operation specs (e.g. {"op":"update_text"},
-- {"op":"swap_image"}) that the UI exposes as buttons and the validator
-- pre-checks before forwarding to the AI.

CREATE TABLE IF NOT EXISTS client_constraint_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  system_prompt       TEXT NOT NULL,
  allowed_operations  JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default          BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_constraint_profiles_workspace
  ON client_constraint_profiles (workspace_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_constraint_profiles_one_default
  ON client_constraint_profiles (workspace_id)
  WHERE is_default = true;

ALTER TABLE client_constraint_profiles ENABLE ROW LEVEL SECURITY;
