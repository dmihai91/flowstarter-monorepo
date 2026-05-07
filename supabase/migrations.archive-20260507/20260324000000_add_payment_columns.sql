-- Phase 3: Payment tracking columns
-- Setup fee split
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_fee INTEGER; -- euros
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_amount INTEGER; -- 50% of total_fee
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_status TEXT NOT NULL DEFAULT 'none'; -- none | invoiced | paid | overdue
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_invoice_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_invoice_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_amount INTEGER; -- 50% of total_fee
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_status TEXT NOT NULL DEFAULT 'none'; -- none | invoiced | paid | overdue | refunded
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_invoice_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_invoice_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Subscription
ALTER TABLE projects ADD COLUMN IF NOT EXISTS plan_name TEXT; -- STARTER | RELAUNCH | GROWTH | PRO
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_price INTEGER; -- EUR cents e.g. 3900
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none'; -- none | trial | active | past_due | cancelled
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subscription_trial_ends TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subscription_next_billing TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Operational
ALTER TABLE projects ADD COLUMN IF NOT EXISTS outstanding_payment BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launched_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS blocking_reason TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS blocking_since TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_last_login_at TIMESTAMPTZ;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_deposit_status ON projects(deposit_status);
CREATE INDEX IF NOT EXISTS idx_projects_final_status ON projects(final_status);
CREATE INDEX IF NOT EXISTS idx_projects_outstanding_payment ON projects(outstanding_payment) WHERE outstanding_payment = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_stripe_customer_id ON projects(stripe_customer_id);
