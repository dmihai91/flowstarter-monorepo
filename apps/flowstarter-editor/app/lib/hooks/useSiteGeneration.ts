/**
 * useSiteGeneration Hook
 *
 * Consumes SSE stream from /api/build for real-time progress updates.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface BusinessInfo {
  name: string;
  tagline?: string;
  description?: string;
  services?: string[];
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface TemplateInfo {
  slug: string;
  name: string;
}

export interface DesignInfo {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headingFont?: string;
}

export interface SiteGenerationInput {
  projectId: string;
  siteName: string;
  businessInfo: BusinessInfo;
  template: TemplateInfo;
  design: DesignInfo;
  deployToPreview?: boolean;
  generateImages?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface PreviewInfo {
  url: string;
  sandboxId: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'deploying' | 'complete' | 'error';

export interface SiteGenerationState {
  status: GenerationStatus;
  files: GeneratedFile[];
  preview: PreviewInfo | null;
  error: string | null;
  progress: string;
  phase?: string;
}

export interface UseSiteGenerationReturn {
  state: SiteGenerationState;
  generate: (input: SiteGenerationInput) => Promise<boolean>;
  reset: () => void;
  isGenerating: boolean;
  isComplete: boolean;
  hasError: boolean;
}

const initialState: SiteGenerationState = {
  status: 'idle',
  files: [],
  preview: null,
  error: null,
  progress: '',
};

export function useSiteGeneration(): UseSiteGenerationReturn {
  const [state, setState] = useState<SiteGenerationState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const generate = useCallback(async (input: SiteGenerationInput): Promise<boolean> => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState({
      status: 'generating',
      files: [],
      preview: null,
      error: null,
      progress: 'Starting site generation...',
    });

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Generation failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      // Handle SSE stream
      if (contentType.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  setState(prev => ({
                    ...prev,
                    progress: data.message,
                    phase: data.phase,
                  }));
                } else if (data.type === 'complete') {
                  const result = data.result;
                  setState({
                    status: 'complete',
                    files: result.files || [],
                    preview: result.preview || null,
                    error: result.previewError || null,
                    progress: result.preview 
                      ? 'Site is ready! Preview available.' 
                      : 'Site generated! Deploy when ready.',
                    phase: 'complete',
                  });
                  return result.success;
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                // Skip malformed JSON
                if (!(e instanceof SyntaxError)) throw e;
              }
            }
          }
        }
        return true;
      }
      
      // Fallback: Handle JSON response
      const result = (await response.json()) as {
        success: boolean;
        files?: GeneratedFile[];
        preview?: PreviewInfo | null;
        previewError?: string;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Site generation failed');
      }

      setState({
        status: 'complete',
        files: result.files || [],
        preview: result.preview || null,
        error: result.previewError || null,
        progress: result.preview ? 'Site is ready! Preview available.' : 'Site generated! Deploy when ready.',
      });

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useSiteGeneration] Error:', error);

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        progress: '',
      }));

      return false;
    }
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(initialState);
  }, []);

  return {
    state,
    generate,
    reset,
    isGenerating: state.status === 'generating' || state.status === 'deploying',
    isComplete: state.status === 'complete',
    hasError: state.status === 'error',
  };
}
