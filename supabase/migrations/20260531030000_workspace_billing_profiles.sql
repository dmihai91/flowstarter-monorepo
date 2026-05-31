-- Optional per-workspace company billing details, so a client can have the
-- bill issued to their company (company name on the invoice + VAT/CUI for
-- reverse-charge). Captured via the client billing UI; used by the team for
-- company-name invoicing (RON/BNR accounting workflow) and propagated to the
-- Clerk-Billing Stripe customer where available.
--
-- All access is server-side via service-role (API routes scoped by workspace
-- membership), so RLS is enabled deny-by-default (service-role bypasses it).
-- Idempotent.

CREATE TABLE IF NOT EXISTS workspace_billing_profiles (
  workspace_id    UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  bill_to_company BOOLEAN NOT NULL DEFAULT false,
  company_name    TEXT,
  vat_id          TEXT,           -- VAT number / Romanian CUI
  registration_no TEXT,           -- company registration (e.g. J-number)
  billing_address TEXT,
  country         TEXT,           -- ISO 3166-1 alpha-2
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE workspace_billing_profiles IS
  'Optional company billing details for company-name invoicing (client-entered; mirrored to the Stripe customer + used by accounting).';

ALTER TABLE workspace_billing_profiles ENABLE ROW LEVEL SECURITY;
