'use client';

// "Try it" funnel overlay — ported from the design bundle's funnel.jsx, wired
// to the real backend: idea → crew drafts (anonymous /api/demo-preview) →
// create account & continue (project created from the draft, on to /demo).
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { renderSiteHtml, type SiteSpec } from '@flowstarter/build-engine';
import { api } from '@/lib/client-api';
import { track } from '@/lib/analytics';
import { TypeOnce } from '@/components/typewriter';

export const OPEN_FUNNEL_EVENT = 'open-funnel';
const PENDING_KEY = 'fs-pending-draft';

const FUNNEL_EXAMPLES = [
  'A weekend pottery studio for total beginners',
  'A two-chair barbershop, walk-ins welcome',
  'A sourdough subscription for my neighborhood',
];

const DRAFT_TASKS = [
  { who: 'Vera', color: '#3E86E8', text: 'Checking demand signals for your business…' },
  { who: 'Iris', color: '#B964E8', text: 'Drafting a name and palette…' },
  { who: 'Quinn', color: '#E89B2F', text: 'Writing your copy, in your voice…' },
  { who: 'Dash', color: '#2FB87A', text: 'Assembling the page — layout, sections, mobile…' },
];

/** Open the funnel; pass a description to start drafting immediately. */
export function openFunnel(idea?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_FUNNEL_EVENT, { detail: { idea } }));
}

