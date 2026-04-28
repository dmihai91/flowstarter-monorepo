'use client';

import { useState } from 'react';

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

  return (
    <div className="preview-shell reveal" data-delay="2">
      {loaded ? (
        <iframe
          src={previewPath}
          title={`${title} — live preview`}
          loading="eager"
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
