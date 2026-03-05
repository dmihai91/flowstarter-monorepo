/**
 * Import Handlers
 *
 * Handles importing settings in both comprehensive (v2.0) and legacy formats.
 */

import Cookies from 'js-cookie';
import type { ExportedSettings } from './importExportService';

type SetItemFn = (key: string, value: unknown) => void;
type SetCookieFn = (key: string, value: unknown) => void;

/**
 * Import settings using the comprehensive v2.0 format
 */
export async function importComprehensiveFormat(
  data: Partial<ExportedSettings>,
  setItem: SetItemFn,
  setCookie: SetCookieFn,
): Promise<void> {
  if (data.core) {
    importEntries(data.core, setItem, 'core');
  }

  if (data.providers) {
    importProviderSettings(data.providers, setItem, setCookie);
  }

  if (data.features) {
    importEntries(data.features, setItem, 'feature');
  }

  if (data.ui) {
    importUISettings(data.ui, setItem, setCookie);
  }

  if (data.connections) {
    importConnectionSettings(data.connections, setItem);
  }

  if (data.debug) {
    importDebugSettings(data.debug, setItem, setCookie);
  }

  if (data.updates) {
    importUpdateSettings(data.updates, setItem);
  }

  if (data.chatSnapshots) {
    importEntries(data.chatSnapshots, setItem, 'chat snapshot');
  }
}

/**
 * Import settings using the legacy format
 */
export async function importLegacyFormat(
  data: Record<string, unknown>,
  setItem: SetItemFn,
  setCookie: SetCookieFn,
): Promise<void> {
  const cookieKeys = new Set([
    'apiKeys', 'selectedModel', 'selectedProvider', 'providers',
    'tabConfiguration', 'cachedPrompt', 'isDebugEnabled', 'eventLogs',
  ]);

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (key === 'exportDate' || key === 'version' || key === 'appVersion') return;

    try {
      if (cookieKeys.has(key)) {
        setCookie(key, value);
      } else {
        setItem(key, value);
      }
    } catch (err) {
      console.error(`Error importing legacy setting ${key}:`, err);
    }
  });
}

function importEntries(
  entries: Record<string, unknown>,
  setItem: SetItemFn,
  label: string,
): void {
  Object.entries(entries).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      try {
        setItem(key, value);
      } catch (err) {
        console.error(`Error importing ${label} setting ${key}:`, err);
      }
    }
  });
}

function importProviderSettings(
  providers: Record<string, unknown>,
  setItem: SetItemFn,
  setCookie: SetCookieFn,
): void {
  if (providers.provider_settings) {
    try { setItem('provider_settings', providers.provider_settings); }
    catch (err) { console.error('Error importing provider settings:', err); }
  }

  const providerCookies = ['apiKeys', 'selectedModel', 'selectedProvider', 'providers'] as const;
  providerCookies.forEach((key) => {
    if (providers[key]) {
      try { setCookie(key, providers[key]); }
      catch (err) { console.error(`Error importing provider cookie ${key}:`, err); }
    }
  });
}

function importUISettings(
  ui: Record<string, unknown>,
  setItem: SetItemFn,
  setCookie: SetCookieFn,
): void {
  if (ui.Flowstarter_tab_configuration) {
    try { setItem('Flowstarter_tab_configuration', ui.Flowstarter_tab_configuration); }
    catch (err) { console.error('Error importing tab configuration:', err); }
  }

  if (ui.promptId) {
    try { setItem('promptId', ui.promptId); }
    catch (err) { console.error('Error importing prompt ID:', err); }
  }

  const uiCookies = ['tabConfiguration', 'cachedPrompt'] as const;
  uiCookies.forEach((key) => {
    if (ui[key]) {
      try { setCookie(key, ui[key]); }
      catch (err) { console.error(`Error importing UI cookie ${key}:`, err); }
    }
  });
}

function importConnectionSettings(connections: Record<string, unknown>, setItem: SetItemFn): void {
  if (connections.netlify_connection) {
    try { setItem('netlify_connection', connections.netlify_connection); }
    catch (err) { console.error('Error importing Netlify connection:', err); }
  }

  Object.entries(connections).forEach(([key, value]) => {
    if (key.startsWith('github_') && value !== null && value !== undefined) {
      try { setItem(key, value); }
      catch (err) { console.error(`Error importing GitHub connection ${key}:`, err); }
    }
  });
}

function importDebugSettings(
  debug: Record<string, unknown>,
  setItem: SetItemFn,
  setCookie: SetCookieFn,
): void {
  const debugLocalStorageKeys = [
    'Flowstarter_acknowledged_debug_issues',
    'Flowstarter_acknowledged_connection_issue',
    'error_logs',
    'Flowstarter_read_logs',
  ] as const;

  debugLocalStorageKeys.forEach((key) => {
    if (debug[key] !== null && debug[key] !== undefined) {
      try { setItem(key, debug[key]); }
      catch (err) { console.error(`Error importing debug setting ${key}:`, err); }
    }
  });

  const debugCookies = ['isDebugEnabled', 'eventLogs'] as const;
  debugCookies.forEach((key) => {
    if (debug[key]) {
      try { setCookie(key, debug[key]); }
      catch (err) { console.error(`Error importing debug cookie ${key}:`, err); }
    }
  });
}

function importUpdateSettings(updates: Record<string, unknown>, setItem: SetItemFn): void {
  if (updates.update_settings) {
    try { setItem('update_settings', updates.update_settings); }
    catch (err) { console.error('Error importing update settings:', err); }
  }

  if (updates.last_acknowledged_update) {
    try { setItem('Flowstarter_last_acknowledged_version', updates.last_acknowledged_update); }
    catch (err) { console.error('Error importing last acknowledged update:', err); }
  }
}
