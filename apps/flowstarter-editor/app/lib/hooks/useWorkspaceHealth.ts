/**
 * Workspace Health Hook
 *
 * Periodic status polling and auto-reconnect for workspace health.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

type WorkspaceStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface UseWorkspaceHealthOptions {
  projectId: string;
  pollIntervalMs?: number;
  maxRetries?: number;
}

export function useWorkspaceHealth({
  projectId,
  pollIntervalMs = 30_000,
  maxRetries = 5,
}: UseWorkspaceHealthOptions) {
  const [status, setStatus] = useState<WorkspaceStatus>('disconnected');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/claude-code/generate?projectId=${projectId}&action=health`,
      );

      if (response.ok) {
        setStatus('connected');
        setRetryCount(0);
      } else {
        throw new Error('Health check failed');
      }
    } catch {
      if (retryCount < maxRetries) {
        setStatus('reconnecting');
        setRetryCount((c) => c + 1);
      } else {
        setStatus('error');
      }
    }

    setLastChecked(new Date());
  }, [projectId, retryCount, maxRetries]);

  // Start polling
  useEffect(() => {
    checkHealth();

    intervalRef.current = setInterval(checkHealth, pollIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkHealth, pollIntervalMs]);

  const reconnect = useCallback(() => {
    setRetryCount(0);
    setStatus('reconnecting');
    checkHealth();
  }, [checkHealth]);

  return {
    status,
    lastChecked,
    retryCount,
    reconnect,
  };
}
