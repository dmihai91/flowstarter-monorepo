/**
 * BaseChat - Preview Handlers Hook
 *
 * Handles preview-related actions like reload and opening in new tabs.
 */

import type { PreviewInfo } from '~/lib/stores/previews';

interface UsePreviewHandlersOptions {
  previews: PreviewInfo[];
  activePreviewIndex: number;
  setDisplayPath: (path: string) => void;
}

interface UsePreviewHandlersReturn {
  handleSetIframeUrl: (url: string | undefined) => void;
  handleReloadPreview: () => void;
  handleOpenInNewTab: () => void;
  handleOpenInNewWindow: () => void;
}

export function usePreviewHandlers({
  previews,
  activePreviewIndex,
  setDisplayPath,
}: UsePreviewHandlersOptions): UsePreviewHandlersReturn {
  const handleSetIframeUrl = (url: string | undefined) => {
    if (url) {
      try {
        const urlObj = new URL(url);
        setDisplayPath(urlObj.pathname || '/');
      } catch {
        setDisplayPath('/');
      }
    } else {
      setDisplayPath('/');
    }
  };

  const handleReloadPreview = () => {
    const activePreview = previews[activePreviewIndex];

    if (activePreview?.baseUrl) {
      // Extract Daytona preview ID
      const previewId = activePreview.baseUrl.match(/sandbox-([a-zA-Z0-9]+)/)?.[1];

      if (previewId) {
        // Trigger preview refresh by updating the preview state
        const updatedPreviews = [...previews];

        if (updatedPreviews[activePreviewIndex]) {
          updatedPreviews[activePreviewIndex] = { ...updatedPreviews[activePreviewIndex], ready: false };

          // Force re-render by setting ready back to true after a brief delay
          setTimeout(() => {
            updatedPreviews[activePreviewIndex] = { ...updatedPreviews[activePreviewIndex], ready: true };
          }, 100);
        }
      }
    }
  };

  const handleOpenInNewTab = () => {
    const activePreview = previews[activePreviewIndex];

    if (activePreview?.baseUrl) {
      window.open(activePreview.baseUrl, '_blank');
    }
  };

  const handleOpenInNewWindow = () => {
    const activePreview = previews[activePreviewIndex];

    if (activePreview?.baseUrl) {
      window.open(activePreview.baseUrl, '_blank', 'width=1200,height=800');
    }
  };

  return {
    handleSetIframeUrl,
    handleReloadPreview,
    handleOpenInNewTab,
    handleOpenInNewWindow,
  };
}

