'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { SiteSpec } from '@flowstarter/build-engine';
import { Logo } from '@/components/ui';
import { Icons } from '@/components/icons';
import { track } from '@/lib/analytics';

const PENDING_KEY = 'fs-pending-draft';

export function DraftView({
  description,
  spec,
  html,
  brandName,
}: {
  description: string;
  spec: SiteSpec | null;
  html: string | null;
  brandName: string;
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const resume = () => {
    track('draft_resumed', { fromEmail: true });
    try {
      if (spec) sessionStorage.setItem(PENDING_KEY, JSON.stringify({ description, spec, html }));
    } catch {}
    router.push(isSignedIn ? '/' : '/sign-up?redirect_url=/');
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div
        className="glass-2"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--line)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <a href="/" style={{ textDecoration: 'none' }}>
          <Logo size={18} />
        </a>
        <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
          Your saved draft · <strong>{brandName}</strong>
        </span>
        <button className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 13.5 }} onClick={resume}>
          Keep building <Icons.arrow size={14} />
        </button>
      </div>

      {html ? (
        <iframe
          title={`${brandName} draft`}
          srcDoc={html}
          sandbox=""
          style={{ flex: 1, width: '100%', border: 'none', display: 'block', background: '#fff', minHeight: '80dvh' }}
        />
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 30 }}>
          <p style={{ color: 'var(--ink-2)' }}>This draft has expired — describe your business again and the agent will redraw it in seconds.</p>
        </div>
      )}

      <div
        className="glass"
        style={{
          position: 'sticky',
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '14px 20px',
          borderTop: '1px solid var(--line)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>
          A free account unlocks <strong>10 prompts with the agent</strong> on this draft.
        </span>
        <button className="btn btn-grad" onClick={resume}>
          Continue where I left off <Icons.arrow size={15} />
        </button>
      </div>
    </div>
  );
}
