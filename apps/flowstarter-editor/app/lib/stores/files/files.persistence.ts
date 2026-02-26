/**
 * Files Store - Persistence
 *
 * Methods for persisting file state to localStorage.
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FilesStore:Persistence');

const DELETED_PATHS_KEY = 'Flowstarter-deleted-paths';

/**
 * Load deleted paths from localStorage
 */
export function loadDeletedPaths(deletedPaths: Set<string>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const deletedPathsJson = localStorage.getItem(DELETED_PATHS_KEY);

      if (deletedPathsJson) {
        const paths = JSON.parse(deletedPathsJson);

        if (Array.isArray(paths)) {
          paths.forEach((p) => deletedPaths.add(p));
        }
      }
    }
  } catch (error) {
    logger.error('Failed to load deleted paths from localStorage', error);
  }
}

/**
 * Persist deleted paths to localStorage
 */
export function persistDeletedPaths(deletedPaths: Set<string>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DELETED_PATHS_KEY, JSON.stringify([...deletedPaths]));
    }
  } catch (error) {
    logger.error('Failed to persist deleted paths to localStorage', error);
  }
}
