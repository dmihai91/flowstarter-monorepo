-- Align projects schema to docs/FLOWSTARTER_MASTER_DECISIONS.md (May 2026).
--
-- Adds:
--   - workspace_type           — 'astro' or 'shopify-liquid' per master doc §3
--   - tier_name                — subscription tier: essential / pro / commerce / custom
--   - is_founding              — true for first 10 clients per tier (12-month price lock)
--   - founding_locked_until    — explicit end of founding-rate window
--   - billing_interval         — 'monthly' or 'annual'
--   - setup_signed_at          — milestone 1: contract signing
--   - setup_mockup_approved_at — milestone 2: design mockup approved
--   - setup_staging_ready_at   — milestone 3: staging build approved
--   - setup_go_live_at         — milestone 4: go-live
--   - subscription_sessions_used_this_month / _rollover_remaining for editor
--
-- Adds new table:
--   - setup_payment_milestones — 4 rows per project (one per milestone),
--     each with its own Stripe invoice tracking. Replaces the 50/50
--     deposit_invoice_* / final_invoice_* split which is preserved on
--     `projects` for backward compat with the existing webhook handler.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS workspace_type TEXT NOT NULL DEFAULT 'astro'
    CHECK (workspace_type IN ('astro', 'shopify-liquid')),
  ADD COLUMN IF NOT EXISTS tier_name TEXT
    CHECK (
      tier_name IS NULL OR tier_name IN (
        'essential',
        'pro',
        'commerce',
        'custom'
      )
    ),
  ADD COLUMN IF NOT EXISTS is_founding BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS setup_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_mockup_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_staging_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_go_live_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_sessions_used_this_month INTEGER NOT NULL DEFAULT 0
    CHECK (subscription_sessions_used_this_month >= 0),
  ADD COLUMN IF NOT EXISTS subscription_rollover_remaining INTEGER NOT NULL DEFAULT 0
    CHECK (subscription_rollover_remaining >= 0);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_type
  ON projects (workspace_type);
CREATE INDEX IF NOT EXISTS idx_projects_tier_name
  ON projects (tier_name)
  WHERE tier_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_is_founding
  ON projects (is_founding)
  WHERE is_founding = true;

COMMENT ON COLUMN projects.workspace_type IS
  'Per master doc §3 — astro for service sites, shopify-liquid for Shopify stores. Astro is the default; Shopify Liquid only when client requirements force it.';
COMMENT ON COLUMN projects.tier_name IS
  'Subscription tier: essential (€49/mo, 15 sessions), pro (€79/mo, 50 sessions), commerce (€129/mo, 75 sessions), custom (sized to project).';
COMMENT ON COLUMN projects.is_founding IS
  'True for first 10 clients per tier. Founding price locked for 12 months, then moves to standard.';
COMMENT ON COLUMN projects.billing_interval IS
  'monthly = bill every month at €X/mo. annual = bill once a year at 10× monthly (2 months free).';

-- ─── Setup milestones table ─────────────────────────────────────────────────
-- 4 rows per project (signing / mockup / staging / go-live). Each has its
-- own Stripe invoice for the 25% milestone payment. Created when the
-- contract is signed; updated as each milestone is hit.

CREATE TABLE IF NOT EXISTS setup_payment_milestones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone           TEXT NOT NULL
    CHECK (milestone IN ('signing', 'mockup', 'staging', 'go_live')),
  position            SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 4),
  amount_minor        INTEGER NOT NULL CHECK (amount_minor > 0),
  currency            TEXT NOT NULL DEFAULT 'EUR',
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  stripe_invoice_id   TEXT,
  stripe_invoice_url  TEXT,
  approved_at         TIMESTAMPTZ,                 -- when client approved this milestone
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_setup_milestones_project_milestone_unique
  ON setup_payment_milestones (project_id, milestone);

CREATE INDEX IF NOT EXISTS idx_setup_milestones_project
  ON setup_payment_milestones (project_id, position);

CREATE INDEX IF NOT EXISTS idx_setup_milestones_status
  ON setup_payment_milestones (status);

CREATE TRIGGER set_updated_at_setup_payment_milestones
  BEFORE UPDATE ON setup_payment_milestones
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

ALTER TABLE setup_payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setup_milestones_team_only"
  ON setup_payment_milestones
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE setup_payment_milestones IS
  'Per master doc §5 — setup fee is paid in 4 milestones (25% × 4): signing / mockup / staging / go_live. Each milestone has its own Stripe invoice. Replaces the older deposit/final 50/50 model (those columns kept on projects for backward compat).';

-- ─── Editor session counters ────────────────────────────────────────────────
-- Track AI editor sessions per client per month. A "session" is open editor
-- → activity → 30 min inactivity OR close. Reopening after 30 min counts
-- as a new session. Master doc §5 enforces tier limits + 50% rollover.

CREATE TABLE IF NOT EXISTS editor_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,                -- Clerk userId of the team or client user
  user_role           TEXT NOT NULL                  -- which role used the session
    CHECK (user_role IN ('team', 'client')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at            TIMESTAMPTZ,                   -- set when 30 min idle / closed
  ended_reason        TEXT
    CHECK (ended_reason IS NULL OR ended_reason IN ('idle_timeout', 'explicit_close', 'system')),
  tokens_in           INTEGER NOT NULL DEFAULT 0 CHECK (tokens_in >= 0),
  tokens_out          INTEGER NOT NULL DEFAULT 0 CHECK (tokens_out >= 0),
  request_count       INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_editor_sessions_project_started
  ON editor_sessions (project_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_editor_sessions_user
  ON editor_sessions (user_id);

ALTER TABLE editor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editor_sessions_team_only"
  ON editor_sessions
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE editor_sessions IS
  'Per master doc §5 — one row per AI editor session (open → activity → 30 min idle / close). Aggregated monthly to enforce tier session limits. tokens_* columns are internal-only (not surfaced to client); session count is what enforces limits.';
