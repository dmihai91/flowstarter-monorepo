import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import type { ProviderInfo } from '~/types/model';

export interface UseModelProviderReturn {
  model: string;
  setModel: (model: string) => void;
  provider: ProviderInfo;
  setProvider: (provider: ProviderInfo) => void;
}

/**
 * Hook to manage model and provider selection with cookie persistence
 */
export function useModelProvider(): UseModelProviderReturn {
  const [model, setModelState] = useState(() => {
    const savedModel = Cookies.get('selectedModel');
    return savedModel || DEFAULT_MODEL;
  });

  const [provider, setProviderState] = useState<ProviderInfo>(() => {
    const savedProvider = Cookies.get('selectedProvider');
    return (PROVIDER_LIST.find((p) => p.name === savedProvider) || DEFAULT_PROVIDER) as ProviderInfo;
  });

  const setModel = useCallback((newModel: string) => {
    setModelState(newModel);
    Cookies.set('selectedModel', newModel, { expires: 30 });
  }, []);

  const setProvider = useCallback((newProvider: ProviderInfo) => {
    setProviderState(newProvider);
    Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
  }, []);

  return {
    model,
    setModel,
    provider,
    setProvider,
  };
}
