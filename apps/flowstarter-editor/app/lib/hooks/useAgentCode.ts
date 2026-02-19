/**
 * useAgentCode Hook
 *
 * Client-side hook for interacting with the Claude Agent SDK API
 * for code generation and file editing tasks.
 */

import { useState, useCallback, useRef } from 'react';

export interface FileChange {
  path: string;
  content: string;
  operation: 'create' | 'update' | 'delete';
}

export interface AgentProgress {
  phase: string;
  message: string;
}

export interface AgentResult {
  success: boolean;
  files?: FileChange[];
  response?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalCostUSD: number;
  };
}

export interface UseAgentCodeOptions {
  onMessage?: (message: string) => void;
  onFileChange?: (file: FileChange) => void;
  onProgress?: (progress: AgentProgress) => void;
  onError?: (error: string) => void;
  onComplete?: (result: AgentResult) => void;
}

export interface UseAgentCodeReturn {
  generateCode: (params: {
    projectId: string;
    prompt: string;
    workingDirectory: string;
    existingFiles?: Record<string, string>;
    systemPrompt?: string;
  }) => Promise<AgentResult | null>;

  fixBuildError: (params: {
    errorLog: string;
    filePath: string;
    fileContent: string;
    workingDirectory: string;
  }) => Promise<AgentResult | null>;

  applyChanges: (params: {
    instruction: string;
    targetFiles: string[];
    workingDirectory: string;
  }) => Promise<AgentResult | null>;

  isRunning: boolean;
  progress: AgentProgress | null;
  fileChanges: FileChange[];
  error: string | null;
  abort: () => void;
}

export function useAgentCode(options: UseAgentCodeOptions = {}): UseAgentCodeReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AgentProgress | null>(null);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const processSSE = useCallback(
    async (response: Response, callbacks: UseAgentCodeOptions): Promise<AgentResult | null> => {
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let result: AgentResult | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete events from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6);

              if (currentEvent && currentData) {
                try {
                  const data = JSON.parse(currentData);

                  switch (currentEvent) {
                    case 'message':
                      callbacks.onMessage?.(data.text);
                      break;

                    case 'file-change':
                      setFileChanges((prev) => [...prev, data]);
                      callbacks.onFileChange?.(data);
                      break;

                    case 'progress':
                      setProgress(data);
                      callbacks.onProgress?.(data);
                      break;

                    case 'error':
                      setError(data.error);
                      callbacks.onError?.(data.error);
                      break;

                    case 'result':
                      result = data;
                      callbacks.onComplete?.(data);
                      break;
                  }
                } catch (e) {
                  console.warn('Failed to parse SSE data:', currentData);
                }

                currentEvent = '';
                currentData = '';
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return result;
    },
    [],
  );

  const makeRequest = useCallback(
    async (body: Record<string, unknown>): Promise<AgentResult | null> => {
      // Abort any existing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsRunning(true);
      setError(null);
      setFileChanges([]);
      setProgress(null);

      try {
        const response = await fetch('/api/agent-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({ error: 'Request failed' }))) as { error?: string };
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await processSSE(response, options);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        options.onError?.(errorMessage);

        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [options, processSSE],
  );

  const generateCode = useCallback(
    async (params: {
      projectId: string;
      prompt: string;
      workingDirectory: string;
      existingFiles?: Record<string, string>;
      systemPrompt?: string;
    }) => {
      return makeRequest({
        action: 'generate',
        ...params,
      });
    },
    [makeRequest],
  );

  const fixBuildError = useCallback(
    async (params: { errorLog: string; filePath: string; fileContent: string; workingDirectory: string }) => {
      return makeRequest({
        action: 'fix-error',
        ...params,
      });
    },
    [makeRequest],
  );

  const applyChanges = useCallback(
    async (params: { instruction: string; targetFiles: string[]; workingDirectory: string }) => {
      return makeRequest({
        action: 'apply-changes',
        ...params,
      });
    },
    [makeRequest],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
  }, []);

  return {
    generateCode,
    fixBuildError,
    applyChanges,
    isRunning,
    progress,
    fileChanges,
    error,
    abort,
  };
}

