-- Remove PII columns from ai_audit_logs
-- This migration removes personally identifiable information storage
-- to comply with privacy best practices.
--
-- The user_id column now stores an anonymized hash instead of actual user IDs.
-- IP, user_agent, and username columns are deprecated and will store NULL.

-- Add comment to document the privacy change
COMMENT ON TABLE ai_audit_logs IS 
  'AI operation audit logs. Privacy update: user_id now stores anonymized hash. IP, user_agent, username are deprecated (always NULL).';

COMMENT ON COLUMN ai_audit_logs.user_id IS 
  'Anonymized user hash (SHA-256, first 16 chars). Not reversible to actual user ID.';

COMMENT ON COLUMN ai_audit_logs.ip IS 
  'DEPRECATED: No longer collected for privacy. Always NULL for new records.';

COMMENT ON COLUMN ai_audit_logs.user_agent IS 
  'DEPRECATED: No longer collected for privacy. Always NULL for new records.';

COMMENT ON COLUMN ai_audit_logs.username IS 
  'DEPRECATED: No longer collected for privacy. Always NULL for new records.';

-- Optional: Clear existing PII data (uncomment if you want to retroactively remove PII)
-- WARNING: This is destructive and cannot be undone
-- UPDATE ai_audit_logs SET ip = NULL, user_agent = NULL, username = NULL;

-- Optional: Drop the columns entirely (uncomment after confirming no dependencies)
-- ALTER TABLE ai_audit_logs DROP COLUMN IF EXISTS ip;
-- ALTER TABLE ai_audit_logs DROP COLUMN IF EXISTS user_agent;
-- ALTER TABLE ai_audit_logs DROP COLUMN IF EXISTS username;