export function FunnelOverlay({
  pricing,
  slots,
}: {
  pricing: { build: string; final: string; total: string; monthly: string };
  slots?: { left: number; cap: number };
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(1); // 1 idea · 2 draft · 3 continue
  const [idea, setIdea] = React.useState('');
  const [draft, setDraft] = React.useState<SiteSpec | null>(null);
  const [draftHtml, setDraftHtml] = React.useState<string | null>(null);
  const [agentBuilt, setAgentBuilt] = React.useState(true);
  const [taskIdx, setTaskIdx] = React.useState(0);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [leadEmail, setLeadEmail] = React.useState('');
  const [leadState, setLeadState] = React.useState<'idle' | 'sending' | 'sent'>('idle');

  const emailDraft = async () => {
    if (!draft || leadState !== 'idle' || !/.+@.+\..+/.test(leadEmail)) return;
    setLeadState('sending');
    try {
      await api('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          email: leadEmail.trim(),
          businessDescription: idea,
          demoSpec: draft,
          demoHtml: draftHtml ?? undefined,
        }),
      });
      track('draft_email_captured');
      setLeadState('sent');
    } catch {
      setLeadState('idle');
    }
  };

  // Keep a stable handle on startDraft for the open-event listener.
  const startDraftRef = React.useRef<(text?: string) => Promise<void>>(async () => {});

  React.useEffect(() => {
    const on = (e: Event) => {
      setOpen(true);
      const idea = (e as CustomEvent<{ idea?: string }>).detail?.idea?.trim();
      if (idea && idea.length >= 10) {
        setIdea(idea);
        void startDraftRef.current(idea);
      }
    };
    window.addEventListener(OPEN_FUNNEL_EVENT, on);
    return () => window.removeEventListener(OPEN_FUNNEL_EVENT, on);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Resume a draft stashed before the auth redirect (account → project → demo).
  const startBuild = React.useCallback(
    async (description: string, spec: SiteSpec, html: string | null) => {
      if (!isSignedIn) {
        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify({ description, spec, html }));
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
          body: JSON.stringify({ businessDescription: description, demoSpec: spec, demoHtml: html ?? undefined }),
        });
        router.push(`/p/${projectId}/demo`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setStarting(false);
      }
    },
    [isSignedIn, router],
  );

  React.useEffect(() => {
    if (!isSignedIn) return;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) {
        sessionStorage.removeItem(PENDING_KEY);
        const pending = JSON.parse(raw) as { description: string; spec: SiteSpec; html?: string | null };
        setOpen(true);
        setIdea(pending.description);
        setDraft(pending.spec);
        setDraftHtml(pending.html ?? null);
        setStep(3);
        void startBuild(pending.description, pending.spec, pending.html ?? null);
      }
    } catch {}
  }, [isSignedIn, startBuild]);

  // step 2: stream the drafting tasks while the real preview generates.
  const startDraft = async (text?: string) => {
    const v = (text ?? idea).trim();
    if (v.length < 10) {
      setError('Tell us a bit more — a sentence is plenty.');
      return;
    }
    setIdea(v);
    setError(null);
    setStep(2);
    setTaskIdx(0);
    setDraft(null);
    track('business_submitted', { anonymous: true, length: v.length });

    const ticker = setInterval(() => setTaskIdx((i) => Math.min(i + 1, DRAFT_TASKS.length - 1)), 2600);
    try {
      const res = await api<{ spec: SiteSpec; html: string; agentBuilt: boolean }>('/api/demo-preview', {
        method: 'POST',
        body: JSON.stringify({ businessDescription: v }),
      });
      setDraft(res.spec);
      setDraftHtml(res.html);
      setAgentBuilt(res.agentBuilt);
      setTaskIdx(DRAFT_TASKS.length);
      track('demo_generated', { anonymous: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStep(1);
    } finally {
      clearInterval(ticker);
    }
  };
  startDraftRef.current = startDraft;

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(1);
      setError(null);
    }, 300);
  };

  if (!open) return null;

  return (
    <div className="funnel-overlay" onClick={close}>
      <div className={`funnel-card${step === 2 && draft ? ' funnel-card--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="funnel-close" onClick={close} aria-label="Close">
          ✕
        </button>

        <div className="funnel-steps">
          {[1, 2, 3].map((n) => (
            <span key={n} className={'funnel-step-dot' + (step >= n ? ' on' : '')} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Free · no account needed</div>
            <h2 className="serif" style={{ fontSize: 30, marginBottom: 10 }}>What do you do?</h2>
            <p style={{ fontSize: 15, marginBottom: 22, color: 'var(--ink-2)' }}>
              One sentence is plenty. A real agent builds a first draft of your site — free, right now.
            </p>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              autoFocus
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void startDraft();
                }
              }}
              placeholder={'e.g. ' + FUNNEL_EXAMPLES[0]}
              style={{
                width: '100%',
                font: 'inherit',
                fontSize: 16,
                lineHeight: 1.5,
                color: 'var(--ink)',
                background: 'var(--card)',
                border: '1.5px solid var(--line)',
                borderRadius: 16,
                padding: '15px 17px',
                resize: 'none',
                outline: 'none',
                marginBottom: 14,
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {FUNNEL_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => void startDraft(ex)}
                  style={{
                    font: 'inherit',
                    cursor: 'pointer',
                    fontSize: 13,
                    background: 'var(--card)',
                    border: '1.5px dashed var(--line)',
                    color: 'var(--ink-2)',
                    borderRadius: 99,
                    padding: '7px 14px',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
            {error && <p style={{ color: 'var(--neg)', fontSize: 13.5, marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => void startDraft()}>
              Let the crew draft it →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>The crew is drafting</div>
            <h2 className="serif" style={{ fontSize: 24, marginBottom: 6, lineHeight: 1.25 }}>“{idea}”</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, margin: '24px 0' }}>
              {DRAFT_TASKS.map((t, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: i < taskIdx + 1 ? 1 : 0.35, transition: 'opacity .3s' }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--mono)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: t.color,
                      background: t.color + '1f',
                      border: `1px solid ${t.color}66`,
                    }}
                  >
                    {t.who[0]}
                  </span>
                  <span style={{ fontSize: 14.5, color: 'var(--ink-2)' }}>
                    <TypeOnce text={t.text} active={i === taskIdx && !draft} />
                  </span>
                  {i < taskIdx ? (
                    <span style={{ color: 'var(--pos)', fontWeight: 700 }}>✓</span>
                  ) : i === taskIdx && !draft ? (
                    <span className="dots" style={{ color: t.color }}>
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {draft && (
              <div style={{ animation: 'fadeUp .5s var(--ease-out) both' }}>
                {!agentBuilt && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      marginBottom: 14,
                      borderRadius: 12,
                      background: 'color-mix(in srgb, var(--warn) 12%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--warn) 35%, transparent)',
                      fontSize: 13.5,
                      color: 'var(--ink-2)',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--warn)' }}>Heads up:</span>
                    the agent was overloaded, so this is a rough sketch — not its real work.
                    <button
                      onClick={() => void startDraft(idea)}
                      style={{ font: 'inherit', fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap' }}
                    >
                      Ask the agent again →
                    </button>
                  </div>
                )}
                {/* the ACTUAL generated site, sneak-peeked: top visible, rest veiled */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden', marginBottom: 20, boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                    <span style={{ display: 'flex', gap: 6 }}>
                      {['#E0655A', '#E8B14C', '#5FB97A'].map((c) => (
                        <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c }} />
                      ))}
                    </span>
                    <span className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 11.5, color: 'var(--ink-3)' }}>
                      sneak peek · {draft.brand.name.toLowerCase().replace(/\s+/g, '')}.com
                    </span>
                  </div>
                  {/* the full agent-built page — scroll it, inspect everything */}
                  <iframe
                    title={`${draft.brand.name} preview`}
                    srcDoc={draftHtml ?? renderSiteHtml(draft)}
                    style={{ width: '100%', height: 460, border: 'none', display: 'block', background: '#fff' }}
                    sandbox=""
                  />
                </div>
                {/* the incentive: what the paid build adds on top of this draft */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.2fr',
                    gap: 0,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid var(--line)',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ padding: '16px 18px', background: 'var(--paper-2)' }}>
                    <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', color: 'var(--ink-3)', marginBottom: 8 }}>
                      THIS DRAFT · FREE
                    </div>
                    {['Real page from your prompt', '10 agent prompts to shape it', 'Yours to explore'].map((t) => (
                      <div key={t} style={{ fontSize: 13, color: 'var(--ink-2)', padding: '3px 0' }}>✓ {t}</div>
                    ))}
                  </div>
                  <div style={{ padding: '16px 18px', background: 'color-mix(in srgb, var(--accent) 9%, var(--card))' }}>
                    <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: 8 }}>
                      THE FULL BUILD · {pricing.build} TO START
                      {slots && slots.left > 0 && slots.left <= slots.cap / 2 ? ` · ${slots.left} SLOTS LEFT` : ''}
                    </div>
                    {[
                      'Gallery, packages, FAQ & booking wired',
                      'Senior crew pass: design, copy, mobile polish',
                      'Live on your domain, hosted & managed',
                      `${pricing.build} counts toward your ${pricing.total} total`,
                    ].map((t) => (
                      <div key={t} style={{ fontSize: 13, color: 'var(--ink)', padding: '3px 0', fontWeight: 500 }}>✦ {t}</div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(3)}>
                  I like it — see the full demo →
                </button>
                <p style={{ fontSize: 12.5, textAlign: 'center', marginTop: 10, color: 'var(--ink-2)' }}>
                  Scroll it — this is a real page the agent built from your prompt · free account unlocks 10 agent prompts
                </p>
                {/* bounce-cohort capture: save the draft to their inbox */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {leadState === 'sent' ? (
                    <span style={{ fontSize: 13, color: 'var(--pos)', fontWeight: 600 }}>✓ Sent — your draft link is in your inbox.</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Not ready?</span>
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void emailDraft(); }}
                        placeholder="you@business.com"
                        style={{ font: 'inherit', fontSize: 13.5, padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', outline: 'none', width: 200 }}
                      />
                      <button
                        onClick={() => void emailDraft()}
                        disabled={leadState === 'sending'}
                        style={{ font: 'inherit', fontSize: 13.5, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {leadState === 'sending' ? 'Sending…' : 'Email me this draft'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && draft && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Almost there</div>
            <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>
              Save {draft.brand.name} & keep going.
            </h2>
            <p style={{ fontSize: 14.5, marginBottom: 18, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              A free account saves your draft and unlocks 10 prompts with a real agent — it rebuilds the page after every message.
              When you’re happy, {pricing.build} starts the real build — you watch the crew live, and
              pay {pricing.final} only after you’ve seen the finished site. Then {pricing.monthly}/month
              covers hosting, your domain and AI edits.
            </p>
            <ul style={{ margin: '0 0 22px', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
              {[
                ...(slots && slots.left > 0 && slots.left <= slots.cap / 2
                  ? [`${slots.left} of ${slots.cap} build slots left this month`]
                  : []),
                'Free account — just an email, then 10 real agent prompts',
                `Total is ${pricing.total} + ${pricing.monthly}/mo if you launch with us — no other costs`,
                `Change your mind after the build? Keep a brand kit (assets + strategy); the ${pricing.build} is non-refundable`,
              ].map((t) => (
                <li key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--pos)', fontWeight: 700 }}>✓</span> {t}
                </li>
              ))}
            </ul>
            {error && <p style={{ color: 'var(--neg)', fontSize: 13.5, marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <button
              className="btn btn-primary btn-lg"
              disabled={starting}
              style={{ width: '100%', justifyContent: 'center', opacity: starting ? 0.7 : 1 }}
              onClick={() => void startBuild(idea, draft, draftHtml)}
            >
              {starting
                ? isSignedIn
                  ? 'Setting up your project…'
                  : 'Taking you to sign-up…'
                : isSignedIn
                  ? 'Continue to my demo →'
                  : 'Create my free account →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
