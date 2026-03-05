import Cookies from 'js-cookie';
import { importComprehensiveFormat, importLegacyFormat } from './import-handlers';
import { buildExportSettings } from './export-builder';

export interface ExportedSettings {
  core: Record<string, unknown>;
  providers: Record<string, unknown>;
  features: Record<string, unknown>;
  ui: Record<string, unknown>;
  connections: Record<string, unknown>;
  debug: Record<string, unknown>;
  updates: Record<string, unknown>;
  chatSnapshots: Record<string, unknown>;
  _raw: {
    localStorage: Record<string, unknown>;
    cookies: Record<string, string>;
  };
  _meta: {
    exportDate: string;
    version: string;
    appVersion: string;
  };
}

export class ImportExportService {
  static async exportSettings(): Promise<ExportedSettings> {
    try {
      return await buildExportSettings();
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  static async importSettings(importedData: Partial<ExportedSettings> & Record<string, unknown>): Promise<void> {
    // Check if this is the new comprehensive format (v2.0)
    const isNewFormat = importedData._meta?.version === '2.0';

    const setItem = this._safeSetItem.bind(this);
    const setCookie = this._safeSetCookie.bind(this);

    if (isNewFormat) {
      await importComprehensiveFormat(importedData, setItem, setCookie);
    } else {
      await importLegacyFormat(importedData, setItem, setCookie);
    }
  }

  static importAPIKeys(keys: Record<string, unknown>): Record<string, string> {
    // Get existing keys from cookies
    const existingKeys = (() => {
      const storedApiKeys = Cookies.get('apiKeys');
      return storedApiKeys ? JSON.parse(storedApiKeys) : {};
    })();

    // Validate and save each key
    const newKeys = { ...existingKeys };
    Object.entries(keys).forEach(([key, value]) => {
      // Skip comment fields
      if (key.startsWith('_')) {
        return;
      }

      // Skip base URL fields (they should be set in .env.local)
      if (key.includes('_API_BASE_URL')) {
        return;
      }

      if (typeof value !== 'string') {
        throw new Error(`Invalid value for key: ${key}`);
      }

      // Handle both old and new template formats
      let normalizedKey = key;

      // Check if this is the old format (e.g., "Anthropic_API_KEY")
      if (key.includes('_API_KEY')) {
        // Extract the provider name from the old format
        normalizedKey = key.replace('_API_KEY', '');
      }

      if (value) {
        newKeys[normalizedKey] = value;
      }
    });

    return newKeys;
  }

  static createAPIKeysTemplate(): Record<string, string> {
    const template = {
      Anthropic: '',
      OpenAI: '',
      Google: '',
      Groq: '',
      HuggingFace: '',
      OpenRouter: '',
      Deepseek: '',
      Mistral: '',
      OpenAILike: '',
      Together: '',
      xAI: '',
      Perplexity: '',
      AzureOpenAI: '',
    };

    // Add a comment to explain the format
    return {
      _comment:
        "Fill in your API keys for each provider. Keys will be stored with the provider name (e.g., 'OpenAI'). The application also supports the older format with keys like 'OpenAI_API_KEY' for backward compatibility.",
      ...template,
    };
  }

  static async resetAllSettings(): Promise<void> {
    // 1. Clear all localStorage items related to application settings
    const localStorageKeysToPreserve: string[] = ['debug_mode'];

    // Get all localStorage keys
    const allLocalStorageKeys = Object.keys(localStorage);

    // Clear all localStorage items except those to preserve
    allLocalStorageKeys.forEach((key) => {
      if (!localStorageKeysToPreserve.includes(key)) {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error(`Error removing localStorage item ${key}:`, err);
        }
      }
    });

    // 2. Clear all cookies related to application settings
    const cookiesToPreserve: string[] = [];

    // Get all cookies
    const allCookies = Cookies.get();
    const cookieKeys = Object.keys(allCookies);

    // Clear all cookies except those to preserve
    cookieKeys.forEach((key) => {
      if (!cookiesToPreserve.includes(key)) {
        try {
          Cookies.remove(key);
        } catch (err) {
          console.error(`Error removing cookie ${key}:`, err);
        }
      }
    });

    // 3. Clear any chat snapshots from localStorage
    const snapshotKeys = Object.keys(localStorage).filter((key) => key.startsWith('snapshot:'));
    snapshotKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.error(`Error removing snapshot ${key}:`, err);
      }
    });
  }

  private static _safeSetItem(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error setting localStorage item ${key}:`, err);
    }
  }

  private static _safeSetCookie(key: string, value: unknown): void {
    try {
      Cookies.set(key, typeof value === 'string' ? value : JSON.stringify(value), { expires: 365 });
    } catch (err) {
      console.error(`Error setting cookie ${key}:`, err);
    }
  }
}

