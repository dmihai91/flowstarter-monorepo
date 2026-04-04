/// <reference types="@testing-library/jest-dom" />
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock server-only for tests (it throws in client environments)
vi.mock('server-only', () => ({}));

// Provide a fully-functional localStorage for vitest forks pool.
// Vitest 4 + forks pool + jsdom may expose the object but with a broken .clear().
const _localStorageStore: Record<string, string> = {};
const _localStorage = {
  getItem: (key: string) => _localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { _localStorageStore[key] = value; },
  removeItem: (key: string) => { delete _localStorageStore[key]; },
  clear: () => { Object.keys(_localStorageStore).forEach(k => delete _localStorageStore[k]); },
  get length() { return Object.keys(_localStorageStore).length; },
  key: (i: number) => Object.keys(_localStorageStore)[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: _localStorage, writable: true, configurable: true });
