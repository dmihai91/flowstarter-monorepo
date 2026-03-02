import 'server-only';
/**
 * Security Audit Logging
 *
 * Privacy-conscious audit logging that avoids storing PII.
 * Logs security-relevant events for monitoring and incident response.
 * Persists to Supabase for querying and analysis.
 *
 * What we DON'T log:
 * - IP addresses
 * - User agents
 * - Email addresses
 * - Personally identifiable information
 *
 * What we DO log:
 * - Event type
 * - Anonymized user reference (hashed)
 * - Timestamp
 * - Non-sensitive metadata
 *
 * Note: This module is Edge Runtime compatible (uses Web Crypto API)
 */

import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

export type SecurityEventType =
  // Authentication events
  | 'auth.login_success'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.session_expired'
  // OAuth events
  | 'oauth.flow_started'
  | 'oauth.flow_completed'
  | 'oauth.flow_failed'
  | 'oauth.state_mismatch'
  | 'oauth.token_refreshed'
  | 'oauth.integration_revoked'
  // Resource events
  | 'project.created'
  | 'project.deleted'
  | 'integration.connected'
  | 'integration.disconnected'
  // Security events
  | 'security.rate_limited'
  | 'security.bot_blocked'
  | 'security.shield_blocked'
  | 'security.csrf_blocked'
  | 'security.unauthorized_access';

export type SecurityEventSeverity = 'info' | 'warning' | 'error' | 'critical';

interface AuditEntry {
  /** Event type */
  event: SecurityEventType;
  /** Severity level */
  severity: SecurityEventSeverity;
  /** Anonymized user identifier (SHA-256 hash, not reversible) */
  userHash: string | null;
  /** ISO timestamp */
  timestamp: string;
  /** Non-sensitive context */
  context?: {
    /** Provider name for OAuth events */
    provider?: string;
    /** Resource type (project, integration, etc.) */
    resourceType?: string;
    /** Route that triggered the event */
    route?: string;
    /** Error code (not message, to avoid leaking info) */
    errorCode?: string;
    /** Request method */
    method?: string;
    /** Success/failure boolean */
    success?: boolean;
  };
}

const SEVERITY_MAP: Record<SecurityEventType, SecurityEventSeverity> = {
  // Info - normal operations
  'auth.login_success': 'info',
  'auth.logout': 'info',
  'oauth.flow_started': 'info',
  'oauth.flow_completed': 'info',
  'oauth.token_refreshed': 'info',
  'project.created': 'info',
  'integration.connected': 'info',
  'integration.disconnected': 'info',
  'oauth.integration_revoked': 'info',

  // Warning - potential issues
  'auth.login_failed': 'warning',
  'auth.session_expired': 'warning',
  'oauth.flow_failed': 'warning',
  'security.rate_limited': 'warning',

  // Error - security concerns
  'oauth.state_mismatch': 'error',
  'security.bot_blocked': 'error',
  'security.shield_blocked': 'error',
  'security.csrf_blocked': 'error',

  // Critical - immediate attention needed
  'security.unauthorized_access': 'critical',
  'project.deleted': 'warning', // Destructive action
};

/**
 * Create an anonymized hash of the user ID using Web Crypto API.
 * This allows correlation of events for the same user
 * without storing the actual user ID.
 * (Edge Runtime compatible)
 */
async function anonymizeUserId(userId: string | null): Promise<string | null> {
  if (!userId) return null;

  // Use a salt from environment to prevent rainbow table attacks
  const salt = process.env.AUDIT_HASH_SALT || 'flowstarter-audit';
  const data = new TextEncoder().encode(`${salt}:${userId}`);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to hex string and take first 16 chars
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);

  return hashHex;
}

/**
 * Persist audit entry to Supabase
 */
async function persistToDatabase(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient();

    const { error } = await supabase.from('security_audit_logs').insert({
      event: entry.event,
      severity: entry.severity,
      user_hash: entry.userHash,
      provider: entry.context?.provider || null,
      resource_type: entry.context?.resourceType || null,
      route: entry.context?.route || null,
      error_code: entry.context?.errorCode || null,
      method: entry.context?.method || null,
      success: entry.context?.success ?? null,
    });

    if (error) {
      // Log error but don't throw - audit should not break the app
      console.error('[SECURITY_AUDIT] Database write failed:', error.message);
    }
  } catch (err) {
    // Fail silently - audit should never break the application
    console.error(
      '[SECURITY_AUDIT] Database error:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

/**
 * Log a security event
 *
 * @example
 * ```ts
 * await logSecurityEvent('oauth.flow_completed', userId, {
 *   provider: 'google-analytics',
 *   success: true,
 * });
 * ```
 */
export async function logSecurityEvent(
  event: SecurityEventType,
  userId: string | null,
  context?: AuditEntry['context']
): Promise<void> {
  const entry: AuditEntry = {
    event,
    severity: SEVERITY_MAP[event],
    userHash: await anonymizeUserId(userId),
    timestamp: new Date().toISOString(),
    context,
  };

  // Structured console logging for log aggregation services
  // Format: [SECURITY] severity=X event=Y userHash=Z ...
  const logParts = [
    `[SECURITY]`,
    `severity=${entry.severity}`,
    `event=${entry.event}`,
    entry.userHash ? `userHash=${entry.userHash}` : null,
    entry.context?.provider ? `provider=${entry.context.provider}` : null,
    entry.context?.resourceType
      ? `resourceType=${entry.context.resourceType}`
      : null,
    entry.context?.route ? `route=${entry.context.route}` : null,
    entry.context?.errorCode ? `errorCode=${entry.context.errorCode}` : null,
    entry.context?.success !== undefined
      ? `success=${entry.context.success}`
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  // Log to console based on severity
  switch (entry.severity) {
    case 'critical':
    case 'error':
      console.error(logParts);
      break;
    case 'warning':
      console.warn(logParts);
      break;
    default:
      console.info(logParts);
  }

  // Persist to Supabase (non-blocking)
  // Using void to not await - we don't want audit to slow down responses
  void persistToDatabase(entry);
}

/**
 * Log multiple events in batch (for high-throughput scenarios)
 */
export async function logSecurityEventBatch(
  events: Array<{
    event: SecurityEventType;
    userId: string | null;
    context?: AuditEntry['context'];
  }>
): Promise<void> {
  await Promise.all(
    events.map(({ event, userId, context }) =>
      logSecurityEvent(event, userId, context)
    )
  );
}

/**
 * Helper to create audit context for OAuth events
 */
export function oauthAuditContext(
  provider: string,
  success: boolean,
  errorCode?: string
): AuditEntry['context'] {
  return {
    provider,
    resourceType: 'oauth',
    success,
    ...(errorCode && { errorCode }),
  };
}

/**
 * Helper to create audit context for resource events
 */
export function resourceAuditContext(
  resourceType: string,
  route: string
): AuditEntry['context'] {
  return {
    resourceType,
    route,
  };
}
