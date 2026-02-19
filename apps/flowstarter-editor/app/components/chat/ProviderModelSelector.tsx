import type { ProviderInfo } from '~/types/model';

interface ProviderModelSelectorProps {
  providerList: ProviderInfo[];
  provider: ProviderInfo | undefined;
  setProvider: (provider: ProviderInfo) => void;
  model: string | undefined;
  setModel: (model: string) => void;
  modelList: { name: string; label: string; provider: string }[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
  isCollapsed?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onApiKeyChange?: (providerName: string, apiKey: string) => void;
}

export function ProviderModelSelector({ model }: ProviderModelSelectorProps) {
  return <div className="text-sm text-flowstarter-elements-textSecondary">{model || 'Select a model'}</div>;
}
