/**
 * useChatStatePersistence Hook
 *
 * Persists and restores chat state to/from Convex.
 * Uses sessionId (localStorage) to track the current session.
 *
 * NOTE: Currently stubbed out - Convex chatSessions module not yet implemented.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Id } from '~/convex/_generated/dataModel';

// Session ID stored in localStorage for persistence across refreshes
const SESSION_ID_KEY = 'flowstarter_session_id';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SimplePalette {
  id: string;
  name: string;
  colors: string[];
}

export interface SimpleFont {
  id: string;
  name: string;
  heading: string;
  body: string;
}

export type OnboardingStep = 'welcome' | 'describe' | 'template' | 'palette' | 'font' | 'creating' | 'ready';

export interface ChatState {
  step: OnboardingStep;
  projectDescription: string;
  selectedTemplateId: string | null;
  selectedTemplateName: string | null;
  selectedPalette: SimplePalette | null;
  selectedFont: SimpleFont | null;
  messages: ChatMessage[];
  projectId: Id<'projects'> | null;
}

interface UseChatStatePersistenceResult {
  sessionId: string;
  savedState: ChatState | null;
  isLoading: boolean;
  saveState: (state: Partial<ChatState>) => Promise<void>;
  linkToProject: (projectId: Id<'projects'>) => Promise<void>;
  clearSession: () => Promise<void>;
}

/**
 * Stub implementation - Convex chatSessions module not yet implemented.
 * Returns no-op functions and null state.
 */
export function useChatStatePersistence(): UseChatStatePersistenceResult {
  const [sessionId] = useState(getOrCreateSessionId);
  const _saveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const _pendingStateRef = useRef<Partial<ChatState> | null>(null);

  // Stub: No Convex queries yet
  const savedState: ChatState | null = null;

  // Stub: No-op save
  const saveState = useCallback(async (_state: Partial<ChatState>) => {
    // TODO: Implement when chatSessions Convex module is created
    console.log('[useChatStatePersistence] Save state (stubbed)');
  }, []);

  // Stub: No-op link
  const linkToProject = useCallback(async (_projectId: Id<'projects'>) => {
    // TODO: Implement when chatSessions Convex module is created
    console.log('[useChatStatePersistence] Link to project (stubbed)');
  }, []);

  // Stub: No-op clear
  const clearSession = useCallback(async () => {
    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_ID_KEY, newSessionId);
    window.location.reload(); // Reload to start fresh
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (_saveDebounceRef.current) {
        clearTimeout(_saveDebounceRef.current);
      }
    };
  }, []);

  return {
    sessionId,
    savedState,
    isLoading: false,
    saveState,
    linkToProject,
    clearSession,
  };
}

