-- AI usage accounting for editor enforcement (master doc §5).
--
-- The editor enforces a per-plan monthly AI budget (PLAN_ENTITLEMENTS
-- .monthlyHardCeilingEur) and a session-count allowance. Until now only
-- `subscription_sessions_used_this_month` + `subscription_rollover_remaining`
-- existed (and nothing incremented them); there was no € accumulator and no
-- usage-period marker to drive a monthly reset. This adds both.
--
-- Idempotent: re-runnable (ADD COLUMN IF NOT EXISTS). Applied dev → main per
-- the per-migration MCP rule.

ALTER TABLE workspaces
  -- Accumulated provider AI cost in USD for the current usage period. Stored
  -- in the provider's native USD (from result.total_cost_usd); the editor
  -- converts to EUR against the plan's € ceiling at read time so no FX rate
  -- is baked into stored data.
  ADD COLUMN IF NOT EXISTS subscription_ai_cost_usd_this_month NUMERIC(12, 6) NOT NULL DEFAULT 0
    CHECK (subscription_ai_cost_usd_this_month >= 0),

  -- First day (UTC) of the current monthly usage period. When `now()` rolls
  -- into a later month than this, the editor resets sessions_used + ai_cost
  -- and advances this marker. Avoids a cron: reset happens lazily on next use.
  ADD COLUMN IF NOT EXISTS subscription_usage_period_start DATE NOT NULL
    DEFAULT date_trunc('month', (now() AT TIME ZONE 'utc'))::date;

COMMENT ON COLUMN workspaces.subscription_ai_cost_usd_this_month IS
  'Accumulated provider AI cost (USD) in the current usage period; reset when subscription_usage_period_start rolls to a new UTC month. Compared (converted to EUR) against PLAN_ENTITLEMENTS.monthlyHardCeilingEur to gate edits.';

COMMENT ON COLUMN workspaces.subscription_usage_period_start IS
  'First day (UTC) of the current monthly usage period. When the current UTC month exceeds this, the editor lazily resets subscription_sessions_used_this_month + subscription_ai_cost_usd_this_month and advances this marker.';
