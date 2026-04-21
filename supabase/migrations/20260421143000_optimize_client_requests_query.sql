-- Performance optimization for dashboard client request listing/search.
-- The existing API filters by status, sorts by created_at/priority, and searches
-- title/description with ilike. Add indexes aligned to those access patterns.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fast path for the most common dashboard query:
-- WHERE status = ? ORDER BY created_at DESC LIMIT 100
CREATE INDEX IF NOT EXISTS idx_client_requests_status_created
  ON client_requests (status, created_at DESC);

-- Fast path for priority sorting within status tabs.
CREATE INDEX IF NOT EXISTS idx_client_requests_status_priority_created
  ON client_requests (status, priority, created_at DESC);

-- Speed up ilike search on title/description.
CREATE INDEX IF NOT EXISTS idx_client_requests_title_trgm
  ON client_requests USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_client_requests_description_trgm
  ON client_requests USING gin (description gin_trgm_ops);
