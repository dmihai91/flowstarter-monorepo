'use client';

import { useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SandboxChatPanel } from '@/components/editor/SandboxChatPanel';
import { SandboxPreviewPanel } from '@/components/editor/SandboxPreviewPanel';
import { CodeViewer } from '@/components/editor/CodeViewer';

type ViewMode = 'preview' | 'code';

export default function EditorProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = params.id as string;
  const template = searchParams.get('template') || undefined;
  const templateName = searchParams.get('templateName') || undefined;

  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [workspaceStatus, setWorkspaceStatus] = useState<'ready' | 'creating' | 'stopped' | 'error'>('creating');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [codeRefreshKey, setCodeRefreshKey] = useState(0);

  const handleFilesChanged = useCallback(() => {
    setCodeRefreshKey((k) => k + 1);
    // Re-check preview URL after files changed
    fetchPreviewUrl();
  }, []);

  const fetchPreviewUrl = useCallback(async () => {
    try {
      const res = await fetch(`/api/editor/files?projectId=${projectId}`);
      if (res.ok) {
        setWorkspaceStatus('ready');
      }
    } catch {
      // Workspace might not be ready yet
    }
  }, [projectId]);

  return (
    <div className="flex h-full">
      {/* Chat panel - left side */}
      <div className="w-[400px] min-w-[350px] max-w-[500px] border-r border-[var(--flow-border-default)] flex flex-col">
        <SandboxChatPanel
          projectId={projectId}
          templateName={templateName}
          onFilesChanged={handleFilesChanged}
        />
      </div>

      {/* Right side - Preview or Code */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--flow-border-default)] bg-[var(--flow-bg-secondary)]">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-[var(--flow-bg-elevated)] text-[var(--flow-text-primary)]'
                : 'text-[var(--flow-text-tertiary)] hover:text-[var(--flow-text-secondary)]'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'code'
                ? 'bg-[var(--flow-bg-elevated)] text-[var(--flow-text-primary)]'
                : 'text-[var(--flow-text-tertiary)] hover:text-[var(--flow-text-secondary)]'
            }`}
          >
            Code
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {viewMode === 'preview' ? (
            <SandboxPreviewPanel
              previewUrl={previewUrl}
              workspaceStatus={workspaceStatus}
            />
          ) : (
            <CodeViewer
              projectId={projectId}
              refreshKey={codeRefreshKey}
            />
          )}
        </div>
      </div>
    </div>
  );
}
