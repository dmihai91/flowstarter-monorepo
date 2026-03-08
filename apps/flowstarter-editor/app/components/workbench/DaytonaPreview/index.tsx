import { memo } from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import type { DaytonaPreviewProps } from './types';
import { useDaytonaPreviewStyles } from './hooks/useDaytonaPreviewStyles';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { ReadyState } from './components/ReadyState';

/**
 * DaytonaPreview - Displays a preview of the Daytona workspace
 *
 * States:
 * - idle/creating/syncing/starting/reconnecting: Shows loading animation
 * - error: Shows error message with retry option
 * - ready: Shows iframe with preview URL
 */
export const DaytonaPreview = memo(({ state, onRefresh, onRetry }: DaytonaPreviewProps) => {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const { status, previewUrl, displayUrl, error } = state;

  const {
    containerStyle,
    iconContainerStyle,
    titleStyle,
    subtitleStyle,
    iconColor,
    ringsColor,
  } = useDaytonaPreviewStyles(isDark, colors);

  // Loading states
  if (status !== 'ready' && status !== 'error') {
    return (
      <LoadingState
        status={status}
        isDark={isDark}
        containerStyle={containerStyle}
        iconContainerStyle={iconContainerStyle}
        titleStyle={titleStyle}
        subtitleStyle={subtitleStyle}
        iconColor={iconColor}
        ringsColor={ringsColor}
        onRetry={onRetry}
      />
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <ErrorState
        error={error ?? undefined}
        isDark={isDark}
        containerStyle={containerStyle}
        iconContainerStyle={iconContainerStyle}
        titleStyle={titleStyle}
        subtitleStyle={subtitleStyle}
        onRetry={onRetry}
        onRefresh={onRefresh}
      />
    );
  }

  // Ready state - show iframe
  return (
    <ReadyState
      previewUrl={previewUrl}
      displayUrl={displayUrl ?? undefined}
      isDark={isDark}
      colors={colors}
      onRefresh={onRefresh}
    />
  );
});

DaytonaPreview.displayName = 'DaytonaPreview';

// Re-export types for convenience
export type { DaytonaPreviewProps } from './types';
