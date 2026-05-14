'use client';

import { useEffect, useRef, useState } from 'react';

interface DeferredPreviewFrameProps {
  /**
   * URL to load in the iframe. Either a relative path to a self-hosted
   * static preview bundle (e.g. `/preview/dorin-portfolio/`) or an absolute URL of
   * an externally-hosted live site (e.g. `https://ux-journey.com/`).
   */
  previewUrl: string;
  /**
   * When `true`, the preview is a third-party site we don't control. We
   * skip the theme-sync postMessage handshake (cross-origin frames can't
   * receive our messages anyway, and they don't expect them) and warn
   * that the frame may be blocked by the target's X-Frame-Options /
   * frame-ancestors headers.
   */
  isExternal?: boolean;
  title: string;
  thumbnailPath: string | null;
  /** Optional dark-mode poster. Falls back to `thumbnailPath` if not given. */
  thumbnailPathDark?: string | null;
}

export function DeferredPreviewFrame({
  previewUrl,
  isExternal = false,
  title,
  thumbnailPath,
  thumbnailPathDark,
}: DeferredPreviewFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!loaded || isExternal) return;

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
  }, [loaded, isExternal]);

  return (
    <div className="preview-shell reveal" data-delay="2">
      {loaded ? (
        <iframe
          ref={iframeRef}
          src={previewUrl}
          title={`${title} — live preview`}
          loading="eager"
          onLoad={
            isExternal
              ? undefined
              : () => {
                  const isDark =
                    document.documentElement.classList.contains('dark');
                  iframeRef.current?.contentWindow?.postMessage(
                    {
                      source: 'fs-preview',
                      type: 'setTheme',
                      value: isDark ? 'dark' : 'light',
                    },
                    '*'
                  );
                }
          }
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          className="preview-frame"
        />
      ) : (
        <div className="preview-poster">
          {thumbnailPath ? (
            <>
              <img
                src={thumbnailPath}
                alt={`${title} preview`}
                className="preview-poster-image preview-poster-image--light"
                loading="eager"
              />
              {thumbnailPathDark ? (
                <img
                  src={thumbnailPathDark}
                  alt={`${title} preview dark`}
                  className="preview-poster-image preview-poster-image--dark"
                  loading="eager"
                />
              ) : null}
            </>
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
