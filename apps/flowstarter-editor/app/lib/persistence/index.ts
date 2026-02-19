/**
 * Persistence Module
 *
 * Note: IndexedDB has been removed. Data is now stored in Convex.
 * This module provides backward-compatible exports for legacy code.
 */

import type { Message } from 'ai';

export * from './localStorage';

// Re-export project store for backward compatibility
export { projectId as chatId, projectDescription as description } from '~/lib/stores/project';

// Message type matching Convex schema (for internal storage)
export interface ConvexChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  component?: string;
  metadata?: string;
}

// ChatHistoryItem type for backward compatibility
export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
}

// Return type for useChatHistory hook
export interface UseChatHistoryReturn {
  ready: boolean;
  error: Error | null;
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => Promise<ChatHistoryItem | null>;
  duplicateCurrentChat: (id?: string) => Promise<string | null>;
}

// Stub for useChatHistory - data now comes from Convex
export function useChatHistory(): UseChatHistoryReturn {
  return {
    ready: true,
    error: null,
    initialMessages: [],
    storeMessageHistory: async (_messages: Message[]) => {},
    importChat: async (_description: string, _messages: Message[]) => {},
    exportChat: async () => null,
    duplicateCurrentChat: async (_id?: string) => null,
  };
}

// Empty stub database type for backward compatibility
interface StubDatabase {
  readonly _stub: true;
}

/*
 * Stub database for backward compatibility
 * Note: Chat data is now in Convex, not IndexedDB
 */
export const db: StubDatabase = { _stub: true } as StubDatabase;

// Stub functions that work without db parameter
export const getAll = async (_db?: StubDatabase): Promise<ChatHistoryItem[]> => {
  console.warn('getAll is deprecated. Use Convex for chat history.');
  return [];
};

export const deleteById = async (_db?: StubDatabase, _id?: string): Promise<void> => {
  console.warn('deleteById is deprecated. Use Convex for chat deletion.');
};

