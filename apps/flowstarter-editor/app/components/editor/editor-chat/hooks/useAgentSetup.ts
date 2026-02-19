/**
 * useAgentSetup Hook
 *
 * Configures the agent execution hook with callbacks for progress and file generation.
 */

import { workbenchStore } from '~/lib/stores/workbench';
import { useAgentExecution, type AgentFileResultDTO } from '~/lib/hooks/useAgentExecution';
import { normalizePath } from '../utils';
import { AGENT_ERRORS, formatErrorForUser, getErrorSuggestions } from '../errors';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';

interface UseAgentSetupProps {
  messageHook: UseOnboardingMessagesReturn;
}

interface UseAgentSetupReturn {
  agentState: ReturnType<typeof useAgentExecution>['state'];
  cancelAgent: () => void;
}

async function syncAgentFilesToWorkbench(files: AgentFileResultDTO[]): Promise<void> {
  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    await workbenchStore.createFile(normalizedPath, file.content);
  }
  console.log(`Synced ${files.length} agent-generated files to workbench`);
}

export function useAgentSetup({ messageHook }: UseAgentSetupProps): UseAgentSetupReturn {
  const { state: agentState, cancel: cancelAgent } = useAgentExecution({
    onProgress: (event) => {
      if (event.type === 'task_start') {
        const data = event.data as { title?: string; message?: string };
        const message = data.title || data.message;

        if (message) {
          messageHook.addAssistantMessage(`Working on: ${message}`);
        }
      }
    },
    onFileGenerated: async (file) => {
      await syncAgentFilesToWorkbench([file]);
    },
    onComplete: (files) => {
      messageHook.addAssistantMessage(`Updated ${files.length} file${files.length !== 1 ? 's' : ''}.`);
    },
    onError: (error) => {
      console.error('Agent execution error:', error);
      messageHook.addAssistantMessage(formatErrorForUser(AGENT_ERRORS.EXECUTION_FAILED));
      messageHook.setSuggestedReplies(getErrorSuggestions('agent'));
    },
  });

  return {
    agentState,
    cancelAgent,
  };
}

export type { UseAgentSetupProps, UseAgentSetupReturn };

