-- Custom Solution inquiries.
--
-- Parallel intake for complex projects (€5k+) that go through manual
-- qualification instead of the paid Strategy Call deposit flow. One row per
-- submission from /custom-inquiry. Admin triages in /admin/dashboard/inquiries
-- and either approves (sends booking link) or rejects (redirects to paid path).
--
-- RLS on, no public policies — public POST writes via the service-role key on
-- the server. Reads in the admin dashboard also go via service-role behind
-- Clerk team auth.

CREATE TABLE IF NOT EXISTS custom_inquiries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contact
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  company_name        TEXT NOT NULL,
  website             TEXT,

  -- Profile
  role                TEXT NOT NULL
    CHECK (role IN ('founder_ceo', 'cto', 'marketing_director',
                    'product_manager', 'other')),
  industry            TEXT NOT NULL,

  -- Project
  project_types       TEXT[] NOT NULL DEFAULT '{}',
  project_type_other  TEXT,
  budget_range        TEXT NOT NULL
    CHECK (budget_range IN ('5-10k', '10-20k', '20-30k', '30k+')),
  timeline            TEXT NOT NULL
    CHECK (timeline IN ('1-2-months', '2-4-months', '4-6-months', 'flexible')),
  justification       TEXT NOT NULL,

  -- Attribution
  referral_source     TEXT,

  -- Triage
  status              TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected',
                      'scheduled', 'completed', 'archived')),
  admin_notes         TEXT,
  reviewed_by         TEXT,
  reviewed_at         TIMESTAMPTZ,
  booking_link        TEXT,
  rejection_reason    TEXT
);

CREATE INDEX IF NOT EXISTS idx_custom_inquiries_created
  ON custom_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_inquiries_email
  ON custom_inquiries (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_custom_inquiries_status
  ON custom_inquiries (status);

-- Keep updated_at honest on any UPDATE.
CREATE OR REPLACE FUNCTION custom_inquiries_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_custom_inquiries_updated_at ON custom_inquiries;
CREATE TRIGGER trg_custom_inquiries_updated_at
  BEFORE UPDATE ON custom_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION custom_inquiries_set_updated_at();

ALTER TABLE custom_inquiries ENABLE ROW LEVEL SECURITY;
