/**
 * useAgentExecution - Client-side hook for executing the agent pipeline
 *
 * This hook forms a boundary between the editor and agent service.
 * It does NOT write files directly - instead it returns files via callbacks
 * so the consumer (component) can decide how to handle them.
 *
 * This decoupling allows the agent service to be extracted to a separate
 * service later without changing component code.
 */

import { useState, useCallback, useRef } from 'react';
import type {
  AgentFileResultDTO,
  AgentPhaseDTO,
  AgentExecutionStateDTO,
  AgentEventDTO,
  AgentProjectContextDTO,
  AgentDesignSchemeDTO,
  AgentProjectDetailsDTO,
  UseAgentExecutionOptionsDTO,
  UseAgentExecutionReturnDTO,
} from './types';

// Re-export DTOs for consumers
export type {
  AgentFileResultDTO,
  AgentPhaseDTO,
  AgentExecutionStateDTO,
  AgentEventDTO,
  AgentProjectContextDTO,
  AgentDesignSchemeDTO,
  AgentProjectDetailsDTO,
  UseAgentExecutionOptionsDTO,
  UseAgentExecutionReturnDTO,
};

// Legacy type aliases for backward compatibility
export type AgentExecutionState = AgentExecutionStateDTO;
export type UseAgentExecutionOptions = UseAgentExecutionOptionsDTO;

// ─── Internal Types (from API responses) ─────────────────────────────────────

interface InternalStreamEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface InternalPlan {
  summary: string;
  tasks?: Array<{ id: string; title: string }>;
}

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: AgentExecutionStateDTO = {
  isRunning: false,
  phase: 'idle',
  progress: 0,
  filesGenerated: 0,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAgentExecution(options: UseAgentExecutionOptionsDTO = {}): UseAgentExecutionReturnDTO {
  const [state, setState] = useState<AgentExecutionStateDTO>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const filesRef = useRef<AgentFileResultDTO[]>([]);

  /**
   * Execute the agent pipeline.
   * Files are returned via callbacks, NOT written to any store.
   */
  const execute = useCallback(
    async (
      context: AgentProjectContextDTO,
      userRequest: string,
      conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      forceAgent?: 'daytona',
    ) => {
      // Abort any existing execution
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      filesRef.current = [];

      setState({
        isRunning: true,
        phase: 'starting',
        progress: 0,
        filesGenerated: 0,
        error: undefined,
      });

      try {
        const response = await fetch('/api/agent.execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context,
            userRequest,
            conversationHistory,
            forceAgent,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                setState((prev) => ({
                  ...prev,
                  isRunning: false,
                  phase: 'complete',
                  progress: 100,
                }));
                return;
              }

              try {
                const event = JSON.parse(data) as InternalStreamEvent;

                // Emit event to consumer
                const mappedEvent: AgentEventDTO = {
                  type: event.type as AgentEventDTO['type'],
                  timestamp: event.timestamp,
                  data: event.data,
                };
                options.onProgress?.(mappedEvent);

                // Update state based on event type
                switch (event.type) {
                  case 'task_start': {
                    const taskData = event.data as {
                      phase?: string;
                      title?: string;
                      message?: string;
                    };
                    setState((prev) => ({
                      ...prev,
                      phase: (taskData.phase as AgentPhaseDTO) || 'executing',
                      currentTask: taskData.title || taskData.message,
                    }));
                    break;
                  }

                  case 'plan': {
                    const planData = event.data as { status?: string; plan?: InternalPlan };

                    if (planData.status === 'completed' && planData.plan) {
                      setState((prev) => ({
                        ...prev,
                        phase: 'planned',
                        plan: {
                          summary: planData.plan!.summary,
                          taskCount: planData.plan!.tasks?.length || 0,
                        },
                      }));
                    }

                    break;
                  }

                  case 'task_complete': {
                    const completeData = event.data as {
                      phase?: string;
                      approved?: boolean;
                      issueCount?: number;
                    };

                    if (completeData.phase === 'review') {
                      setState((prev) => ({
                        ...prev,
                        phase: 'reviewed',
                        review: {
                          approved: completeData.approved || false,
                          issueCount: completeData.issueCount || 0,
                        },
                      }));
                    }

                    break;
                  }

                  case 'done': {
                    const doneData = event.data as {
                      files?: Record<string, string>;
                    };

                    if (doneData.files && typeof doneData.files === 'object') {
                      setState((prev) => ({
                        ...prev,
                        phase: 'writing_files',
                        progress: 90,
                      }));

                      // Convert files to DTOs
                      const fileResults: AgentFileResultDTO[] = Object.entries(doneData.files).map(
                        ([path, content]) => ({
                          path: path.startsWith('/') ? path.slice(1) : path,
                          content,
                          action: 'create' as const,
                        }),
                      );

                      filesRef.current = fileResults;

                      // Emit each file to consumer for incremental writing
                      for (const file of fileResults) {
                        options.onFileGenerated?.(file);
                      }

                      // Update state
                      setState((prev) => ({
                        ...prev,
                        isRunning: false,
                        phase: 'complete',
                        progress: 100,
                        filesGenerated: fileResults.length,
                      }));

                      // Emit completion with all files
                      options.onComplete?.(fileResults);
                    }

                    break;
                  }

                  case 'error': {
                    const errorData = event.data as { message?: string };
                    const errorMsg = errorData.message || 'Unknown error';
                    setState((prev) => ({
                      ...prev,
                      isRunning: false,
                      phase: 'error',
                      error: errorMsg,
                    }));
                    options.onError?.(errorMsg);
                    break;
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON
                console.warn('Failed to parse SSE event:', parseError);
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            phase: 'cancelled',
          }));
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isRunning: false,
          phase: 'error',
          error: errorMessage,
        }));
        options.onError?.(errorMessage);
      }
    },
    [options],
  );

  /**
   * Cancel the current execution.
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Reset state.
   */
  const reset = useCallback(() => {
    setState(initialState);
    filesRef.current = [];
  }, []);

  return {
    state,
    execute,
    cancel,
    reset,
  };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Helper to build ProjectContext from external data.
 * Note: This does NOT access workbenchStore - the caller provides the files.
 */
