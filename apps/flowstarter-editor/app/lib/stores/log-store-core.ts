/**
 * LogStore Core Infrastructure
 *
 * Base class with storage, lazy loading, and basic CRUD operations.
 * Extended by LogStore with domain-specific logging methods.
 */

import { atom, map } from 'nanostores';
import Cookies from 'js-cookie';
import { createScopedLogger } from '~/utils/logger';
import type { LogEntry } from './log-types';
import { MAX_LOGS } from './log-types';

const logger = createScopedLogger('LogStore');

export class BaseLogStore {
  protected _logs = map<Record<string, LogEntry>>({});
  showLogs = atom(true);
  protected _readLogs = new Set<string>();
  protected _logsLoaded = false;
  protected _readLogsLoaded = false;

  constructor() {
    /* Defer loading logs until first access for startup performance */
  }

  protected _ensureLogsLoaded() {
    if (this._logsLoaded) return;
    this._logsLoaded = true;
    this._loadLogs();
  }

  protected _ensureReadLogsLoaded() {
    if (this._readLogsLoaded) return;
    this._readLogsLoaded = true;
    if (typeof window !== 'undefined') {
      this._loadReadLogs();
    }
  }

  get logs() {
    this._ensureLogsLoaded();
    return this._logs;
  }

  private _loadLogs() {
    const savedLogs = Cookies.get('eventLogs');
    if (savedLogs) {
      try {
        this._logs.set(JSON.parse(savedLogs));
      } catch (error) {
        logger.error('Failed to parse logs from cookies:', error);
      }
    }
  }

  private _loadReadLogs() {
    if (typeof window === 'undefined') return;
    const savedReadLogs = localStorage.getItem('flowstarter_read_logs');
    if (savedReadLogs) {
      try {
        this._readLogs = new Set(JSON.parse(savedReadLogs));
      } catch (error) {
        logger.error('Failed to parse read logs:', error);
      }
    }
  }

  protected _saveLogs() {
    Cookies.set('eventLogs', JSON.stringify(this._logs.get()));
  }

  protected _saveReadLogs() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('flowstarter_read_logs', JSON.stringify(Array.from(this._readLogs)));
  }

  protected _generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected _trimLogs() {
    const currentLogs = Object.entries(this._logs.get());
    if (currentLogs.length > MAX_LOGS) {
      const sortedLogs = currentLogs.sort(
        ([, a], [, b]) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      this._logs.set(Object.fromEntries(sortedLogs.slice(0, MAX_LOGS)));
    }
  }

  protected _addLog(
    message: string,
    level: LogEntry['level'],
    category: LogEntry['category'],
    details?: Record<string, unknown>,
    metadata?: LogEntry['metadata'],
  ) {
    const id = this._generateId();
    const entry: LogEntry = { id, timestamp: new Date().toISOString(), level, message, details, category, metadata };
    this._logs.setKey(id, entry);
    this._trimLogs();
    this._saveLogs();
    return id;
  }

  protected _addApiLog(
    message: string,
    method: string,
    url: string,
    details: { method: string; url: string; statusCode: number; duration: number; request: unknown; response: unknown },
  ) {
    return this._addLog(message, details.statusCode >= 400 ? 'error' : 'info', 'api', details, {
      component: 'api', action: method,
    });
  }

  // Basic CRUD
  clearLogs() { this._logs.set({}); this._saveLogs(); }

  getLogs() {
    this._ensureLogsLoaded();
    return Object.values(this._logs.get()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  getFilteredLogs(level?: LogEntry['level'], category?: LogEntry['category'], searchQuery?: string) {
    return this.getLogs().filter((log) => {
      const matchesLevel = !level || level === 'debug' || log.level === level;
      const matchesCategory = !category || log.category === category;
      const matchesSearch = !searchQuery ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesCategory && matchesSearch;
    });
  }

  markAsRead(logId: string) { this._ensureReadLogsLoaded(); this._readLogs.add(logId); this._saveReadLogs(); }
  isRead(logId: string): boolean { this._ensureReadLogsLoaded(); return this._readLogs.has(logId); }
  clearReadLogs() { this._readLogs.clear(); this._saveReadLogs(); }
  refreshLogs() { this._logs.set({ ...this._logs.get() }); }
}
