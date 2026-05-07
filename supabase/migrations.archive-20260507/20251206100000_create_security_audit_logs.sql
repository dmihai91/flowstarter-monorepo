-- Security Audit Logs Table
-- Privacy-conscious: No PII stored (no IP, no user agent, no email)
-- User hash is a one-way SHA-256 hash for correlation without identification

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Anonymized user reference (SHA-256 hash, not reversible)
  user_hash TEXT,
  
  -- Non-sensitive context
  provider TEXT,           -- OAuth provider name
  resource_type TEXT,      -- project, integration, etc.
  route TEXT,              -- API route that triggered event
  error_code TEXT,         -- Error code (not message)
  method TEXT,             -- HTTP method
  success BOOLEAN,         -- Operation success/failure
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS security_audit_logs_event_idx 
  ON security_audit_logs (event, created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_logs_severity_idx 
  ON security_audit_logs (severity, created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_logs_user_hash_idx 
  ON security_audit_logs (user_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_logs_created_at_idx 
  ON security_audit_logs (created_at DESC);

-- Composite index for common security queries
CREATE INDEX IF NOT EXISTS security_audit_logs_security_events_idx 
  ON security_audit_logs (severity, event, created_at DESC)
  WHERE severity IN ('error', 'critical');

-- RLS: Only service role can write (for audit integrity)
-- No user-level read access (admin only via service role)
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- No policies = no access via anon/authenticated roles
-- Access only via service role (bypasses RLS)

-- Optional: Add a retention policy comment
COMMENT ON TABLE security_audit_logs IS 
  'Privacy-conscious security audit logs. No PII stored. Access via service role only. Consider implementing retention policy (e.g., 90 days).';

-- Optional: Function to clean old logs (call via cron job)
CREATE OR REPLACE FUNCTION cleanup_old_security_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

