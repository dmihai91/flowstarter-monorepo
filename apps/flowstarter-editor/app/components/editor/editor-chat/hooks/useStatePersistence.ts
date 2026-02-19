/**
 * useStatePersistence Hook
 *
 * Manages state restoration from initial state and debounced persistence
 * of state changes for conversation resumption.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { InitialChatState } from '../types';
import type { UseStatePersistenceOptions, UseStatePersistenceReturn } from '../types/sharedState';

const DEFAULT_DEBOUNCE_MS = 500;

export function useStatePersistence(options: UseStatePersistenceOptions = {}): UseStatePersistenceReturn {
  const { initialState, onStateChange, debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  // ─── State ────────────────────────────────────────────────────────────────
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const restoredStateRef = useRef<InitialChatState | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<Partial<InitialChatState>>({});

  // Store latest callback in ref to avoid stale closure issues
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // ─── Restore State on Mount ───────────────────────────────────────────────
  useEffect(() => {
    if (initialState && !hasRestoredState) {
      restoredStateRef.current = initialState;
      setHasRestoredState(true);
    }
  }, [initialState, hasRestoredState]);

  // ─── Debounced State Persistence ──────────────────────────────────────────
  const persistState = useCallback(
    (state: Partial<InitialChatState>) => {
      // Merge with pending state
      pendingStateRef.current = {
        ...pendingStateRef.current,
        ...state,
      };

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced timer - use ref to get latest callback
      debounceTimerRef.current = setTimeout(() => {
        if (onStateChangeRef.current && Object.keys(pendingStateRef.current).length > 0) {
          onStateChangeRef.current(pendingStateRef.current);
          pendingStateRef.current = {};
        }
      }, debounceMs);
    },
    [debounceMs],
  );

  // ─── Get Restored State ───────────────────────────────────────────────────
  const getRestoredState = useCallback((): InitialChatState | null => {
    return restoredStateRef.current;
  }, []);

  // ─── Cleanup on Unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      /*
       * Note: We intentionally DON'T flush pending state on unmount.
       * The callback may be stale or the parent component may be unmounting,
       * which would cause React state update warnings.
       * Instead, ensure critical state is persisted synchronously when needed.
       */
      pendingStateRef.current = {};
    };
  }, []);

  return {
    // State
    hasRestoredState,

    // Actions
    persistState,
    getRestoredState,
  };
}

export type { UseStatePersistenceOptions, UseStatePersistenceReturn };

