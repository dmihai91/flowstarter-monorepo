/**
 * Previews Store
 *
 * In Daytona mode, previews are managed through the Daytona cloud sandbox.
 * The workbench store handles the Daytona preview URL via setDaytonaPreview().
 * This store provides compatibility for legacy code that may reference previews.
 */

import { atom } from 'nanostores';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    _tabId?: string;
  }
}

export interface PreviewInfo {
  port: number;
  ready: boolean;
  baseUrl: string;
}

// Create a broadcast channel for preview updates
const PREVIEW_CHANNEL = 'preview-updates';

export class PreviewsStore {
  #availablePreviews = new Map<number, PreviewInfo>();
  #broadcastChannel: BroadcastChannel | null = null;
  #lastUpdate = new Map<string, number>();
  #refreshTimeouts = new Map<string, NodeJS.Timeout>();
  #REFRESH_DELAY = 300;
  #storageChannel: BroadcastChannel | null = null;

  previews = atom<PreviewInfo[]>([]);

  constructor() {
    // Only initialize broadcast channels in browser
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      this.#broadcastChannel = new BroadcastChannel(PREVIEW_CHANNEL);
      this.#storageChannel = new BroadcastChannel('storage-sync-channel');

      // Listen for preview updates from other tabs
      this.#broadcastChannel.onmessage = (event) => {
        const { type, previewId } = event.data;

        if (type === 'file-change') {
          const timestamp = event.data.timestamp;
          const lastUpdate = this.#lastUpdate.get(previewId) || 0;

          if (timestamp > lastUpdate) {
            this.#lastUpdate.set(previewId, timestamp);
            this.refreshPreview(previewId);
          }
        }
      };

      // Listen for storage sync messages
      this.#storageChannel.onmessage = (event) => {
        const { storage, source } = event.data;

        if (storage && source !== this._getTabId()) {
          this._syncStorage(storage);
        }
      };

      // Override localStorage setItem to catch all changes
      const originalSetItem = localStorage.setItem;

      localStorage.setItem = (...args) => {
        originalSetItem.apply(localStorage, args);
        this._broadcastStorageSync();
      };
    }

    // In Daytona mode, previews are managed externally
    console.log('[PreviewsStore] Daytona mode - previews managed via Daytona sandbox');
  }

  // Generate a unique ID for this tab
  private _getTabId(): string {
    if (typeof window !== 'undefined') {
      if (!window._tabId) {
        window._tabId = Math.random().toString(36).substring(2, 15);
      }

      return window._tabId;
    }

    return '';
  }

  // Sync storage data between tabs
  private _syncStorage(storage: Record<string, string>) {
    if (typeof window !== 'undefined') {
      Object.entries(storage).forEach(([key, value]) => {
        try {
          const originalSetItem = Object.getPrototypeOf(localStorage).setItem;
          originalSetItem.call(localStorage, key, value);
        } catch (error) {
          console.error('[Preview] Error syncing storage:', error);
        }
      });

      // Force a refresh after syncing storage
      const previews = this.previews.get();
      previews.forEach((preview) => {
        const previewId = this.getPreviewId(preview.baseUrl);

        if (previewId) {
          this.refreshPreview(previewId);
        }
      });

      // Reload the page content
      if (typeof window !== 'undefined' && window.location) {
        const iframe = document.querySelector('iframe');

        if (iframe) {
          iframe.src = iframe.src;
        }
      }
    }
  }

  // Broadcast storage state to other tabs
  private _broadcastStorageSync() {
    if (typeof window !== 'undefined' && this.#storageChannel) {
      const storage: Record<string, string> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key) {
          storage[key] = localStorage.getItem(key) || '';
        }
      }

      this.#storageChannel.postMessage({
        type: 'storage-sync',
        storage,
        source: this._getTabId(),
        timestamp: Date.now(),
      });
    }
  }

  // Helper to extract preview ID from URL
  getPreviewId(url: string): string | null {
    // Daytona URL format
    const daytonaMatch = url.match(/sandbox-([a-zA-Z0-9]+)/);
    return daytonaMatch ? daytonaMatch[1] : null;
  }

  // Broadcast state change to all tabs
  broadcastStateChange(previewId: string) {
    const timestamp = Date.now();
    this.#lastUpdate.set(previewId, timestamp);

    if (this.#broadcastChannel) {
      this.#broadcastChannel.postMessage({
        type: 'state-change',
        previewId,
        timestamp,
      });
    }
  }

  // Broadcast file change to all tabs
  broadcastFileChange(previewId: string) {
    const timestamp = Date.now();
    this.#lastUpdate.set(previewId, timestamp);

    if (this.#broadcastChannel) {
      this.#broadcastChannel.postMessage({
        type: 'file-change',
        previewId,
        timestamp,
      });
    }
  }

  // Broadcast update to all tabs
  broadcastUpdate(url: string) {
    const previewId = this.getPreviewId(url);

    if (previewId) {
      const timestamp = Date.now();
      this.#lastUpdate.set(previewId, timestamp);

      if (this.#broadcastChannel) {
        this.#broadcastChannel.postMessage({
          type: 'file-change',
          previewId,
          timestamp,
        });
      }
    }
  }

  // Method to refresh a specific preview
  refreshPreview(previewId: string) {
    // Clear any pending refresh for this preview
    const existingTimeout = this.#refreshTimeouts.get(previewId);

    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set a new timeout for this refresh
    const timeout = setTimeout(() => {
      const previews = this.previews.get();
      const preview = previews.find((p) => this.getPreviewId(p.baseUrl) === previewId);

      if (preview) {
        preview.ready = false;
        this.previews.set([...previews]);

        requestAnimationFrame(() => {
          preview.ready = true;
          this.previews.set([...previews]);
        });
      }

      this.#refreshTimeouts.delete(previewId);
    }, this.#REFRESH_DELAY);

    this.#refreshTimeouts.set(previewId, timeout);
  }

  updateUrl(port: number, url: string) {
    const previews = this.previews.get();
    const preview = previews.find((p) => p.port === port);

    if (preview) {
      preview.baseUrl = url;
      this.previews.set([...previews]);
      this.broadcastUpdate(url);
    }
  }

  refreshAllPreviews() {
    const previews = this.previews.get();

    for (const preview of previews) {
      const previewId = this.getPreviewId(preview.baseUrl);

      if (previewId) {
        this.broadcastFileChange(previewId);
      }
    }
  }
}

// Create a singleton instance
let previewsStore: PreviewsStore | null = null;

export function usePreviewStore() {
  if (!previewsStore) {
    previewsStore = new PreviewsStore();
  }

  return previewsStore;
}

