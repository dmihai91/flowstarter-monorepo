'use client';

import { FlowBackground } from '@flowstarter/flow-design-system';
import { PreviewLoading } from './PreviewLoading';

interface PreviewPanelProps {
  previewHtml?: string | null;
  previewUrl?: string | null;
  projectName?: string;
  isGenerating?: boolean;
  onFullscreen?: () => void;
  loadingMessage?: string;
}

export function PreviewPanel({
  previewHtml,
  previewUrl,
  projectName = 'Your website',
  isGenerating = false,
}: PreviewPanelProps) {
  // Determine if we have a preview to show
  const hasPreview = previewHtml || previewUrl;
  return (
    <div className="relative flex flex-col min-h-0 flex-1 overflow-hidden">
      {/* Preview Content */}
      <div className="flex-1 relative overflow-hidden backdrop-blur-xl dark:bg-[#1b1b25]/80 bg-white/80">
        {/* Background gradient - Figma-style blurred ellipses */}
        <FlowBackground variant="dashboard" />

        {hasPreview ? (
          <div className="absolute inset-0 w-full h-full">
            {previewUrl ? (
              // Use URL-based preview (from Convex/Daytona)
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 bg-white dark:bg-gray-950"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            ) : (
              // Use HTML-based preview (srcDoc)
              <iframe
                srcDoc={previewHtml || ''}
                className="w-full h-full border-0 bg-white dark:bg-gray-950"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <PreviewLoading
              projectName={projectName}
              isGenerating={isGenerating}
            />
          </div>
        )}
      </div>
    </div>
  );
}
