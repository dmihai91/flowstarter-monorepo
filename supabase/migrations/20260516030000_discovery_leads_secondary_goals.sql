-- Secondary goals captured on the discovery wizard (multi-select, optional,
-- alongside the single primary goal). Informational — scoped on the call.

ALTER TABLE discovery_leads
  ADD COLUMN IF NOT EXISTS secondary_goals TEXT[];
