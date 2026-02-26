import type { DaytonaPreviewState } from '~/lib/hooks/useDaytonaPreview';

export interface DaytonaPreviewProps {
  state: DaytonaPreviewState;
  onRefresh?: () => void;
  onRetry?: () => void;
}

export type PreviewStatus = 'idle' | 'creating' | 'syncing' | 'starting' | 'reconnecting' | 'ready' | 'error';

export interface StatusConfig {
  icon: React.ComponentType<{ color: string }>;
  title: string;
  subtitle: string;
  accentColor: string;
  progress: number;
}
