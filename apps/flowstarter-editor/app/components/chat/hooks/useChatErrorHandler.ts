import { useState, useCallback } from 'react';
import { logStore } from '~/lib/stores/logs';
import { createScopedLogger } from '~/utils/logger';
import type { LlmErrorAlertType } from '~/types/actions';

const logger = createScopedLogger('ChatErrorHandler');

export interface UseChatErrorHandlerOptions {
  providerName: string;
  stop: () => void;
  setFakeLoading: (loading: boolean) => void;
  setData: (data: any) => void;
}

export interface UseChatErrorHandlerReturn {
  llmErrorAlert: LlmErrorAlertType | undefined;
  handleError: (error: any, context?: 'chat' | 'template' | 'llmcall') => void;
  clearLlmErrorAlert: () => void;
}

/**
 * Hook to handle chat errors and manage error alert state
 */
export function useChatErrorHandler({
  providerName,
  stop,
  setFakeLoading,
  setData,
}: UseChatErrorHandlerOptions): UseChatErrorHandlerReturn {
  const [llmErrorAlert, setLlmErrorAlert] = useState<LlmErrorAlertType | undefined>(undefined);

  const handleError = useCallback(
    (error: any, context: 'chat' | 'template' | 'llmcall' = 'chat') => {
      logger.error(`${context} request failed`, error);

      stop();
      setFakeLoading(false);

      let errorInfo = {
        message: 'An unexpected error occurred',
        isRetryable: true,
        statusCode: 500,
        provider: providerName,
        type: 'unknown' as const,
        retryDelay: 0,
      };

      if (error.message) {
        try {
          const parsed = JSON.parse(error.message);

          if (parsed.error || parsed.message) {
            errorInfo = { ...errorInfo, ...parsed };
          } else {
            errorInfo.message = error.message;
          }
        } catch {
          errorInfo.message = error.message;
        }
      }

      let errorType: LlmErrorAlertType['errorType'] = 'unknown';
      let title = 'Request Failed';

      if (errorInfo.statusCode === 401 || errorInfo.message.toLowerCase().includes('api key')) {
        errorType = 'authentication';
        title = 'Authentication Error';
      } else if (errorInfo.statusCode === 429 || errorInfo.message.toLowerCase().includes('rate limit')) {
        errorType = 'rate_limit';
        title = 'Rate Limit Exceeded';
      } else if (errorInfo.message.toLowerCase().includes('quota')) {
        errorType = 'quota';
        title = 'Quota Exceeded';
      } else if (errorInfo.statusCode >= 500) {
        errorType = 'network';
        title = 'Server Error';
      }

      logStore.logError(`${context} request failed`, error, {
        component: 'Chat',
        action: 'request',
        error: errorInfo.message,
        context,
        retryable: errorInfo.isRetryable,
        errorType,
        provider: providerName,
      });

      setLlmErrorAlert({
        type: 'error',
        title,
        description: errorInfo.message,
        provider: providerName,
        errorType,
      });
      setData([]);
    },
    [providerName, stop, setFakeLoading, setData],
  );

  const clearLlmErrorAlert = useCallback(() => {
    setLlmErrorAlert(undefined);
  }, []);

  return {
    llmErrorAlert,
    handleError,
    clearLlmErrorAlert,
  };
}
