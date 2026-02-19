import Cookies from 'js-cookie';
import type { ProviderInfo } from '~/types/model';

export function getApiKeysFromCookies(): Record<string, string> {
  const apiKeys: Record<string, string> = {};
  const openRouterKey = Cookies.get('openrouter_api_key');

  if (openRouterKey) {
    apiKeys.OpenRouter = openRouterKey;
  }

  return apiKeys;
}

interface ApiKeyManagerProps {
  provider?: ProviderInfo;
  apiKey?: string;
  setApiKey?: (key: string) => void;
}

export function ApiKeyManager(_props: ApiKeyManagerProps) {
  // API Key management is handled elsewhere - this is a placeholder
  return null;
}

// Alias for backwards compatibility
export { ApiKeyManager as APIKeyManager };
