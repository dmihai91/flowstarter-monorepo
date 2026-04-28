'use client';

import { useEffect, useRef, useState } from 'react';

interface DeferredPreviewFrameProps {
  previewPath: string;
  title: string;
  thumbnailPath: string | null;
}

export function DeferredPreviewFrame({
  previewPath,
  title,
  thumbnailPath,
}: DeferredPreviewFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!loaded) return;

    const sendThemeToPreview = () => {
      const isDark = document.documentElement.classList.contains('dark');
      iframeRef.current?.contentWindow?.postMessage(
        {
          source: 'fs-preview',
          type: 'setTheme',
          value: isDark ? 'dark' : 'light',
        },
        '*'
      );
    };

    sendThemeToPreview();
    const observer = new MutationObserver(sendThemeToPreview);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [loaded]);

  return (
    <div className="preview-shell reveal" data-delay="2">
      {loaded ? (
        <iframe
          ref={iframeRef}
          src={previewPath}
          title={`${title} — live preview`}
          loading="eager"
          onLoad={() => {
            const isDark = document.documentElement.classList.contains('dark');
            iframeRef.current?.contentWindow?.postMessage(
              {
                source: 'fs-preview',
                type: 'setTheme',
                value: isDark ? 'dark' : 'light',
              },
              '*'
            );
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          className="preview-frame"
        />
      ) : (
        <div className="preview-poster">
          {thumbnailPath ? (
            <img
              src={thumbnailPath}
              alt={`${title} preview`}
              className="preview-poster-image"
              loading="eager"
            />
          ) : (
            <div className="preview-poster-placeholder">
              <span>Live preview ready</span>
            </div>
          )}
          <div className="preview-poster-overlay">
            <button
              type="button"
              className="preview-load-button"
              onClick={() => setLoaded(true)}
            >
              Load live preview
            </button>
            <p className="preview-load-note">
              Loads the full template with fonts, scripts and embedded widgets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
