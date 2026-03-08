/**
 * Hook for managing the live preview iframe.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSandboxPreviewOptions {
  projectId: string;
  autoRefresh?: boolean;
}

export function useSandboxPreview({ projectId, autoRefresh = true }: UseSandboxPreviewOptions) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const fetchPreviewUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/preview/url?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch preview URL');
      }

      const data = await response.json() as { previewUrl?: string };
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
        setIsLive(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const refreshPreview = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  }, [previewUrl]);

  // Auto-fetch preview URL on mount
  useEffect(() => {
    fetchPreviewUrl();
  }, [fetchPreviewUrl]);

  return {
    previewUrl,
    isLoading,
    error,
    isLive,
    iframeRef,
    refreshPreview,
    fetchPreviewUrl,
    setPreviewUrl,
  };
}
