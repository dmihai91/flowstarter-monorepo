/**
 * Lightweight logger utility
 *
 * Controls logging verbosity across the application.
 * Set LOG_LEVEL env var to control output:
 * - 'debug': All logs
 * - 'info': Info, warn, error (default for dev)
 * - 'warn': Warn and error only
 * - 'error': Errors only
 * - 'none': No logs (production default)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

// Default to 'info' in dev, 'error' in production
const DEFAULT_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'error' : 'info';
const currentLevel = (process.env.LOG_LEVEL as LogLevel) || DEFAULT_LEVEL;
const levelValue = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.info;

/**
 * Sanitize data to prevent sensitive info leakage
 */
function sanitize(data: unknown): unknown {
  if (typeof data === 'string') {
    // Mask API keys, tokens, passwords
    return data
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/api[_-]?key[=:]\s*["']?[A-Za-z0-9._-]+/gi, 'apiKey=[REDACTED]')
      .replace(/password[=:]\s*["']?[^"'\s]+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*["']?[A-Za-z0-9._-]+/gi, 'token=[REDACTED]');
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Redact sensitive keys entirely
      if (/key|token|password|secret|credential|auth/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value);
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string) {
  const prefix = `[${namespace}]`;

  return {
    debug: (...args: unknown[]) => {
      if (levelValue <= LOG_LEVELS.debug) {
        console.log(prefix, ...args.map(sanitize));
      }
    },

    info: (...args: unknown[]) => {
      if (levelValue <= LOG_LEVELS.info) {
        console.log(prefix, ...args.map(sanitize));
      }
    },

    warn: (...args: unknown[]) => {
      if (levelValue <= LOG_LEVELS.warn) {
        console.warn(prefix, ...args.map(sanitize));
      }
    },

    error: (...args: unknown[]) => {
      if (levelValue <= LOG_LEVELS.error) {
        console.error(prefix, ...args.map(sanitize));
      }
    },
  };
}

// Pre-built loggers for common namespaces
export const daytonaLog = createLogger('Daytona');
export const convexLog = createLogger('Convex');
export const agentLog = createLogger('Agent');
export const buildLog = createLogger('Build');

