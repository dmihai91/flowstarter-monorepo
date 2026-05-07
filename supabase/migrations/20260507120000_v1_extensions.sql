-- V1 extensions on top of the workspace foundation.
--
-- Adds everything needed for the V1 concierge product per
-- docs/FLOWSTARTER_MASTER_DECISIONS.md:
--
--   1. Extend workspaces with concierge stage, billing fields, founding
--      flag, tier, contact info, and editor session counters.
--   2. Hosting fleet — hosting_servers (Hetzner Caddy hosts) and
--      deployments (versioned per workspace).
--   3. Commerce catalog — commerce_products linked to a workspace.
--   4. Billing milestones — setup_payment_milestones (50/50 for founding,
--      4×25% post-founding; either fits this schema).
--   5. Editor sessions — tier-limit enforcement.
--   6. Support tables — leads, contact_submissions, ai_audit_logs,
--      vault_encrypted_secrets, security_audit_logs.

-- ─── 1. Extend workspaces ───────────────────────────────────────────────────

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS concierge_stage TEXT NOT NULL DEFAULT 'intake'
    CHECK (concierge_stage IN (
      'intake', 'brief', 'build', 'internal_review',
      'client_review', 'launched', 'care'
    )),

  ADD COLUMN IF NOT EXISTS tier_name TEXT
    CHECK (tier_name IS NULL OR tier_name IN ('essential', 'pro', 'commerce', 'custom')),
  ADD COLUMN IF NOT EXISTS is_founding BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual')),

  -- Client contact info (the team's record of who owns this workspace)
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_business_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,

  -- Pricing — populated on the discovery call
  ADD COLUMN IF NOT EXISTS setup_fee INTEGER CHECK (setup_fee IS NULL OR setup_fee >= 0),
  ADD COLUMN IF NOT EXISTS monthly_fee INTEGER CHECK (monthly_fee IS NULL OR monthly_fee >= 0),

  -- Stripe references
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_trial_ends TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_next_billing TIMESTAMPTZ,

  -- Setup invoice tracking (50/50 model — milestones table handles 4×25%)
  ADD COLUMN IF NOT EXISTS deposit_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (deposit_status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  ADD COLUMN IF NOT EXISTS deposit_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS deposit_invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS deposit_amount INTEGER,
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (final_status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  ADD COLUMN IF NOT EXISTS final_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS final_invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS final_amount INTEGER,
  ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outstanding_payment BOOLEAN NOT NULL DEFAULT false,

  -- Editor session counters (master doc §5)
  ADD COLUMN IF NOT EXISTS subscription_sessions_used_this_month INTEGER NOT NULL DEFAULT 0
    CHECK (subscription_sessions_used_this_month >= 0),
  ADD COLUMN IF NOT EXISTS subscription_rollover_remaining INTEGER NOT NULL DEFAULT 0
    CHECK (subscription_rollover_remaining >= 0),

  -- Commerce
  ADD COLUMN IF NOT EXISTS commerce_mode TEXT NOT NULL DEFAULT 'none'
    CHECK (commerce_mode IN (
      'none', 'payment_link', 'embedded_checkout',
      'digital_delivery', 'external_storefront', 'managed_storefront', 'custom'
    )),
  ADD COLUMN IF NOT EXISTS commerce_product_type TEXT NOT NULL DEFAULT 'none'
    CHECK (commerce_product_type IN ('none', 'digital', 'physical', 'mixed', 'service')),
  ADD COLUMN IF NOT EXISTS commerce_provider TEXT NOT NULL DEFAULT 'none'
    CHECK (commerce_provider IN (
      'none', 'stripe', 'gumroad', 'lemon_squeezy', 'paddle', 'shopify', 'woocommerce', 'custom'
    )),
  ADD COLUMN IF NOT EXISTS commerce_status TEXT NOT NULL DEFAULT 'not_needed'
    CHECK (commerce_status IN (
      'not_needed', 'discovery', 'configured', 'live', 'needs_custom_build'
    )),
  ADD COLUMN IF NOT EXISTS commerce_product_count INTEGER NOT NULL DEFAULT 0
    CHECK (commerce_product_count >= 0),
  ADD COLUMN IF NOT EXISTS commerce_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS commerce_notes TEXT,

  -- Setup milestone timestamps
  ADD COLUMN IF NOT EXISTS setup_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_mockup_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_staging_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_go_live_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workspaces_concierge_stage ON workspaces (concierge_stage);
CREATE INDEX IF NOT EXISTS idx_workspaces_tier_name ON workspaces (tier_name) WHERE tier_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer ON workspaces (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspaces_outstanding ON workspaces (outstanding_payment) WHERE outstanding_payment = true;

-- ─── 2. Hosting fleet ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hosting_servers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider                 TEXT NOT NULL DEFAULT 'hetzner' CHECK (provider IN ('hetzner')),
  hetzner_server_id        TEXT,
  name                     TEXT NOT NULL,
  ipv4                     INET,
  ipv6                     INET,
  location                 TEXT NOT NULL DEFAULT 'fsn1',
  server_type              TEXT NOT NULL DEFAULT 'cpx22',
  status                   TEXT NOT NULL DEFAULT 'provisioning'
    CHECK (status IN ('provisioning', 'active', 'draining', 'decommissioned', 'error')),
  status_detail            TEXT,
  caddy_admin_url          TEXT,
  deploy_agent_url         TEXT,
  deploy_agent_secret_ref  TEXT,
  site_capacity            INTEGER NOT NULL DEFAULT 50 CHECK (site_capacity > 0),
  sites_count              INTEGER NOT NULL DEFAULT 0 CHECK (sites_count >= 0),
  cloud_init_version       INTEGER NOT NULL DEFAULT 1,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  decommissioned_at        TIMESTAMPTZ,
  created_by               TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hosting_servers_hetzner_id_unique
  ON hosting_servers (hetzner_server_id) WHERE hetzner_server_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hosting_servers_status ON hosting_servers (status);
CREATE INDEX IF NOT EXISTS idx_hosting_servers_capacity_active
  ON hosting_servers (site_capacity, sites_count) WHERE status = 'active';

ALTER TABLE hosting_servers ENABLE ROW LEVEL SECURITY;

-- Each workspace lives on a server. We track which server + the path on disk + DNS state.
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS hosting_server_id UUID REFERENCES hosting_servers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_directory TEXT,
  ADD COLUMN IF NOT EXISTS deploy_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (deploy_status IN ('pending', 'deploying', 'live', 'failed', 'rolled_back', 'archived')),
  ADD COLUMN IF NOT EXISTS last_deploy_id UUID,
  ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cloudflare_zone_id TEXT,
  ADD COLUMN IF NOT EXISTS cloudflare_record_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ssl_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ssl_status IN ('pending', 'issued', 'failed', 'renewing')),
  ADD COLUMN IF NOT EXISTS ssl_issued_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workspaces_hosting_server ON workspaces (hosting_server_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_deploy_status ON workspaces (deploy_status);

-- ─── 3. Deployments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deployments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  version             INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'building', 'uploading', 'live', 'failed', 'rolled_back', 'superseded')),
  status_detail       TEXT,
  artifact_url        TEXT,
  artifact_sha256     TEXT,
  artifact_bytes      BIGINT,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at         TIMESTAMPTZ,
  deployed_by         TEXT,
  rolled_back_from_id UUID REFERENCES deployments(id) ON DELETE SET NULL,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deployments_workspace_version_unique
  ON deployments (workspace_id, version);
CREATE INDEX IF NOT EXISTS idx_deployments_workspace
  ON deployments (workspace_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status
  ON deployments (status);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_last_deploy_fk
  FOREIGN KEY (last_deploy_id) REFERENCES deployments(id) ON DELETE SET NULL;

-- ─── 4. Commerce catalog ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commerce_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT,
  product_type        TEXT NOT NULL DEFAULT 'digital'
    CHECK (product_type IN ('digital', 'physical', 'service', 'subscription')),
  status              TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  short_description   TEXT,
  price_amount        INTEGER,
  currency            TEXT NOT NULL DEFAULT 'EUR',
  provider_product_id TEXT,
  provider_price_id   TEXT,
  checkout_url        TEXT,
  delivery_url        TEXT,
  fulfillment_type    TEXT
    CHECK (fulfillment_type IS NULL OR fulfillment_type IN (
      'download', 'license_key', 'course_access', 'manual', 'ship', 'pickup', 'dropship', 'print_on_demand'
    )),
  inventory_policy    TEXT NOT NULL DEFAULT 'not_tracked'
    CHECK (inventory_policy IN ('not_tracked', 'track', 'preorder')),
  inventory_quantity  INTEGER,
  weight_grams        INTEGER,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commerce_products_workspace ON commerce_products (workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_products_workspace_slug_unique
  ON commerce_products (workspace_id, LOWER(slug)) WHERE slug IS NOT NULL;

ALTER TABLE commerce_products ENABLE ROW LEVEL SECURITY;

-- ─── 5. Setup payment milestones ────────────────────────────────────────────
-- Per master doc §5: 50/50 for founding clients, 4×25% post-founding.
-- Same schema fits both — milestone column just gets different values.

CREATE TABLE IF NOT EXISTS setup_payment_milestones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  milestone           TEXT NOT NULL
    CHECK (milestone IN ('deposit', 'final', 'signing', 'mockup', 'staging', 'go_live')),
  position            SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 4),
  amount_minor        INTEGER NOT NULL CHECK (amount_minor > 0),
  currency            TEXT NOT NULL DEFAULT 'EUR',
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  stripe_invoice_id   TEXT,
  stripe_invoice_url  TEXT,
  approved_at         TIMESTAMPTZ,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_setup_milestones_workspace_milestone_unique
  ON setup_payment_milestones (workspace_id, milestone);
CREATE INDEX IF NOT EXISTS idx_setup_milestones_workspace ON setup_payment_milestones (workspace_id, position);

ALTER TABLE setup_payment_milestones ENABLE ROW LEVEL SECURITY;

-- ─── 6. Editor sessions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS editor_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,
  user_role           TEXT NOT NULL CHECK (user_role IN ('team', 'client')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at            TIMESTAMPTZ,
  ended_reason        TEXT
    CHECK (ended_reason IS NULL OR ended_reason IN ('idle_timeout', 'explicit_close', 'system')),
  tokens_in           INTEGER NOT NULL DEFAULT 0 CHECK (tokens_in >= 0),
  tokens_out          INTEGER NOT NULL DEFAULT 0 CHECK (tokens_out >= 0),
  request_count       INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_editor_sessions_workspace_started
  ON editor_sessions (workspace_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_editor_sessions_user ON editor_sessions (user_id);

ALTER TABLE editor_sessions ENABLE ROW LEVEL SECURITY;

-- ─── 7. Support tables ──────────────────────────────────────────────────────

-- Public marketing contact form submissions (not workspace-scoped).
CREATE TABLE IF NOT EXISTS contact_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  read_at       TIMESTAMPTZ,
  responded_at  TIMESTAMPTZ,
  notes         TEXT
);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions (created_at DESC);
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Lead-capture form submissions on a hosted client site.
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  message       TEXT,
  source        TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  referrer      TEXT,
  extra         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'spam', 'contacted', 'converted', 'archived')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- AI usage audit (internal). Encrypted_payload uses AI_AUDIT_ENC_KEY.
CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL,
  username            TEXT,
  action              TEXT,
  agent               TEXT,
  encrypted_payload   TEXT NOT NULL,
  workspace_id        UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  pipeline_id         TEXT,
  route               TEXT,
  ip                  INET,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_audit_workspace ON ai_audit_logs (workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON ai_audit_logs (user_id);
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- Per-workspace encrypted secrets (Stripe Tax IDs, provider creds, etc.)
CREATE TABLE IF NOT EXISTS vault_encrypted_secrets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  secret_name       TEXT NOT NULL,
  encrypted_value   TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_secrets_workspace_name
  ON vault_encrypted_secrets (workspace_id, secret_name);
ALTER TABLE vault_encrypted_secrets ENABLE ROW LEVEL SECURITY;
