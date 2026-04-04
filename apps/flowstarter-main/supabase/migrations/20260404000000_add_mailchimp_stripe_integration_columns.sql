-- Add Mailchimp and Stripe integration columns to projects table
-- API keys are stored encrypted in Supabase Vault (pgsodium)
-- Columns here hold only vault UUID references (never plaintext secrets)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS mailchimp_api_key_id  UUID,      -- vault ref for Mailchimp API key
  ADD COLUMN IF NOT EXISTS mailchimp_audience_id TEXT,      -- non-sensitive, stored plaintext
  ADD COLUMN IF NOT EXISTS stripe_pk_id          UUID,      -- vault ref for Stripe publishable key
  ADD COLUMN IF NOT EXISTS stripe_price_id       TEXT;      -- non-sensitive, stored plaintext

COMMENT ON COLUMN projects.mailchimp_api_key_id  IS 'Vault UUID for encrypted Mailchimp API key';
COMMENT ON COLUMN projects.mailchimp_audience_id IS 'Mailchimp audience (list) ID';
COMMENT ON COLUMN projects.stripe_pk_id          IS 'Vault UUID for encrypted Stripe publishable key';
COMMENT ON COLUMN projects.stripe_price_id       IS 'Stripe Price ID for checkout (e.g. price_xxx)';
