-- Concierge + Commerce Foundation
-- Adds first-class project metadata for the concierge delivery model and
-- lightweight product records for digital/physical commerce handoff.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS concierge_stage TEXT NOT NULL DEFAULT 'intake'
    CHECK (
      concierge_stage IN (
        'intake',
        'brief',
        'build',
        'internal_review',
        'client_review',
        'launched',
        'care'
      )
    ),
  ADD COLUMN IF NOT EXISTS client_editor_slug TEXT,
  ADD COLUMN IF NOT EXISTS client_editor_status TEXT NOT NULL DEFAULT 'not_invited'
    CHECK (
      client_editor_status IN (
        'not_invited',
        'invited',
        'active',
        'paused',
        'revoked'
      )
    ),
  ADD COLUMN IF NOT EXISTS client_editor_access_level TEXT NOT NULL DEFAULT 'content'
    CHECK (
      client_editor_access_level IN (
        'view',
        'content',
        'content_and_style',
        'commerce_basic'
      )
    ),
  ADD COLUMN IF NOT EXISTS client_editor_monthly_edit_limit INTEGER NOT NULL DEFAULT 50
    CHECK (client_editor_monthly_edit_limit >= 0),
  ADD COLUMN IF NOT EXISTS commerce_mode TEXT NOT NULL DEFAULT 'none'
    CHECK (
      commerce_mode IN (
        'none',
        'payment_link',
        'embedded_checkout',
        'digital_delivery',
        'external_storefront',
        'managed_storefront',
        'custom'
      )
    ),
  ADD COLUMN IF NOT EXISTS commerce_product_type TEXT NOT NULL DEFAULT 'none'
    CHECK (
      commerce_product_type IN (
        'none',
        'digital',
        'physical',
        'mixed',
        'service'
      )
    ),
  ADD COLUMN IF NOT EXISTS commerce_provider TEXT NOT NULL DEFAULT 'none'
    CHECK (
      commerce_provider IN (
        'none',
        'stripe',
        'gumroad',
        'lemon_squeezy',
        'paddle',
        'shopify',
        'woocommerce',
        'custom'
      )
    ),
  ADD COLUMN IF NOT EXISTS commerce_status TEXT NOT NULL DEFAULT 'not_needed'
    CHECK (
      commerce_status IN (
        'not_needed',
        'discovery',
        'configured',
        'live',
        'needs_custom_build'
      )
    ),
  ADD COLUMN IF NOT EXISTS commerce_product_count INTEGER NOT NULL DEFAULT 0
    CHECK (commerce_product_count >= 0),
  ADD COLUMN IF NOT EXISTS commerce_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS commerce_notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_client_editor_slug_unique
  ON projects (LOWER(client_editor_slug))
  WHERE client_editor_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_concierge_stage
  ON projects (concierge_stage);

CREATE INDEX IF NOT EXISTS idx_projects_client_editor_status
  ON projects (client_editor_status);

CREATE INDEX IF NOT EXISTS idx_projects_commerce_status
  ON projects (commerce_status);

CREATE INDEX IF NOT EXISTS idx_projects_commerce_mode_provider
  ON projects (commerce_mode, commerce_provider);

COMMENT ON COLUMN projects.concierge_stage IS
  'Concierge delivery stage from intake through launch and ongoing care.';
COMMENT ON COLUMN projects.client_editor_slug IS
  'Platform subdomain slug for the client-safe editor, e.g. acme -> acme.flowstarter.*.';
COMMENT ON COLUMN projects.client_editor_status IS
  'Client editor access lifecycle controlled by the team.';
COMMENT ON COLUMN projects.client_editor_access_level IS
  'Allowed client editor capability set. Enforced by API/routes, not only by prompt.';
COMMENT ON COLUMN projects.commerce_mode IS
  'Commerce implementation shape: payment link, embedded checkout, external storefront, managed storefront, or custom.';
COMMENT ON COLUMN projects.commerce_product_type IS
  'Primary product type: digital, physical, mixed, service, or none.';
COMMENT ON COLUMN projects.commerce_provider IS
  'Preferred commerce provider for checkout/fulfillment handoff.';
COMMENT ON COLUMN projects.commerce_requirements IS
  'Structured commerce discovery data such as tax, shipping, fulfillment, download, subscription, and inventory needs.';

CREATE TABLE IF NOT EXISTS commerce_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT,
  product_type         TEXT NOT NULL DEFAULT 'digital'
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
    CHECK (
      fulfillment_type IS NULL OR fulfillment_type IN (
        'download',
        'license_key',
        'course_access',
        'manual',
        'ship',
        'pickup',
        'dropship',
        'print_on_demand'
      )
    ),
  inventory_policy    TEXT NOT NULL DEFAULT 'not_tracked'
    CHECK (inventory_policy IN ('not_tracked', 'track', 'preorder')),
  inventory_quantity  INTEGER,
  weight_grams        INTEGER,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commerce_products_project
  ON commerce_products (project_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_products_project_slug_unique
  ON commerce_products (project_id, LOWER(slug))
  WHERE slug IS NOT NULL;

CREATE TRIGGER set_updated_at_commerce_products
  BEFORE UPDATE ON commerce_products
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

ALTER TABLE commerce_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commerce_products_no_public_access"
  ON commerce_products
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE commerce_products IS
  'Lightweight commerce catalog records used for concierge discovery, checkout-provider handoff, and client-safe product display.';
