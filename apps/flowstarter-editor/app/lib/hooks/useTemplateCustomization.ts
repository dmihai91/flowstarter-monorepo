/**
 * useTemplateCustomization - Hook for LLM-based template customization
 *
 * Uses Kimi K2 via OpenRouter to intelligently modify template files
 * based on user's project description, color palette, and fonts.
 */

import { useState, useCallback, useRef } from 'react';

export interface CustomizationPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface CustomizationFonts {
  heading: string;
  body: string;
}

export interface BusinessInfo {
  uvp: string;
  targetAudience: string;
  businessGoals: string[];
  brandTone: string;
  pricingOffers?: string;
}

export interface CustomizationOptions {
  files: Record<string, string>;
  projectDescription: string;
  palette: CustomizationPalette;
  fonts: CustomizationFonts;
  templateName?: string;
  businessInfo?: BusinessInfo;
}

export interface CustomizationProgress {
  phase: 'idle' | 'analyzing' | 'customizing' | 'finalizing' | 'done' | 'error';
  message: string;
  progress: number; // 0-100
  filesProcessed?: number;
  totalFiles?: number;
  currentFile?: string;
}

export interface FileUpdate {
  path: string;
  content: string;
  unchanged?: boolean;
}

export interface UseTemplateCustomizationReturn {
  customize: (
    options: CustomizationOptions,
    onFileUpdate?: (file: FileUpdate) => void,
  ) => Promise<Record<string, string>>;
  isCustomizing: boolean;
  progress: CustomizationProgress;
  cancel: () => void;
  error: string | null;
}

const initialProgress: CustomizationProgress = {
  phase: 'idle',
  message: '',
  progress: 0,
};

export function useTemplateCustomization(): UseTemplateCustomizationReturn {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [progress, setProgress] = useState<CustomizationProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsCustomizing(false);
    setProgress(initialProgress);
  }, []);

  const customize = useCallback(
    async (
      options: CustomizationOptions,
      onFileUpdate?: (file: FileUpdate) => void,
    ): Promise<Record<string, string>> => {
      // Cancel any existing customization
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsCustomizing(true);
      setError(null);
      setProgress({ phase: 'analyzing', message: 'Analyzing template...', progress: 0 });

      try {
        const response = await fetch('/api/template-customize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error((errorData as { error?: string }).error || `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let resultFiles: Record<string, string> = options.files;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6)) as {
                  type: string;
                  data: Record<string, unknown>;
                };

                switch (event.type) {
                  case 'progress': {
                    const progressData = event.data as {
                      phase?: string;
                      message?: string;
                      progress?: number;
                    };
                    setProgress({
                      phase: (progressData.phase as CustomizationProgress['phase']) || 'customizing',
                      message: progressData.message || 'Processing...',
                      progress: progressData.progress || 0,
                    });
                    break;
                  }

                  case 'file': {
                    const fileData = event.data as { path?: string; progress?: number };
                    const friendlyName = (fileData.path?.split('/').pop() || '')
                      .replace(/\.(tsx?|jsx?|astro|css|scss)$/, '')
                      .replace(/[-_]/g, ' ')
                      .replace(/([a-z])([A-Z])/g, '$1 $2')
                      .toLowerCase();
                    setProgress((prev) => ({
                      ...prev,
                      message: `Working on ${friendlyName || 'your pages'}...`,
                      progress: fileData.progress || prev.progress,
                    }));
                    break;
                  }

                  case 'file_content': {
                    const fileContent = event.data as {
                      path?: string;
                      content?: string;
                      progress?: number;
                      unchanged?: boolean;
                    };

                    if (fileContent.path && fileContent.content) {
                      // Update result files
                      resultFiles[fileContent.path] = fileContent.content;

                      // Call the real-time update callback
                      if (onFileUpdate) {
                        onFileUpdate({
                          path: fileContent.path,
                          content: fileContent.content,
                          unchanged: fileContent.unchanged,
                        });
                      }

                      setProgress((prev) => ({
                        ...prev,
                        message: `Updated ${fileContent.path?.split('/').pop() ?? 'file'}`,
                        progress: fileContent.progress || prev.progress,
                        currentFile: fileContent.path ?? '',
                      }));
                    }

                    break;
                  }

                  case 'done': {
                    const doneData = event.data as {
                      files?: Record<string, string>;
                      fileCount?: number;
                    };

                    if (doneData.files) {
                      resultFiles = doneData.files;
                    }

                    setProgress({
                      phase: 'done',
                      message: `Customized ${doneData.fileCount || 0} files`,
                      progress: 100,
                    });
                    break;
                  }

                  case 'error': {
                    const errorData = event.data as { message?: string };
                    throw new Error(errorData.message || 'Customization failed');
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON
                console.warn('Failed to parse SSE event:', parseError);
              }
            }
          }
        }

        setIsCustomizing(false);

        return resultFiles;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setIsCustomizing(false);
          return options.files; // Return original files on cancel
        }

        const errorMessage = err instanceof Error ? err.message : 'Customization failed';
        setError(errorMessage);
        setProgress({ phase: 'error', message: errorMessage, progress: 0 });
        setIsCustomizing(false);

        // Return original files on error
        return options.files;
      }
    },
    [],
  );

  return {
    customize,
    isCustomizing,
    progress,
    cancel,
    error,
  };
}

