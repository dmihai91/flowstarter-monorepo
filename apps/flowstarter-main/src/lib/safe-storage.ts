'use client';

/**
 * Safe localStorage access that works in SSR environments.
 * Checks both window existence AND localStorage functionality.
 */

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (!window.localStorage) return false;
    // Check that localStorage has the required methods (Node.js 22+ has localStorage but without methods)
    if (typeof window.localStorage.getItem !== 'function') return false;
    if (typeof window.localStorage.setItem !== 'function') return false;
    // Test that localStorage actually works
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Silently fail
  }
}

export function safeRemoveItem(key: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

// For sessionStorage
function isSessionStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (!window.sessionStorage) return false;
    // Check that sessionStorage has the required methods (Node.js 22+ has sessionStorage but without methods)
    if (typeof window.sessionStorage.getItem !== 'function') return false;
    if (typeof window.sessionStorage.setItem !== 'function') return false;
    const testKey = '__storage_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionGetItem(key: string): string | null {
  if (!isSessionStorageAvailable()) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSetItem(key: string, value: string): void {
  if (!isSessionStorageAvailable()) return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Silently fail
  }
}

/**
 * Create a zustand-compatible storage object that works safely in SSR
 */
export const safeSessionStorage = {
  getItem: (name: string): string | null => {
    return safeSessionGetItem(name);
  },
  setItem: (name: string, value: string): void => {
    safeSessionSetItem(name, value);
  },
  removeItem: (name: string): void => {
    if (!isSessionStorageAvailable()) return;
    try {
      window.sessionStorage.removeItem(name);
    } catch {
      // Silently fail
    }
  },
};
