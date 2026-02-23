/**
 * Polyfill localStorage and sessionStorage for Node.js 22+ environments.
 * Node.js 22+ exposes localStorage/sessionStorage as globals but they're empty objects
 * without the required Web Storage API methods.
 * 
 * This polyfill provides no-op implementations to prevent errors during SSR.
 */

// Simple in-memory storage for SSR (not persisted, just prevents errors)
class NoopStorage implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  // Allow array-like access
  [name: string]: unknown;
}

// Only polyfill in Node.js environment (not in browser)
if (typeof window === 'undefined') {
  // Check if localStorage exists but doesn't have proper methods
  const globalObj = globalThis as unknown as { localStorage?: Storage; sessionStorage?: Storage };
  
  if (!globalObj.localStorage || typeof globalObj.localStorage.getItem !== 'function') {
    globalObj.localStorage = new NoopStorage();
  }
  
  if (!globalObj.sessionStorage || typeof globalObj.sessionStorage.getItem !== 'function') {
    globalObj.sessionStorage = new NoopStorage();
  }
}

export {};
