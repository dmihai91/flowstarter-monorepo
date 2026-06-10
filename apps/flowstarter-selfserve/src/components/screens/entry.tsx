'use client';

// Entry screen — port of the prototype's entry + idea-input, focused on the
// single v1 path: "I already have a business". The "idea" door is a clean
// extension point, replaced for now by nothing; custom work routes to email.
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Logo, AgentAvatar, AgentLabel, ThemeToggle } from '@/components/ui';
import { Icons } from '@/components/icons';
import { useIsMobile } from '@/components/theme';
import { AGENT_LIST } from '@/lib/agents';
import { api } from '@/lib/client-api';
import { track } from '@/lib/analytics';

const PENDING_KEY = 'fs-pending-description';
const PLACEHOLDER = 'e.g. A two-chair barbershop in Oakland — fades, beard trims, walk-ins welcome.';

export function EntryScreen({
  pricing,
  contactEmail,
}: {
  pricing: { headline: string; build: string; total: string; monthly: string };
  contactEmail: string;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [val, setVal] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const submit = React.useCallback(
    async (description: string) => {
      const text = description.trim();
      if (text.length < 10) {
        setError('Tell us a bit more — a sentence or two is plenty.');
        return;
      }
      if (!isSignedIn) {
        // Email/account required before demo generation — Clerk gate.
        // Set busy first: in dev the /sign-up route compiles on first hit and
        // the click otherwise looks like it did nothing.
        setBusy(true);
        setError(null);
        try {
          sessionStorage.setItem(PENDING_KEY, text);
        } catch {}
        router.push('/sign-up?redirect_url=/');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        track('business_submitted', { length: text.length });
        const { projectId } = await api<{ projectId: string }>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({ businessDescription: text }),
        });
        router.push(`/p/${projectId}/demo`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setBusy(false);
      }
    },
    [isSignedIn, router],
  );

  // Resume a description stashed before the auth redirect.
  React.useEffect(() => {
    if (!isSignedIn) return;
    try {
      const pending = sessionStorage.getItem(PENDING_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_KEY);
        setVal(pending);
        void submit(pending);
      }
    } catch {}
  }, [isSignedIn, submit]);

  return (
    <div className="scroll" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* slim top brand */}
      <div
        style={{
          padding: isMobile ? '16px 18px' : '22px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Logo size={22} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <div
              className="mono"
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                fontSize: 11,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
                whiteSpace: 'nowrap',
              }}
            >
              <Icons.flow size={14} /> Describe · Demo · Build · Launch
            </div>
          )}
          <ThemeToggle />
          {isSignedIn && <UserButton />}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: isMobile ? '10px 18px 40px' : '10px 30px 50px' }}>
        <div style={{ width: 'min(760px, 100%)' }}>
          {/* headline */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: isMobile ? 26 : 36 }}>
            <div className="eyebrow" style={{ marginBottom: 18, lineHeight: 1.7 }}>
              {isMobile ? 'Agents do the building' : 'From business to online — agents do the building'}
            </div>
            <h1 className="serif" style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.02, margin: 0, letterSpacing: '-.02em' }}>
              You advise.
              <br />
              The agents <span className="grad-text">build it.</span>
            </h1>
            <p
              style={{
                fontSize: isMobile ? 16 : 18,
                color: 'var(--ink-2)',
                maxWidth: 540,
                margin: '22px auto 0',
                lineHeight: 1.5,
                textWrap: 'pretty',
              }}
            >
              Describe your business in a sentence. Watch a free demo of your brand and homepage —
              then a crew of agents builds the real thing.
            </p>
          </div>

          {/* description composer */}
          <div
            className="fade-up glass"
            style={{ borderRadius: 'var(--r-lg)', padding: 8, animationDelay: '.08s' }}
          >
            <textarea
              ref={ref}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit(val);
              }}
              placeholder={PLACEHOLDER}
              rows={3}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                font: 'inherit',
                fontSize: 17,
                lineHeight: 1.5,
                color: 'var(--ink)',
                padding: '14px 14px 6px',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 8px', gap: 10, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                ⌘↵ to continue · free demo, no card needed
              </span>
              <button className="btn btn-grad" disabled={busy} onClick={() => void submit(val)}>
                {busy ? (isSignedIn ? 'Spinning up the crew…' : 'Taking you to sign-up…') : 'Show me my demo'}{' '}
                <Icons.arrow size={16} />
              </button>
            </div>
          </div>
          {error && (
            <div
              className="fade-up"
              style={{
                marginTop: 12,
                padding: '10px 16px',
                borderRadius: 12,
                background: 'color-mix(in srgb, var(--neg) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--neg) 35%, transparent)',
                color: 'var(--neg)',
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}
          {!isSignedIn && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)', marginTop: 12 }}>
              You’ll create an account (just an email) before the demo is generated.
            </p>
          )}

          {/* total price always visible before any payment */}
          <div className="fade-up" style={{ textAlign: 'center', marginTop: 22, animationDelay: '.16s' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 99,
                border: '1px solid var(--line)',
                background: 'var(--paper-2)',
                fontSize: 13.5,
                color: 'var(--ink-2)',
              }}
            >
              <Icons.card size={15} /> {pricing.headline}
            </span>
          </div>

          {/* agent cast strip */}
          <div
            className="fade-up"
            style={{
              marginTop: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
              flexWrap: 'wrap',
              animationDelay: '.24s',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Your build team:</span>
            {AGENT_LIST.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <AgentAvatar agent={a} size={30} ring={false} />
                <AgentLabel agent={a} />
              </div>
            ))}
          </div>

          {/* concierge replacement: simple email link */}
          <p className="fade-up" style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)', marginTop: 26, animationDelay: '.3s' }}>
            Need something custom?{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Email us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
