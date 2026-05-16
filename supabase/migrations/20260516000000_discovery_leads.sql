-- Discovery-form leads.
--
-- One row per completed discovery wizard. Captured by /api/discovery/lead
-- (public, best-effort). The Stripe booking-deposit webhook updates
-- deposit_status on the matching row. Surfaced in the team admin dashboard
-- at /admin/dashboard/leads.
--
-- Service-role only (public API uses the service-role key; admin reads via
-- the service-role key behind Clerk team auth). RLS on, no public policies.

CREATE TABLE IF NOT EXISTS discovery_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- About
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  business_name       TEXT,

  -- Business
  industry            TEXT,
  description         TEXT NOT NULL,
  target_audience     TEXT,

  -- Goals
  goal                TEXT,
  brand_tone          TEXT,
  page_count          TEXT,
  timeline            TEXT,

  -- Commerce
  commerce_mode       TEXT,
  catalog_size        TEXT,
  custom_integrations TEXT,

  -- Outcome
  selected_tier       TEXT NOT NULL,
  subscription        TEXT,
  source              TEXT,

  -- Booking deposit (set by the Stripe webhook)
  deposit_status      TEXT NOT NULL DEFAULT 'none'
    CHECK (deposit_status IN ('none', 'paid', 'refunded')),
  deposit_amount_eur  INTEGER,
  stripe_session_id   TEXT,
  deposit_paid_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discovery_leads_created
  ON discovery_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_leads_email
  ON discovery_leads (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_discovery_leads_deposit
  ON discovery_leads (deposit_status);

ALTER TABLE discovery_leads ENABLE ROW LEVEL SECURITY;
