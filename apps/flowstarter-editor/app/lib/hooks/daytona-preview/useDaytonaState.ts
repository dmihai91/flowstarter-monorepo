/**
 * Core state management for Daytona preview.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DaytonaPreviewState } from './types';

/** Initial state for the preview */
export const INITIAL_STATE: DaytonaPreviewState = {
  status: 'idle',
  workspaceId: null,
  previewUrl: null,
  rawPreviewUrl: null,
  displayUrl: null,
  error: null,
  buildError: null,
};

export interface UseDaytonaStateResult {
  state: DaytonaPreviewState;
  setState: React.Dispatch<React.SetStateAction<DaytonaPreviewState>>;
  safeSetState: (updater: React.SetStateAction<DaytonaPreviewState>) => void;
  isMountedRef: React.MutableRefObject<boolean>;
  isStartingRef: React.MutableRefObject<boolean>;
  hasAutoStartedRef: React.MutableRefObject<boolean>;
  autoFixAttemptsRef: React.MutableRefObject<number>;
  autoFixAttempts: number;
  setAutoFixAttempts: React.Dispatch<React.SetStateAction<number>>;
  resetState: () => void;
  resetAutoFix: () => void;
}

/**
 * Hook for managing Daytona preview state and refs.
 */
export function useDaytonaState(projectId: string | null): UseDaytonaStateResult {
  const [state, setState] = useState<DaytonaPreviewState>(INITIAL_STATE);
  const [autoFixAttempts, setAutoFixAttempts] = useState(0);

  // Refs for tracking async operations
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const hasAutoStartedRef = useRef(false);
  const autoFixAttemptsRef = useRef(0);

  // Cleanup refs on unmount to prevent stale state and race conditions
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isStartingRef.current = false;
      hasAutoStartedRef.current = false;
    };
  }, []);

  // Reset auto-start flag when projectId changes
  useEffect(() => {
    hasAutoStartedRef.current = false;
  }, [projectId]);

  // Helper to safely update state only if mounted
  const safeSetState = useCallback((updater: React.SetStateAction<DaytonaPreviewState>) => {
    if (isMountedRef.current) {
      setState(updater);
    }
  }, []);

  // Reset state to initial
  const resetState = useCallback(() => {
    safeSetState(INITIAL_STATE);
  }, [safeSetState]);

  // Reset auto-fix attempts
  const resetAutoFix = useCallback(() => {
    autoFixAttemptsRef.current = 0;
    setAutoFixAttempts(0);
  }, []);

  return {
    state,
    setState,
    safeSetState,
    isMountedRef,
    isStartingRef,
    hasAutoStartedRef,
    autoFixAttemptsRef,
    autoFixAttempts,
    setAutoFixAttempts,
    resetState,
    resetAutoFix,
  };
}
