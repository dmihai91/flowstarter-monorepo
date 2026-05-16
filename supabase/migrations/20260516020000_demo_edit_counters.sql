-- Server-enforced cap for the "play with the editor" demo on the discovery
-- wizard preview step. One row per generated demo; edits_used is bumped by
-- /api/discovery/preview/edit and hard-capped (a refresh or devtools can't
-- bypass it, unlike a pure client counter).
--
-- Keyed by an opaque demo_id (not the lead — the lead row only exists after
-- final submit). On submit the lead is correlated via discovery_leads.demo_id.

CREATE TABLE IF NOT EXISTS demo_edit_counters (
  demo_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edits_used  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE demo_edit_counters ENABLE ROW LEVEL SECURITY;

ALTER TABLE discovery_leads
  ADD COLUMN IF NOT EXISTS demo_id UUID;

CREATE INDEX IF NOT EXISTS idx_discovery_leads_demo
  ON discovery_leads (demo_id);
