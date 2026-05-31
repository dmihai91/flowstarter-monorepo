-- Align workspaces.tier_name with the canonical PlanKey set the editor uses
-- (apps/flowstarter-editor/server/src/usage/planEntitlements.ts) so Clerk
-- Billing plan slugs (starter/pro/max/ecommerce) can be mirrored straight into
-- tier_name by the billing webhook.
--
-- The original v1 constraint only allowed legacy strings
-- (essential/pro/commerce/custom). Keep those for back-compat — normalisePlanKey
-- maps them (essential→starter, commerce→ecommerce, custom→admin) — and ADD the
-- canonical keys + 'admin'. Idempotent: drop-if-exists then re-add.
--
-- Note: the v1 inline CHECK auto-named the constraint workspaces_tier_name_check.

ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_tier_name_check;

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_tier_name_check
  CHECK (
    tier_name IS NULL
    OR tier_name IN (
      -- legacy values (still accepted; mapped by normalisePlanKey)
      'essential', 'pro', 'commerce', 'custom',
      -- canonical PlanKey values (Clerk Billing plan slugs mirror these)
      'starter', 'max', 'ecommerce', 'admin'
    )
  );
