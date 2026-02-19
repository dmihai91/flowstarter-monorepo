/**
 * BaseChat - Model Management Hook
 *
 * Handles model loading and API key management.
 */

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { getApiKeysFromCookies } from '../APIKeyManager';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { ProviderInfo } from '~/types/model';

interface UseModelManagementOptions {
  providerList?: ProviderInfo[];
  provider?: ProviderInfo;
}

interface UseModelManagementReturn {
  apiKeys: Record<string, string>;
  modelList: ModelInfo[];
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => Promise<void>;
}

export function useModelManagement({
  providerList,
  provider,
}: UseModelManagementOptions): UseModelManagementReturn {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
  const [modelList, setModelList] = useState<ModelInfo[]>([]);
  const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let parsedApiKeys: Record<string, string> | undefined = {};

      try {
        parsedApiKeys = getApiKeysFromCookies();
        setApiKeys(parsedApiKeys);
      } catch (error) {
        console.error('Error loading API keys from cookies:', error);
        Cookies.remove('apiKeys');
      }

      setIsModelLoading('all');
      fetch('/api/models')
        .then((response) => response.json())
        .then((data) => {
          const typedData = data as { modelList: ModelInfo[] };
          setModelList(typedData.modelList);
        })
        .catch((error) => {
          console.error('Error fetching model list:', error);
        })
        .finally(() => {
          setIsModelLoading(undefined);
        });
    }
  }, [providerList, provider]);

  const onApiKeysChange = async (providerName: string, apiKey: string) => {
    const newApiKeys = { ...apiKeys, [providerName]: apiKey };
    setApiKeys(newApiKeys);
    Cookies.set('apiKeys', JSON.stringify(newApiKeys));

    setIsModelLoading(providerName);

    let providerModels: ModelInfo[] = [];

    try {
      const response = await fetch(`/api/models/${encodeURIComponent(providerName)}`);
      const data = await response.json();
      providerModels = (data as { modelList: ModelInfo[] }).modelList;
    } catch (error) {
      console.error('Error loading dynamic models for:', providerName, error);
    }

    // Only update models for the specific provider
    setModelList((prevModels) => {
      const otherModels = prevModels.filter((model) => model.provider !== providerName);
      return [...otherModels, ...providerModels];
    });
    setIsModelLoading(undefined);
  };

  return {
    apiKeys,
    modelList,
    isModelLoading,
    onApiKeysChange,
  };
}

