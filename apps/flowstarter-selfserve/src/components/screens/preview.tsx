'use client';

// Preview & decide — port of screen_launch.jsx visuals. Full site preview in a
// browser frame (desktop/mobile toggle), then the three-way choice:
// Launch (€149 + €39/mo via Clerk) · Code only (€149) · Walk away (brand kit).
import React from 'react';
import type { SiteSpec } from '@flowstarter/build-engine';
import { TopBar, Dots } from '@/components/ui';
import { Icons } from '@/components/icons';
import { api } from '@/lib/client-api';
import { track } from '@/lib/analytics';

interface ProjectPayload {
  project: { id: string; demo_spec: SiteSpec | null; outcome: string | null };
  build: { id: string; status: string; outputs: { spec: SiteSpec; previewUrl: string } | null } | null;
  payments: Array<{ kind: string; status: string }>;
}

export function PreviewScreen({
  projectId,
  pricing,
}: {
  projectId: string;
  pricing: { build: string; final: string; total: string; monthly: string };
}) {
  const [data, setData] = React.useState<ProjectPayload | null>(null);
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [walkConfirm, setWalkConfirm] = React.useState(false);
  const [walked, setWalked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const tracked = React.useRef(false);

  React.useEffect(() => {
    api<ProjectPayload>(`/api/projects/${projectId}`)
      .then((d) => {
        setData(d);
        if (!tracked.current) {
          tracked.current = true;
          track('preview_viewed', { projectId });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [projectId]);

  const checkout = async (kind: 'final_code' | 'final_subscription') => {
    if (busy) return;
    setBusy(kind);
    setError(null);
    try {
      const { url } = await api<{ url: string }>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ projectId, kind }),
      });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      setBusy(null);
    }
  };

  const walkAway = async () => {
    if (busy) return;
    setBusy('walk');
    setError(null);
    try {
      await api(`/api/projects/${projectId}/walk-away`, { method: 'POST' });
      setWalked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const spec = data?.build?.outputs?.spec ?? data?.project.demo_spec ?? null;
  const buildReady = data?.build?.status === 'completed';

  if (walked) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <TopBar stage="launch" />
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 26 }}>
          <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: '34px 34px', maxWidth: 480, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
              <Icons.file size={24} />
            </div>
            <h2 className="serif" style={{ fontSize: 27, margin: '0 0 10px' }}>Your brand kit is on its way.</h2>
            <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 18px' }}>
              We’ve emailed you the PDF — logo direction, palette and all the copy. It’s yours to keep.
              If you change your mind, your finished site stays ready for 30 days.
            </p>
            <a
              className="btn btn-primary"
              href={`/api/projects/${projectId}/brand-kit`}
              onClick={() => track('brand_kit_downloaded', { projectId })}
            >
              <Icons.download size={16} /> Download the PDF
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="launch" />
      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 26px 60px' }}>
          {!data ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
              <span style={{ color: 'var(--ink-2)' }}>
                Loading your site <Dots />
              </span>
            </div>
          ) : !buildReady || !spec ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh', textAlign: 'center' }}>
              <div>
                <h2 className="serif" style={{ fontSize: 26 }}>Your build isn’t finished yet.</h2>
                <a href={`/p/${projectId}/build`} className="btn btn-primary" style={{ marginTop: 14 }}>
                  Back to the build
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* header row */}
              <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Ready to launch</div>
                  <h1 className="serif" style={{ fontSize: 36, margin: 0, letterSpacing: '-.02em', lineHeight: 1.05 }}>
                    Meet <span className="grad-text">{spec.brand.name}</span>.
                  </h1>
                  <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: 460, lineHeight: 1.5 }}>
                    Your site, brand and copy — built by the agents, assembled for your approval.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 99, padding: 4 }}>
                  {(['desktop', 'mobile'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDevice(d)}
                      style={{
                        font: 'inherit',
                        cursor: 'pointer',
                        border: 'none',
                        borderRadius: 99,
                        padding: '7px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        background: device === d ? 'var(--card)' : 'transparent',
                        color: device === d ? 'var(--ink)' : 'var(--ink-3)',
                        boxShadow: device === d ? 'var(--shadow)' : 'none',
                      }}
                    >
                      {d === 'desktop' ? 'Desktop' : 'Mobile'}
                    </button>
                  ))}
                </div>
              </div>

              {/* browser frame with the built site */}
              <div className="fade-up" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#E0655A', '#E8B14C', '#5FB97A'].map((c) => (
                      <span key={c} style={{ width: 11, height: 11, borderRadius: 99, background: c }} />
                    ))}
                  </div>
                  <div className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
                    preview · {spec.brand.name.toLowerCase().replace(/\s+/g, '')}.com
                  </div>
                </div>
                <div style={{ display: 'grid', placeItems: 'center', padding: device === 'mobile' ? 24 : 0, background: device === 'mobile' ? 'var(--paper)' : 'transparent' }}>
                  <iframe
                    title="Site preview"
                    src={data.build!.outputs!.previewUrl}
                    style={{
                      width: device === 'mobile' ? 390 : '100%',
                      maxWidth: '100%',
                      height: 640,
                      border: 'none',
                      display: 'block',
                      background: '#fff',
                      borderRadius: device === 'mobile' ? 18 : 0,
                      boxShadow: device === 'mobile' ? 'var(--shadow-lg)' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* the three-way decision */}
              <div className="fade-up" style={{ marginTop: 28 }}>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Choose how it ships — {pricing.total} total, as agreed</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {/* Launch */}
                  <div className="glass-3d" style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
                    <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 10 }}>Recommended</div>
                    <h3 className="serif" style={{ fontSize: 23, margin: '0 0 6px' }}>Launch it</h3>
                    <div style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 12 }}>
                      <strong>{pricing.final}</strong> now · then <strong>{pricing.monthly}/mo</strong>
                    </div>
                    <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'grid', gap: 7, flex: 1 }}>
                      {['Live on your domain — included', 'Hosting on our servers (Hetzner)', 'Updates & AI edits, ongoing', 'Cancel the subscription anytime'].map((t) => (
                        <li key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, color: 'var(--ink-2)' }}>
                          <Icons.check size={14} stroke={2.4} style={{ color: 'var(--pos)' }} /> {t}
                        </li>
                      ))}
                    </ul>
                    <button className="btn btn-grad" disabled={!!busy} onClick={() => void checkout('final_subscription')} style={{ justifyContent: 'center' }}>
                      {busy === 'final_subscription' ? 'Opening checkout…' : `Launch — ${pricing.final}`} <Icons.rocket size={16} />
                    </button>
                  </div>

                  {/* Code only */}
                  <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
                    <div className="eyebrow" style={{ marginBottom: 10 }}>Self-hosted</div>
                    <h3 className="serif" style={{ fontSize: 23, margin: '0 0 6px' }}>Code only</h3>
                    <div style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 12 }}>
                      <strong>{pricing.final}</strong> one-time · no subscription
                    </div>
                    <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'grid', gap: 7, flex: 1 }}>
                      {['Full code export, download instantly', 'Host it anywhere you like', 'No hosting or management from us'].map((t) => (
                        <li key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, color: 'var(--ink-2)' }}>
                          <Icons.check size={14} stroke={2.4} style={{ color: 'var(--pos)' }} /> {t}
                        </li>
                      ))}
                    </ul>
                    <button className="btn btn-primary" disabled={!!busy} onClick={() => void checkout('final_code')} style={{ justifyContent: 'center' }}>
                      {busy === 'final_code' ? 'Opening checkout…' : `Get the code — ${pricing.final}`} <Icons.download size={16} />
                    </button>
                  </div>

                  {/* Walk away */}
                  <div style={{ border: '1px dashed var(--line)', borderRadius: 'var(--r-lg)', padding: '24px 22px', display: 'flex', flexDirection: 'column' }}>
                    <div className="eyebrow" style={{ marginBottom: 10 }}>No hard feelings</div>
                    <h3 className="serif" style={{ fontSize: 23, margin: '0 0 6px' }}>Walk away</h3>
                    <div style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 12 }}>Keep your brand kit — free</div>
                    <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'grid', gap: 7, flex: 1 }}>
                      {['Brand kit PDF: logo direction, palette, copy & strategy', 'Emailed to you automatically', `The ${pricing.build} is non-refundable — it covered the build. Site code stays with us`].map((t) => (
                        <li key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, color: 'var(--ink-2)' }}>
                          <Icons.check size={14} stroke={2.4} style={{ color: 'var(--ink-3)' }} /> {t}
                        </li>
                      ))}
                    </ul>
                    {walkConfirm ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" disabled={!!busy} onClick={() => void walkAway()} style={{ flex: 1, justifyContent: 'center' }}>
                          {busy === 'walk' ? <Dots /> : 'Yes, send my kit'}
                        </button>
                        <button className="btn btn-ghost" onClick={() => setWalkConfirm(false)} style={{ justifyContent: 'center' }}>
                          Back
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost" disabled={!!busy} onClick={() => setWalkConfirm(true)} style={{ justifyContent: 'center' }}>
                        Walk away with the kit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {error && <div style={{ marginTop: 14, color: 'var(--neg)', fontSize: 14 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
