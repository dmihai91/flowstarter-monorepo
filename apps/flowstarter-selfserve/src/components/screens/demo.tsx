'use client';

// Demo screen — the free limited preview: brand direction + hero visible,
// remaining sections locked/blurred. Max 3 refinement prompts, then the
// €50 checkout with the total price always in view and the EU waiver checkbox.
import React from 'react';
import type { SiteSpec } from '@flowstarter/build-engine';
import { TopBar, AgentAvatar, Dots } from '@/components/ui';
import { Icons } from '@/components/icons';
import { AGENTS } from '@/lib/agents';
import { api } from '@/lib/client-api';
import { track } from '@/lib/analytics';

interface ProjectPayload {
  project: {
    id: string;
    demo_spec: SiteSpec | null;
    demo_status: 'none' | 'generating' | 'ready' | 'failed';
    refinement_count: number;
    business_description: string;
  };
}

export function DemoScreen({
  projectId,
  pricing,
  maxRefinements,
}: {
  projectId: string;
  pricing: { headline: string; build: string; final: string; total: string; monthly: string };
  maxRefinements: number;
}) {
  const [spec, setSpec] = React.useState<SiteSpec | null>(null);
  const [status, setStatus] = React.useState<string>('loading');
  const [refsUsed, setRefsUsed] = React.useState(0);
  const [prompt, setPrompt] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [waiver, setWaiver] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const trackedGenerated = React.useRef(false);

  const load = React.useCallback(async () => {
    const data = await api<ProjectPayload>(`/api/projects/${projectId}`);
    setSpec(data.project.demo_spec);
    setStatus(data.project.demo_status);
    setRefsUsed(data.project.refinement_count);
    return data.project.demo_status;
  }, [projectId]);

  React.useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const s = await load();
        if (!stop && s === 'generating') setTimeout(tick, 1500);
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : 'Failed to load');
      }
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [load]);

  React.useEffect(() => {
    if (status === 'ready' && !trackedGenerated.current) {
      trackedGenerated.current = true;
      track('demo_generated', { projectId });
    }
  }, [status, projectId]);

  const refine = async () => {
    const p = prompt.trim();
    if (!p || busy) return;
    setBusy(true);
    setError(null);
    try {
      track('demo_prompt_used', { projectId, count: refsUsed + 1 });
      const res = await api<{ project: ProjectPayload['project'] }>(`/api/projects/${projectId}/refine`, {
        method: 'POST',
        body: JSON.stringify({ prompt: p }),
      });
      setSpec(res.project.demo_spec);
      setRefsUsed(res.project.refinement_count);
      setPrompt('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refinement failed');
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async () => {
    if (!waiver || checkingOut) return;
    setCheckingOut(true);
    setError(null);
    try {
      track('checkout_50_started', { projectId });
      const { url } = await api<{ url: string }>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ projectId, kind: 'build_fee', waiverAccepted: true }),
      });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      setCheckingOut(false);
    }
  };

  const refsLeft = maxRefinements - refsUsed;
  const [c1, c2] = spec?.brand.palette ?? ['#4D5DD9', '#9DB0F2'];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="demo" />
      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 26px 60px' }}>
          {status === 'generating' || status === 'loading' ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
                  {Object.values(AGENTS).map((a) => (
                    <AgentAvatar key={a.id} agent={a} size={38} active />
                  ))}
                </div>
                <h2 className="serif" style={{ fontSize: 28, margin: '0 0 8px' }}>
                  The crew is drafting your demo <Dots />
                </h2>
                <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>Brand direction and homepage hero — about 20 seconds.</p>
              </div>
            </div>
          ) : status === 'failed' ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh', textAlign: 'center' }}>
              <div>
                <h2 className="serif" style={{ fontSize: 26 }}>We hit a snag generating your demo.</h2>
                <a href="/" className="btn btn-primary" style={{ marginTop: 14 }}>
                  Try again
                </a>
              </div>
            </div>
          ) : spec ? (
            <>
              {/* header */}
              <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Your free demo</div>
                  <h1 className="serif" style={{ fontSize: 36, margin: 0, letterSpacing: '-.02em', lineHeight: 1.05 }}>
                    Meet <span className="grad-text">{spec.brand.name}</span>.
                  </h1>
                  <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: 480, lineHeight: 1.5 }}>
                    Brand direction and homepage hero, drafted by the crew. The full site unlocks with the build.
                  </p>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 12, color: 'var(--ink-3)', padding: '7px 13px', border: '1px solid var(--line)', borderRadius: 99 }}
                >
                  {refsLeft} of {maxRefinements} refinements left
                </div>
              </div>

              {/* demo preview: hero visible, rest locked */}
              <div className="fade-up" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                {/* browser chrome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#E0655A', '#E8B14C', '#5FB97A'].map((c) => (
                      <span key={c} style={{ width: 11, height: 11, borderRadius: 99, background: c }} />
                    ))}
                  </div>
                  <div className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
                    demo preview · {spec.brand.name.toLowerCase().replace(/\s+/g, '')}.com
                  </div>
                </div>

                {/* hero — fully visible */}
                <div style={{ background: spec.brand.palette[3], color: spec.brand.palette[2] }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 26px' }}>
                    <span className="serif" style={{ fontSize: 21 }}>{spec.brand.name}</span>
                    <span style={{ background: c1, color: '#fff', padding: '8px 16px', borderRadius: 99, fontWeight: 600, fontSize: 13 }}>
                      {spec.copy.cta}
                    </span>
                  </div>
                  <div style={{ padding: '36px 26px 42px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'center' }}>
                    <div>
                      <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: c1, marginBottom: 14 }}>
                        {spec.brand.tagline}
                      </div>
                      <h2 className="serif" style={{ fontSize: 36, lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-.02em' }}>
                        {spec.copy.hero}
                      </h2>
                      <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.55, margin: '0 0 20px' }}>{spec.copy.sub}</p>
                      <span style={{ background: c1, color: '#fff', padding: '12px 22px', borderRadius: 99, fontWeight: 600, fontSize: 14, display: 'inline-block' }}>
                        {spec.copy.cta}
                      </span>
                    </div>
                    <div style={{ aspectRatio: '4/5', maxHeight: 320, borderRadius: 18, background: `linear-gradient(150deg, ${c2}, ${c1})` }} />
                  </div>
                </div>

                {/* locked sections — blurred with overlay */}
                <div style={{ position: 'relative' }}>
                  <div className="demo-locked" aria-hidden style={{ background: spec.brand.palette[3], color: spec.brand.palette[2], padding: '8px 26px 36px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      {spec.copy.sections.map((s, i) => (
                        <div key={i} style={{ border: `1px solid ${c2}`, borderRadius: 14, padding: '18px' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: c1, marginBottom: 12 }} />
                          <div className="serif" style={{ fontSize: 18, marginBottom: 6 }}>{s.h}</div>
                          <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>{s.p}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ height: 90, marginTop: 16, borderRadius: 14, border: `1px dashed ${c2}` }} />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'color-mix(in srgb, var(--paper) 18%, transparent)',
                    }}
                  >
                    <div
                      className="glass"
                      style={{ borderRadius: 16, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 380, margin: 16 }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icons.lock size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>The rest unlocks with the build</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                          Full sections, contact & booking, mobile layout — built by the crew.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* refinement composer */}
              <div className="fade-up" style={{ marginTop: 18 }}>
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1.5px solid var(--line)',
                    borderRadius: 18,
                    padding: 8,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 8,
                    opacity: refsLeft > 0 ? 1 : 0.6,
                  }}
                >
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void refine();
                      }
                    }}
                    placeholder={refsLeft > 0 ? 'e.g. Make it warmer and friendlier, or: a punchier headline' : 'Refinements used — the full crew takes it from here'}
                    rows={1}
                    disabled={refsLeft <= 0 || busy}
                    style={{ flex: 1, minWidth: 0, fontFamily: 'var(--sans)', fontSize: 15, lineHeight: 1.45, color: 'var(--ink)', background: 'transparent', border: 'none', outline: 'none', resize: 'none', padding: '9px 6px', maxHeight: 140 }}
                  />
                  <button className="btn btn-primary" onClick={() => void refine()} disabled={refsLeft <= 0 || busy} style={{ padding: '11px 18px', fontSize: 14 }}>
                    {busy ? <Dots /> : <Icons.spark size={16} />} Refine
                  </button>
                </div>
              </div>

              {/* the info agent clarifies everything before any payment */}
              <div className="fade-up glass" style={{ marginTop: 26, borderRadius: 'var(--r-lg)', padding: '20px 22px' }}>
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
                      Before you pay anything, here’s exactly how this works — no surprises:
                    </p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
                      {[
                        `Today: ${pricing.build} starts the build. You'll watch the crew work live — every step visible.`,
                        `When it's done: you review the finished site first. Only then do you pay ${pricing.final} — to launch it with us or to take the code and go.`,
                        `If you launch with us: ${pricing.monthly}/month covers hosting on our servers, your domain, ongoing updates and AI edits. Cancel anytime.`,
                        `If you change your mind after the build: the ${pricing.build} isn't refundable (it paid for the crew's work), but you keep a brand kit PDF — logo direction, palette, all the copy, and a strategy one-pager. The site code stays with us.`,
                      ].map((t, i) => (
                        <li key={i} style={{ display: 'flex', gap: 9, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                          <Icons.check size={15} stroke={2.4} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* pricing + checkout */}
              <div className="fade-up glass-3d" style={{ marginTop: 18, padding: '26px 26px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ maxWidth: 520 }}>
                    <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 10 }}>Ready when you are</div>
                    <h3 className="serif" style={{ fontSize: 26, margin: '0 0 8px' }}>Let the crew build the real thing.</h3>
                    <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>{pricing.headline}</p>
                    <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
                      {[
                        'Full multi-section site, mobile-ready',
                        'Brand identity, voice & all the copy',
                        `Preview everything before the ${pricing.final} delivery payment`,
                      ].map((t) => (
                        <li key={t} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 14, color: 'var(--ink-2)' }}>
                          <Icons.check size={15} stroke={2.4} style={{ color: 'var(--pos)' }} /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ minWidth: 280, flex: '0 1 320px' }}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={waiver}
                        onChange={(e) => setWaiver(e.target.checked)}
                        style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      <span>
                        I agree that work begins immediately and I waive my 14-day right of withdrawal. The {pricing.build} build fee is non-refundable once the build starts.
                      </span>
                    </label>
                    <button
                      className="btn btn-grad"
                      onClick={() => void startCheckout()}
                      disabled={!waiver || checkingOut}
                      style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: '14px 22px', fontSize: 15.5 }}
                    >
                      {checkingOut ? 'Opening checkout…' : `Start the build — ${pricing.build}`} <Icons.arrow size={17} />
                    </button>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 9 }}>
                      {pricing.total} total · then {pricing.monthly}/mo only if you launch with us
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {error && <div style={{ marginTop: 14, color: 'var(--neg)', fontSize: 14 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
