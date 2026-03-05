import { atom, map } from 'nanostores';
import { PROVIDER_LIST } from '~/utils/constants';
import type { IProviderConfig } from '~/types/model';
import { toggleTheme } from './theme';

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlOrMetaKey?: boolean;
  action: () => void;
  description?: string; // Description of what the shortcut does
  isPreventDefault?: boolean; // Whether to prevent default browser behavior
}

export interface Shortcuts {
  toggleTheme: Shortcut;
  toggleTerminal: Shortcut;
}

// These arrays are kept for backwards compatibility but are empty since local providers were removed
export const URL_CONFIGURABLE_PROVIDERS: string[] = [];
export const LOCAL_PROVIDERS: string[] = [];

export type ProviderSetting = Record<string, IProviderConfig>;

// Simplified shortcuts store with only theme toggle
export const shortcutsStore = map<Shortcuts>({
  toggleTheme: {
    key: 'd',
    metaKey: true,
    altKey: true,
    shiftKey: true,
    action: () => toggleTheme(),
    description: 'Toggle theme',
    isPreventDefault: true,
  },
  toggleTerminal: {
    key: '`',
    ctrlOrMetaKey: true,
    action: () => {
      // This will be handled by the terminal component
    },
    description: 'Toggle terminal',
    isPreventDefault: true,
  },
});

// Create a single key for provider settings
const PROVIDER_SETTINGS_KEY = 'provider_settings';

// Add this helper function at the top of the file
const isBrowser = typeof window !== 'undefined';

/*
 * OPTIMIZATION: Get minimal default settings for immediate startup
 * Full localStorage settings are loaded lazily when first accessed
 */
const getDefaultProviderSettings = (): ProviderSetting => {
  const initialSettings: ProviderSetting = {};

  // Start with default settings only - localStorage loaded lazily
  PROVIDER_LIST.forEach((provider) => {
    initialSettings[provider.name] = {
      ...provider,
      settings: {
        // Local providers should be disabled by default
        enabled: !LOCAL_PROVIDERS.includes(provider.name),
      },
    };
  });

  return initialSettings;
};

// Track if we've loaded from localStorage
let providerSettingsLoaded = false;

// Lazily load saved provider settings from localStorage
const loadSavedProviderSettings = () => {
  if (providerSettingsLoaded || !isBrowser) {
    return;
  }

  providerSettingsLoaded = true;

  const savedSettings = localStorage.getItem(PROVIDER_SETTINGS_KEY);

  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      const currentSettings = providersStore.get();
      const updates: ProviderSetting = { ...currentSettings };

      Object.entries(parsed).forEach(([key, value]) => {
        if (updates[key]) {
          updates[key] = {
            ...updates[key],
            settings: (value as IProviderConfig).settings,
          };
        }
      });

      providersStore.set(updates);
    } catch (error) {
      console.error('Error parsing saved provider settings:', error);
    }
  }
};

// Initialize with defaults, localStorage loaded on first access
export const providersStore = map<ProviderSetting>(getDefaultProviderSettings());

// Schedule deferred loading of saved settings after initial render
if (isBrowser) {
  const scheduleLoad = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(callback);
    } else {
      setTimeout(callback, 100);
    }
  };

  scheduleLoad(loadSavedProviderSettings);
}

// Create a function to update provider settings that handles both store and persistence
export const updateProviderSettings = (provider: string, settings: ProviderSetting) => {
  // Ensure saved settings are loaded before updating
  loadSavedProviderSettings();

  const currentSettings = providersStore.get();

  // Create new provider config with updated settings
  const updatedProvider = {
    ...currentSettings[provider],
    settings: {
      ...currentSettings[provider].settings,
      ...settings,
    },
  };

  // Update the store with new settings
  providersStore.setKey(provider, updatedProvider);

  // Save to localStorage
  const allSettings = providersStore.get();
  localStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify(allSettings));
};

export const isDebugMode = atom(false);

// Define keys for localStorage
const SETTINGS_KEYS = {
  LATEST_BRANCH: 'isLatestBranch',
  AUTO_SELECT_TEMPLATE: 'autoSelectTemplate',
  CONTEXT_OPTIMIZATION: 'contextOptimizationEnabled',
  EVENT_LOGS: 'isEventLogsEnabled',
  PROMPT_ID: 'promptId',
  DEVELOPER_MODE: 'isDeveloperMode',
  DIFF_APPROVAL: 'diffApprovalEnabled',
  VISUAL_CONTEXT_INDICATOR: 'visualContextIndicatorEnabled',
} as const;

