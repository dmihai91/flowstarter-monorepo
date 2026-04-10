'use client';

import { useEffect, useState } from 'react';
import { EditorShell } from '@/components/EditorShell';
import { WorkspaceLoader } from '@/components/WorkspaceLoader';

interface WorkspaceInfo {
  sandboxUrl: string;
  t3AuthToken: string;
  status: 'provisioning' | 'ready' | 'error';
  error?: string;
}

interface ProjectEditorProps {
  projectId: string;
  handoffToken?: string;
  mode: 'editor' | 'client';
  userId: string;
}

export function ProjectEditor({
  projectId,
  handoffToken,
  mode,
  userId,
}: ProjectEditorProps) {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initWorkspace() {
      try {
        // Check if workspace already exists
        const statusRes = await fetch(`/api/workspace/${projectId}`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.status === 'ready') {
            setWorkspace(data);
            setLoading(false);
            return;
          }
        }

        // Create new workspace
        const createRes = await fetch('/api/workspace/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            handoffToken,
            mode,
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({ error: 'Failed to create workspace' }));
          setError(err.error ?? 'Failed to create workspace');
          setLoading(false);
          return;
        }

        // Poll for workspace readiness
        const pollInterval = setInterval(async () => {
          const res = await fetch(`/api/workspace/${projectId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'ready') {
              setWorkspace(data);
              setLoading(false);
              clearInterval(pollInterval);
            } else if (data.status === 'error') {
              setError(data.error ?? 'Workspace provisioning failed');
              setLoading(false);
              clearInterval(pollInterval);
            }
          }
        }, 2000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (loading) {
            setError('Workspace provisioning timed out');
            setLoading(false);
          }
        }, 300000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    initWorkspace();
  }, [projectId, handoffToken, mode]);

  if (loading) {
    return <WorkspaceLoader projectId={projectId} />;
  }

  if (error || !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-white">
            Something went wrong
          </h2>
          <p className="text-sm text-white/50">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium rounded-lg
                       bg-white/5 hover:bg-white/10 text-white/70
                       transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Build the T3 iframe URL with mode and auth token
  const t3Url = new URL(workspace.sandboxUrl);
  t3Url.searchParams.set('token', workspace.t3AuthToken);
  t3Url.searchParams.set('mode', mode);

  return <EditorShell projectId={projectId} t3Url={t3Url.toString()} mode={mode} />;
}
