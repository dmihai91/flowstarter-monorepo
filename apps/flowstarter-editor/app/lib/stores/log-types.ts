/**
 * Log Store Type Definitions
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: Record<string, unknown>;
  category:
    | 'system'
    | 'provider'
    | 'user'
    | 'error'
    | 'api'
    | 'auth'
    | 'database'
    | 'network'
    | 'performance'
    | 'settings'
    | 'task'
    | 'update'
    | 'feature';
  subCategory?: string;
  duration?: number;
  statusCode?: number;
  source?: string;
  stack?: string;
  metadata?: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId?: string;
    previousValue?: unknown;
    newValue?: unknown;
  };
}

export interface LogDetails extends Record<string, unknown> {
  type: string;
  message: string;
}

export const MAX_LOGS = 1000;