// Initialize settings from localStorage or defaults
const getInitialSettings = () => {
  const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
    if (!isBrowser) {
      return defaultValue;
    }

    const stored = localStorage.getItem(key);

    if (stored === null) {
      return defaultValue;
    }

    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  };

  return {
    latestBranch: getStoredBoolean(SETTINGS_KEYS.LATEST_BRANCH, false),
    autoSelectTemplate: getStoredBoolean(SETTINGS_KEYS.AUTO_SELECT_TEMPLATE, true),
    contextOptimization: getStoredBoolean(SETTINGS_KEYS.CONTEXT_OPTIMIZATION, true),
    eventLogs: getStoredBoolean(SETTINGS_KEYS.EVENT_LOGS, true),
    promptId: isBrowser ? localStorage.getItem(SETTINGS_KEYS.PROMPT_ID) || 'default' : 'default',
    developerMode: getStoredBoolean(SETTINGS_KEYS.DEVELOPER_MODE, false),
    diffApproval: getStoredBoolean(SETTINGS_KEYS.DIFF_APPROVAL, false),
    visualContextIndicator: getStoredBoolean(SETTINGS_KEYS.VISUAL_CONTEXT_INDICATOR, true),
  };
};

// Initialize stores with persisted values
const initialSettings = getInitialSettings();

export const latestBranchStore = atom<boolean>(initialSettings.latestBranch);
export const autoSelectStarterTemplate = atom<boolean>(initialSettings.autoSelectTemplate);
export const enableContextOptimizationStore = atom<boolean>(initialSettings.contextOptimization);
export const isEventLogsEnabled = atom<boolean>(initialSettings.eventLogs);
export const promptStore = atom<string>(initialSettings.promptId);
export const diffApprovalStore = atom<boolean>(initialSettings.diffApproval);
export const visualContextIndicatorStore = atom<boolean>(initialSettings.visualContextIndicator);

// Helper functions to update settings with persistence
export const updateLatestBranch = (enabled: boolean) => {
  latestBranchStore.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.LATEST_BRANCH, JSON.stringify(enabled));
};

export const updateAutoSelectTemplate = (enabled: boolean) => {
  autoSelectStarterTemplate.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.AUTO_SELECT_TEMPLATE, JSON.stringify(enabled));
};

export const updateContextOptimization = (enabled: boolean) => {
  enableContextOptimizationStore.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.CONTEXT_OPTIMIZATION, JSON.stringify(enabled));
};

export const updateEventLogs = (enabled: boolean) => {
  isEventLogsEnabled.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.EVENT_LOGS, JSON.stringify(enabled));
};

export const updatePromptId = (id: string) => {
  promptStore.set(id);
  localStorage.setItem(SETTINGS_KEYS.PROMPT_ID, id);
};

export const updateDiffApproval = (enabled: boolean) => {
  diffApprovalStore.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.DIFF_APPROVAL, JSON.stringify(enabled));
};

export const updateVisualContextIndicator = (enabled: boolean) => {
  visualContextIndicatorStore.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.VISUAL_CONTEXT_INDICATOR, JSON.stringify(enabled));
};

// Developer mode store with persistence
export const developerModeStore = atom<boolean>(initialSettings.developerMode);

export const setDeveloperMode = (value: boolean) => {
  developerModeStore.set(value);

  if (isBrowser) {
    localStorage.setItem(SETTINGS_KEYS.DEVELOPER_MODE, JSON.stringify(value));
  }
};

// Settings dialog state using nanostores
export const settingsIsOpen = atom<boolean>(false);
export const settingsSelectedTab = atom<string>('user');

// Helper functions for settings dialog
export const openSettings = () => {
  settingsIsOpen.set(true);
  settingsSelectedTab.set('user'); // Always open to user tab
};

export const closeSettings = () => {
  settingsIsOpen.set(false);
  settingsSelectedTab.set('user'); // Reset to user tab when closing
};

export const setSelectedTab = (tab: string) => {
  settingsSelectedTab.set(tab);
};