export function buildProjectContext(
  templateId: string,
  designScheme?: AgentDesignSchemeDTO,
  projectDetails?: Partial<AgentProjectDetailsDTO>,
  templateFiles?: Record<string, string>,
): AgentProjectContextDTO {
  return {
    templateId,
    templateFiles: templateFiles || {},
    designScheme: designScheme
      ? {
          palette: designScheme.palette,
          fonts: designScheme.fonts || [],
          borderRadius: designScheme.borderRadius || '0.5rem',
          shadow: designScheme.shadow || 'md',
          spacing: designScheme.spacing || 'comfortable',
          theme: designScheme.theme,
          features: designScheme.features || [],
        }
      : undefined,
    projectDetails: projectDetails
      ? {
          title: projectDetails.title || '',
          description: projectDetails.description || '',
          uvp: projectDetails.uvp || '',
          businessGoals: projectDetails.businessGoals || [],
          targetAudience: projectDetails.targetAudience,
          tone: projectDetails.tone || 'professional',
        }
      : undefined,
  };
}

/**
 * Helper to build ProjectContext from workbench files.
 * Consumer should call this with files from workbenchStore.files.get()
 */
export function buildProjectContextFromFiles(
  templateId: string,
  files: Record<string, { type?: string; content?: string; isBinary?: boolean }>,
  designScheme?: AgentDesignSchemeDTO,
  projectDetails?: Partial<AgentProjectDetailsDTO>,
): AgentProjectContextDTO {
  const templateFiles: Record<string, string> = {};

  for (const [path, dirent] of Object.entries(files)) {
    if (dirent?.type === 'file' && !dirent.isBinary && dirent.content) {
      // Normalize path
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      templateFiles[normalizedPath] = dirent.content;
    }
  }

  return buildProjectContext(templateId, designScheme, projectDetails, templateFiles);
}

