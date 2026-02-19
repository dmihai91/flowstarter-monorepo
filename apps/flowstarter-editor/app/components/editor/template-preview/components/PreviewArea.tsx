import { useEffect, useState } from 'react';
import type { ViewportType } from '~/components/editor/template-preview/types';
import { VIEWPORT_CONFIG } from '~/components/editor/template-preview/constants';

interface PreviewAreaProps {
  templateId: string;
  iframeSrc: string;
  viewport: ViewportType;
  isDark: boolean;
  isLoading: boolean;
  hasError: boolean;
  onLoad: () => void;
  onError: () => void;
  onRetry: () => void;
}

export function PreviewArea({
  templateId,
  iframeSrc,
  viewport,
  isDark,
  isLoading,
  hasError,
  onLoad,
  onError,
  onRetry,
}: PreviewAreaProps) {
  const [iframeKey, setIframeKey] = useState(0);

  // Log URL for debugging
  useEffect(() => {
    console.log('[PreviewArea] Loading iframe with src:', iframeSrc);
  }, [iframeSrc]);

  const handleRetryClick = () => {
    setIframeKey((prev) => prev + 1);
    onRetry();
  };

  return (
    <div
      className="flex-1 flex items-center justify-center p-6 overflow-hidden"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at center, #12121c 0%, #0c0c14 100%)'
          : 'radial-gradient(ellipse at center, #fafafa 0%, #f4f4f5 100%)',
        minHeight: '500px',
      }}
    >
      <div
        className="relative"
        style={{
          width: viewport === 'desktop' ? '100%' : `${VIEWPORT_CONFIG[viewport].width}px`,
          maxWidth: '100%',
          height: '100%',
          minHeight: '500px',
        }}
      >
        <div
          className="w-full rounded-xl overflow-hidden relative"
          style={{
            background: isDark ? '#0a0a0e' : '#fff',
            boxShadow:
              viewport !== 'desktop'
                ? '0 0 0 1px rgba(255,255,255,0.1), 0 25px 50px -12px rgba(0,0,0,0.5)'
                : '0 0 0 1px rgba(255,255,255,0.05)',
            height: '100%',
            minHeight: '500px',
          }}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ background: isDark ? 'rgba(10,10,14,0.95)' : 'rgba(255,255,255,0.95)' }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#4D5DD9] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-white/50">Loading preview...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ background: isDark ? '#0a0a0e' : '#fff' }}
            >
              <div className="text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                >
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Preview Unavailable</h3>
                <p className="text-sm text-white/50 mb-4">Unable to load template preview</p>
                <button
                  onClick={handleRetryClick}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Simple iframe - just use the proxy URL directly */}
          {!hasError && (
            <iframe
              key={iframeKey}
              src={iframeSrc}
              className="w-full border-0"
              style={{
                background: isDark ? '#0a0a0e' : '#fff',
                height: '100%',
                minHeight: '500px',
              }}
              onLoad={onLoad}
              onError={onError}
              title={`Template preview: ${templateId}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
