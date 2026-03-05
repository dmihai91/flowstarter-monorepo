/**
 * LogStore — Domain-specific logging methods.
 *
 * Infrastructure (storage, lazy-loading, CRUD) lives in BaseLogStore (log-store-core.ts).
 * Types live in log-types.ts.
 */

import { BaseLogStore } from './log-store-core';
import type { LogEntry, LogDetails } from './log-types';

export type { LogEntry, LogDetails } from './log-types';
export { MAX_LOGS } from './log-types';

class LogStore extends BaseLogStore {
  // System / provider / user
  logSystem(message: string, details?: Record<string, unknown>) { return this._addLog(message, 'info', 'system', details); }
  logProvider(message: string, details?: Record<string, unknown>) { return this._addLog(message, 'info', 'provider', details); }
  logUserAction(message: string, details?: Record<string, unknown>) { return this._addLog(message, 'info', 'user', details); }
  logWarning(message: string, details?: Record<string, unknown>) { return this._addLog(message, 'warning', 'system', details); }
  logDebug(message: string, details?: Record<string, unknown>) { return this._addLog(message, 'debug', 'system', details); }
  logInfo(message: string, details: LogDetails) { return this._addLog(message, 'info', 'system', details); }
  logSuccess(message: string, details: LogDetails) { return this._addLog(message, 'info', 'system', { ...details, success: true }); }

  // API
  logAPIRequest(endpoint: string, method: string, duration: number, statusCode: number, details?: Record<string, unknown>) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warning' : 'info';
    return this._addLog(`${method} ${endpoint} - ${statusCode} (${duration}ms)`, level, 'api', {
      ...details, endpoint, method, duration, statusCode, timestamp: new Date().toISOString(),
    });
  }

  logApiCall(method: string, endpoint: string, statusCode: number, duration: number, requestData?: unknown, responseData?: unknown) {
    return this._addLog(`API ${method} ${endpoint}`, statusCode >= 400 ? 'error' : 'info', 'api',
      { method, endpoint, statusCode, duration, request: requestData, response: responseData },
      { component: 'api', action: method });
  }

  logApiRequest(method: string, url: string, details: { method: string; url: string; statusCode: number; duration: number; request: unknown; response: unknown }) {
    return this._addApiLog(`API ${method} ${url}`, method, url, details);
  }

  // Auth
  logAuth(action: 'login' | 'logout' | 'token_refresh' | 'key_validation', success: boolean, details?: Record<string, unknown>) {
    return this._addLog(`Auth ${action} - ${success ? 'Success' : 'Failed'}`, success ? 'info' : 'error', 'auth', {
      ...details, action, success, timestamp: new Date().toISOString(),
    });
  }

  logAuthEvent(event: string, success: boolean, details?: Record<string, unknown>) {
    return this._addLog(`Auth ${event} ${success ? 'succeeded' : 'failed'}`, success ? 'info' : 'error', 'auth',
      details, { component: 'auth', action: event });
  }

  // Network
  logNetworkStatus(status: 'online' | 'offline' | 'reconnecting' | 'connected', details?: Record<string, unknown>) {
    const level = status === 'offline' ? 'error' : status === 'reconnecting' ? 'warning' : 'info';
    return this._addLog(`Network ${status}`, level, 'network', { ...details, status, timestamp: new Date().toISOString() });
  }

  logNetworkRequest(method: string, url: string, statusCode: number, duration: number, requestData?: unknown, responseData?: unknown) {
    return this._addLog(`${method} ${url}`, statusCode >= 400 ? 'error' : 'info', 'network',
      { method, url, statusCode, duration, request: requestData, response: responseData },
      { component: 'network', action: method });
  }

  // Database
  logDatabase(operation: string, success: boolean, duration: number, details?: Record<string, unknown>) {
    return this._addLog(`DB ${operation} - ${success ? 'Success' : 'Failed'} (${duration}ms)`, success ? 'info' : 'error', 'database', {
      ...details, operation, success, duration, timestamp: new Date().toISOString(),
    });
  }

  // Errors
  logError(message: string, error?: Error | unknown, details?: Record<string, unknown>) {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack, ...details }
      : { error, ...details };
    return this._addLog(message, 'error', 'error', errorDetails);
  }

  logErrorWithStack(error: Error, category: LogEntry['category'] = 'error', details?: Record<string, unknown>) {
    return this._addLog(error.message, 'error', category,
      { ...details, name: error.name, stack: error.stack },
      { component: category, action: 'error' });
  }

  // Performance
  logPerformance(operation: string, duration: number, details?: Record<string, unknown>) {
    return this._addLog(`Performance: ${operation}`, duration > 1000 ? 'warning' : 'info', 'performance',
      { operation, duration, ...details }, { component: 'performance', action: 'metric' });
  }

  logPerformanceMetric(component: string, operation: string, duration: number, details?: Record<string, unknown>) {
    return this._addLog(`Performance: ${component} - ${operation} took ${duration}ms`, duration > 1000 ? 'warning' : 'info', 'performance',
      { component, operation, duration, ...details }, { component, action: 'performance_metric' });
  }

  // Settings / features / tasks / providers
  logSettingsChange(component: string, setting: string, oldValue: unknown, newValue: unknown) {
    return this._addLog(`Settings changed in ${component}: ${setting}`, 'info', 'settings',
      { setting, previousValue: oldValue, newValue },
      { component, action: 'settings_change', previousValue: oldValue, newValue });
  }

  logFeatureToggle(featureId: string, enabled: boolean) {
    return this._addLog(`Feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`, 'info', 'feature',
      { featureId, enabled }, { component: 'features', action: 'feature_toggle' });
  }

  logTaskOperation(taskId: string, operation: string, status: string, details?: Record<string, unknown>) {
    return this._addLog(`Task ${taskId}: ${operation} - ${status}`, 'info', 'task',
      { taskId, operation, status, ...details }, { component: 'task-manager', action: 'task_operation' });
  }

  logProviderAction(provider: string, action: string, success: boolean, details?: Record<string, unknown>) {
    return this._addLog(`Provider ${provider}: ${action} - ${success ? 'Success' : 'Failed'}`, success ? 'info' : 'error', 'provider',
      { provider, action, success, ...details }, { component: 'providers', action: 'provider_action' });
  }
}

export const logStore = new LogStore();

