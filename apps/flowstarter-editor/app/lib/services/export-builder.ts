/**
 * Export Settings Builder
 *
 * Builds the comprehensive settings export object by reading
 * from localStorage and cookies.
 */

import Cookies from 'js-cookie';
import type { ExportedSettings } from './importExportService';

function safeGetItem(key: string): unknown {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (err) {
    console.error(`Error getting localStorage item ${key}:`, err);
    return null;
  }
}

function getAllLocalStorage(): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key) {
        try {
          const value = localStorage.getItem(key);
          result[key] = value ? JSON.parse(value) : null;
        } catch {
          result[key] = null;
        }
      }
    }
  } catch (err) {
    console.error('Error getting all localStorage items:', err);
  }

  return result;
}

function getGitHubConnections(): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const localStorageKeys = Object.keys(localStorage).filter((key) => key.startsWith('github_'));
  localStorageKeys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      result[key] = value ? JSON.parse(value) : null;
    } catch (err) {
      console.error(`Error getting GitHub connection ${key}:`, err);
      result[key] = null;
    }
  });

  return result;
}

function getChatSnapshots(): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const snapshotKeys = Object.keys(localStorage).filter((key) => key.startsWith('snapshot:'));
  snapshotKeys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      result[key] = value ? JSON.parse(value) : null;
    } catch (err) {
      console.error(`Error getting chat snapshot ${key}:`, err);
      result[key] = null;
    }
  });

  return result;
}

/**
 * Build the comprehensive settings export object
 */
export async function buildExportSettings(): Promise<ExportedSettings> {
  const allCookies = Cookies.get();

  return {
    core: {
      Flowstarter_user_profile: safeGetItem('Flowstarter_user_profile'),
      Flowstarter_settings: safeGetItem('Flowstarter_settings'),
      Flowstarter_profile: safeGetItem('Flowstarter_profile'),
      theme: safeGetItem('theme'),
    },
    providers: {
      provider_settings: safeGetItem('provider_settings'),
      apiKeys: allCookies.apiKeys,
      selectedModel: allCookies.selectedModel,
      selectedProvider: allCookies.selectedProvider,
      providers: allCookies.providers,
    },
    features: {
      viewed_features: safeGetItem('Flowstarter_viewed_features'),
      developer_mode: safeGetItem('Flowstarter_developer_mode'),
      contextOptimizationEnabled: safeGetItem('contextOptimizationEnabled'),
      autoSelectTemplate: safeGetItem('autoSelectTemplate'),
      isLatestBranch: safeGetItem('isLatestBranch'),
      isEventLogsEnabled: safeGetItem('isEventLogsEnabled'),
      energySaverMode: safeGetItem('energySaverMode'),
      autoEnergySaver: safeGetItem('autoEnergySaver'),
    },
    ui: {
      Flowstarter_tab_configuration: safeGetItem('Flowstarter_tab_configuration'),
      tabConfiguration: allCookies.tabConfiguration,
      promptId: safeGetItem('promptId'),
      cachedPrompt: allCookies.cachedPrompt,
    },
    connections: {
      netlify_connection: safeGetItem('netlify_connection'),
      ...getGitHubConnections(),
    },
    debug: {
      isDebugEnabled: allCookies.isDebugEnabled,
      acknowledged_debug_issues: safeGetItem('Flowstarter_acknowledged_debug_issues'),
      acknowledged_connection_issue: safeGetItem('Flowstarter_acknowledged_connection_issue'),
      error_logs: safeGetItem('error_logs'),
      Flowstarter_read_logs: safeGetItem('Flowstarter_read_logs'),
      eventLogs: allCookies.eventLogs,
    },
    updates: {
      update_settings: safeGetItem('update_settings'),
      last_acknowledged_update: safeGetItem('Flowstarter_last_acknowledged_version'),
    },
    chatSnapshots: getChatSnapshots(),
    _raw: {
      localStorage: getAllLocalStorage(),
      cookies: allCookies,
    },
    _meta: {
      exportDate: new Date().toISOString(),
      version: '2.0',
      appVersion: process.env.NEXT_PUBLIC_VERSION || 'unknown',
    },
  };
}
