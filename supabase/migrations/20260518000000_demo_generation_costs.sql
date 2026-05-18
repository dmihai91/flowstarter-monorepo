-- Cost ledger for the public discovery funnel's LLM generation (copy
-- preview, playable edits, tier recommendation, and — later — agentic
-- codegen). One row per model call. Powers the monthly funnel budget
-- guard + kill-switch: month-to-date spend is summed from this table and
-- the generation routes degrade (cheaper model) / fail open to the
-- deterministic template demo when the cap is hit.
--
-- Service-role only (RLS on, routes use the service client like
-- demo_edit_counters). demo_id correlates to demo_edit_counters /
-- discovery_leads when present; recommend calls have no demo yet.

CREATE TABLE IF NOT EXISTS demo_generation_costs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id     UUID,
  kind        TEXT NOT NULL,            -- 'preview' | 'edit' | 'recommend' | 'codegen'
  model       TEXT,
  tokens_in   INTEGER NOT NULL DEFAULT 0,
  tokens_out  INTEGER NOT NULL DEFAULT 0,
  cost_eur    NUMERIC(10,4) NOT NULL DEFAULT 0,
  ip          TEXT,
  lead_email  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE demo_generation_costs ENABLE ROW LEVEL SECURITY;

-- Month-to-date spend query: WHERE created_at >= date_trunc('month', now()).
CREATE INDEX IF NOT EXISTS idx_demo_generation_costs_created_at
  ON demo_generation_costs (created_at);
