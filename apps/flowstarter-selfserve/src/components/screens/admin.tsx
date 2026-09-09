'use client';

// Minimal internal admin: builds list, statuses, retry + refund buttons.
import React from 'react';
import { TopBar, Dots } from '@/components/ui';
import { Icons } from '@/components/icons';
import { api } from '@/lib/client-api';

interface AdminBuild {
  id: string;
  projectId: string;
  status: string;
  attempt: number;
  progress: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  email: string | null;
  business: string | null;
  outcome: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--pos)',
  running: 'var(--accent)',
  queued: 'var(--ink-3)',
  retrying: 'var(--warn)',
  failed: 'var(--warn)',
  terminal_failed: 'var(--neg)',
};

export function AdminScreen() {
  const [builds, setBuilds] = React.useState<AdminBuild[] | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const data = await api<{ builds: AdminBuild[] }>('/api/admin/builds');
      setBuilds(data.builds);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  React.useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const act = async (buildId: string, action: 'retry' | 'refund') => {
    setBusy(`${buildId}:${action}`);
    setError(null);
    try {
      await api(`/api/admin/builds/${buildId}/${action}`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="build" />
      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 26px 60px' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Internal</div>
          <h1 className="serif" style={{ fontSize: 30, margin: '0 0 20px' }}>Builds</h1>
          {error && <div style={{ color: 'var(--neg)', fontSize: 14, marginBottom: 12 }}>{error}</div>}
          {!builds ? (
            <span style={{ color: 'var(--ink-2)' }}>
              Loading <Dots />
            </span>
          ) : builds.length === 0 ? (
            <p style={{ color: 'var(--ink-2)' }}>No builds yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {builds.map((b) => (
                <div
                  key={b.id}
                  className="glass"
                  style={{ borderRadius: 'var(--r-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: STATUS_COLOR[b.status] ?? 'var(--ink-2)',
                      minWidth: 120,
                      fontWeight: 600,
                    }}
                  >
                    {b.status} {b.attempt > 0 && `(#${b.attempt + 1})`}
                  </span>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.email ?? '—'}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
                      {b.business ?? ''}
                    </div>
                    {b.error && <div style={{ fontSize: 12, color: 'var(--neg)', marginTop: 2 }}>{b.error}</div>}
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {b.progress}% · {new Date(b.createdAt).toLocaleString()} {b.outcome ? `· ${b.outcome}` : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '7px 13px', fontSize: 12.5 }}
                      disabled={busy !== null || b.status === 'running'}
                      onClick={() => void act(b.id, 'retry')}
                    >
                      <Icons.refresh size={13} /> {busy === `${b.id}:retry` ? '…' : 'Retry'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '7px 13px', fontSize: 12.5, color: 'var(--neg)' }}
                      disabled={busy !== null}
                      onClick={() => void act(b.id, 'refund')}
                    >
                      <Icons.card size={13} /> {busy === `${b.id}:refund` ? '…' : 'Refund €50'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
