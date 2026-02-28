'use client';

import { useState, useRef } from 'react';
import { Button, Spinner, StatusDot } from '@flowstarter/flow-design-system';

interface SandboxPreviewPanelProps {
  previewUrl?: string;
  workspaceStatus?: 'ready' | 'creating' | 'stopped' | 'error';
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function SandboxPreviewPanel({ previewUrl, workspaceStatus = 'creating' }: SandboxPreviewPanelProps) {
  const [url, setUrl] = useState(previewUrl || '');
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const refresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const statusColor = {
    ready: 'success',
    creating: 'warning',
    stopped: 'neutral',
    error: 'error',
  } as const;

  return (
    <div className="flex flex-col h-full bg-[var(--flow-bg-secondary)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--flow-border-default)]">
        <StatusDot color={statusColor[workspaceStatus]} size="sm" />

        {/* URL bar */}
        <div className="flex-1 flex items-center bg-[var(--flow-bg-tertiary)] rounded-md px-3 py-1.5 text-sm font-mono text-[var(--flow-text-tertiary)]">
          <span className="truncate">{url || 'No preview available'}</span>
        </div>

        {/* Refresh */}
        <Button variant="ghost" size="sm" onClick={refresh} disabled={!previewUrl}>
          ↻
        </Button>

        {/* Device toggles */}
        <div className="flex gap-0.5 border-l border-[var(--flow-border-default)] pl-2">
          {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
            <Button
              key={d}
              variant={device === d ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDevice(d)}
            >
              {d === 'desktop' ? '🖥' : d === 'tablet' ? '📱' : '📱'}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-[var(--flow-bg-primary)]">
        {previewUrl ? (
          <div
            className="h-full transition-all duration-300"
            style={{
              width: deviceWidths[device],
              maxWidth: '100%',
            }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setUrl(previewUrl)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[var(--flow-text-muted)]">
            {workspaceStatus === 'creating' ? (
              <>
                <Spinner />
                <p className="text-sm">Setting up workspace...</p>
              </>
            ) : (
              <>
                <div className="text-4xl">🖥</div>
                <p className="text-sm">Preview will appear here</p>
                <p className="text-xs">Start chatting to build your site</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
