'use client';

// Entry screen — sneak-peek-first funnel:
//   describe business → instant anonymous preview (no account) →
//   "create account & start the build (€50)" only when they want the real thing.
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import type { SiteSpec } from '@flowstarter/build-engine';
import { Logo, AgentAvatar, AgentLabel, ThemeToggle, Dots } from '@/components/ui';
import { DemoFrame } from '@/components/demo-frame';
import { Icons } from '@/components/icons';
import { useIsMobile } from '@/components/theme';
import { AGENTS, AGENT_LIST } from '@/lib/agents';
import { api } from '@/lib/client-api';
import { track } from '@/lib/analytics';

const PENDING_KEY = 'fs-pending-draft'; // {description, spec} stashed across the auth redirect
const PLACEHOLDER = 'e.g. A two-chair barbershop in Oakland — fades, beard trims, walk-ins welcome.';

export function EntryScreen({
  pricing,
  contactEmail,
}: {
  pricing: { headline: string; build: string; final: string; total: string; monthly: string };
  contactEmail: string;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [val, setVal] = React.useState('');
  const [spec, setSpec] = React.useState<SiteSpec | null>(null);
  const [peeking, setPeeking] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // 1) Free anonymous sneak peek — no account required.
  const sneakPeek = async () => {
    const text = val.trim();
    if (text.length < 10) {
      setError('Tell us a bit more — a sentence or two is plenty.');
      return;
    }
    setPeeking(true);
    setError(null);
    try {
      track('business_submitted', { length: text.length, anonymous: true });
      const res = await api<{ spec: SiteSpec }>('/api/demo-preview', {
        method: 'POST',
        body: JSON.stringify({ businessDescription: text }),
      });
      setSpec(res.spec);
      track('demo_generated', { anonymous: true });
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setPeeking(false);
    }
  };

  // 2) Create account (if needed) + project, then continue to refinements & the €50 step.
  const startBuild = React.useCallback(
    async (description: string, draft: SiteSpec) => {
      if (!isSignedIn) {
        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify({ description, spec: draft }));
        } catch {}
        setStarting(true);
        router.push('/sign-up?redirect_url=/');
        return;
      }
      setStarting(true);
      setError(null);
      try {
        const { projectId } = await api<{ projectId: string }>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({ businessDescription: description, demoSpec: draft }),
        });
        router.push(`/p/${projectId}/demo`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setStarting(false);
      }
    },
    [isSignedIn, router],
  );

  // Resume a draft stashed before the auth redirect.
  React.useEffect(() => {
    if (!isSignedIn) return;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) {
        sessionStorage.removeItem(PENDING_KEY);
        const draft = JSON.parse(raw) as { description: string; spec: SiteSpec };
        setVal(draft.description);
        setSpec(draft.spec);
        void startBuild(draft.description, draft.spec);
      }
    } catch {}
  }, [isSignedIn, startBuild]);

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

      <div style={{ flex: 1, padding: isMobile ? '10px 18px 40px' : '10px 30px 50px' }}>
        <div style={{ width: 'min(860px, 100%)', margin: '0 auto' }}>
          {/* headline */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: isMobile ? 26 : 36, marginTop: isMobile ? 8 : 26 }}>
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
              Describe your business in a sentence and watch the crew draft your brand and homepage —
              free, no account, right here.
            </p>
          </div>

          {/* description composer */}
          <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: 8, animationDelay: '.08s' }}>
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void sneakPeek();
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px 8px',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                ⌘↵ to preview · free, no account needed
              </span>
              <button className="btn btn-grad" disabled={peeking} onClick={() => void sneakPeek()}>
                {peeking ? (
                  <>
                    The crew is drafting <Dots />
                  </>
                ) : (
                  <>
                    {spec ? 'Draft it again' : 'Show me a sneak peek'} <Icons.arrow size={16} />
                  </>
                )}
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

          {/* ---- the sneak peek ---- */}
          {spec && (
            <div ref={previewRef} className="fade-up" style={{ marginTop: 34, scrollMarginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Your sneak peek</div>
                  <h2 className="serif" style={{ fontSize: 32, margin: 0, letterSpacing: '-.02em' }}>
                    Meet <span className="grad-text">{spec.brand.name}</span>.
                  </h2>
                </div>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                  drafted by {AGENTS.brand.name} & {AGENTS.copy.name} in seconds
                </span>
              </div>

              <DemoFrame spec={spec} lockNote="Create your account to refine it and have the crew build the real thing." />

              {/* Vera clarifies the deal before any account or payment */}
              <div className="glass" style={{ marginTop: 20, borderRadius: 'var(--r-lg)', padding: '20px 22px' }}>
                <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                  <AgentAvatar agent={AGENTS.research} size={40} active />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5 }}>{AGENTS.research.name}</span>
                      <span className="mono" style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: AGENTS.research.color }}>
                        {AGENTS.research.role}
                      </span>
                    </div>
                    <p className="serif" style={{ fontSize: 16.5, lineHeight: 1.5, margin: '0 0 12px', color: 'var(--ink)' }}>
                      Like the direction? Here’s exactly what happens next — no surprises:
                    </p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
                      {[
                        'Create a free account (just an email) — you get 3 refinement prompts on this draft.',
                        `${pricing.build} starts the real build. You watch the crew work live, every step visible. It's non-refundable once they start.`,
                        `You review the finished site before paying the ${pricing.final} delivery — launch it with us or take the code.`,
                        `If you launch: ${pricing.monthly}/month covers hosting on our servers, your domain, updates and AI edits. If you change your mind after the build: you keep a brand kit PDF (assets + strategy), the code stays with us.`,
                      ].map((t, i) => (
                        <li key={i} style={{ display: 'flex', gap: 9, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                          <Icons.check size={15} stroke={2.4} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA: account → refinements → €50 */}
              <div className="glass-3d" style={{ marginTop: 18, padding: '24px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                <div>
                  <h3 className="serif" style={{ fontSize: 24, margin: '0 0 6px' }}>Ready to make it real?</h3>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, maxWidth: 420, lineHeight: 1.5 }}>
                    {pricing.headline}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                  <button
                    className="btn btn-grad"
                    disabled={starting}
                    onClick={() => void startBuild(val.trim(), spec)}
                    style={{ padding: '14px 24px', fontSize: 15.5, justifyContent: 'center' }}
                  >
                    {starting
                      ? isSignedIn
                        ? 'Setting up your project…'
                        : 'Taking you to sign-up…'
                      : isSignedIn
                        ? 'Continue — refine & start the build'
                        : 'Create my account & continue'}{' '}
                    <Icons.arrow size={17} />
                  </button>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>
                    account is free · the build starts at {pricing.build}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* total price always visible before any payment */}
          {!spec && (
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
          )}

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
