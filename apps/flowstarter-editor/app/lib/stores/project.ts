/**
 * Project Store
 *
 * Simple store for tracking the current project context.
 * Replaces IndexedDB-based chat history with Convex-based storage.
 */

import { atom } from 'nanostores';

// Current project/chat ID for deployment links
export const projectId = atom<string | undefined>(undefined);

// Current project description
export const projectDescription = atom<string | undefined>(undefined);

// Alias for backward compatibility
export const chatId = projectId;
export const description = projectDescription;

