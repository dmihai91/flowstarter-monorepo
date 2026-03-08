/**
 * useStreamingPreview
 *
 * Connects agent file-change events to the active Daytona sandbox in real-time.
 * Each file written by the agent is immediately pushed to the sandbox.
 * The preview hot-reloads naturally since the dev server watches the filesystem.
 */

import { useState, useCallback, useRef } from 'react';

export interface UseStreamingPreviewOptions {
  projectId: string | null;
  sandboxId: string | null;
}

export interface UseStreamingPreviewResult {
  /** Push a single file to the sandbox immediately */
  pushFile: (path: string, content: string) => void;
  /** Recent file paths written (last 5 — for the progress overlay) */
  streamedFiles: string[];
  /** Total files pushed this session */
  streamedCount: number;
  /** Whether streaming is currently in progress */
  isStreaming: boolean;
  /** Call before generation starts */
  startStreaming: () => void;
  /** Call when generation is done */
  stopStreaming: () => void;
}

export function useStreamingPreview({
  projectId,
  sandboxId,
}: UseStreamingPreviewOptions): UseStreamingPreviewResult {
  const [streamedFiles, setStreamedFiles] = useState<string[]>([]);
  const [streamedCount, setStreamedCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const countRef = useRef(0);

  const pushFile = useCallback(
    (path: string, content: string) => {
      if (!projectId) return;

      // Update UI state
      setStreamedFiles((prev) => [...prev.slice(-4), path]); // keep last 5
      countRef.current += 1;
      setStreamedCount(countRef.current);

      // Fire-and-forget — errors surface in TerminalPanel, not here
      fetch('/api/daytona/push-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, sandboxId, path, content }),
      }).catch(() => {});
    },
    [projectId, sandboxId],
  );

  const startStreaming = useCallback(() => {
    countRef.current = 0;
    setStreamedFiles([]);
    setStreamedCount(0);
    setIsStreaming(true);
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return {
    pushFile,
    streamedFiles,
    streamedCount,
    isStreaming,
    startStreaming,
    stopStreaming,
  };
}
