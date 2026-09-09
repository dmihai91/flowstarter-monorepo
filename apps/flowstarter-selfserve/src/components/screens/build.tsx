'use client';

// THE HERO — build theater ported from screen_build.jsx: crew column, live
// caption + self-assembling stage, deliverables stepper. Driven by live build
// state (Convex subscription or polling).
import React from 'react';
import Link from 'next/link';
import type { SiteSpec } from '@flowstarter/build-engine';
import { LogoMark, ProgressRail, ThemeToggle, AgentAvatar, Dots } from '@/components/ui';
import { Icons } from '@/components/icons';
import { useIsMobile } from '@/components/theme';
import { AGENTS, AGENT_LIST, BUILD_PLAN, type AgentId } from '@/lib/agents';
import { CrewCard, BuildStage, DeliverableStep, agentStatuses } from '@/components/build-pieces';
import { useBuildLive } from '@/components/use-build';
import { api } from '@/lib/client-api';

interface ProjectPayload {
  project: { id: string; demo_spec: SiteSpec | null };
  build: { id: string } | null;
}

export function BuildScreen({ projectId }: { projectId: string }) {
  const [buildId, setBuildId] = React.useState<string | null>(null);
  const [spec, setSpec] = React.useState<SiteSpec | null>(null);

  // Resolve the build for this project (webhook fulfillment may lag checkout).
  React.useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const data = await api<ProjectPayload>(`/api/projects/${projectId}`);
        if (stop) return;
        setSpec(data.project.demo_spec);
        if (data.build) {
          setBuildId(data.build.id);
          return;
        }
      } catch {}
      if (!stop) setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [projectId]);

  if (!buildId) {
    return (
      <div className="build-surface" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: 'var(--canvas-ink)' }}>
        <div style={{ textAlign: 'center' }}>
          <LogoMark size={42} />
          <p style={{ marginTop: 16, fontSize: 15, color: 'var(--canvas-ink-2)' }}>
            Confirming your payment and waking the crew <Dots />
          </p>
        </div>
      </div>
    );
  }
  return <BuildTheater buildId={buildId} projectId={projectId} demoSpec={spec} />;
}

function BuildTheater({ buildId, projectId, demoSpec }: { buildId: string; projectId: string; demoSpec: SiteSpec | null }) {
  const isMobile = useIsMobile();
  const live = useBuildLive(buildId);
  const finished = live.status === 'completed';
  const terminal = live.status === 'terminal_failed';
  const retrying = live.status === 'retrying' || live.status === 'failed';
  const stuck =
    !finished && !terminal && live.startedAt !== null && Date.now() - live.startedAt > 2 * 60 * 60 * 1000;

  const unlocked: Record<string, boolean> = {};
  for (const line of live.feed) if (line.artifact) unlocked[line.artifact] = true;
  const statuses = agentStatuses(live.feed, finished);
  const current = live.feed[live.feed.length - 1];
  const activeAgent: AgentId = current?.agent ?? 'research';

  return (
    <div className="build-surface" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', color: 'var(--canvas-ink)' }}>
      {/* header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '15px 26px',
          borderBottom: '1px solid var(--canvas-line)',
          flexShrink: 0,
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <LogoMark size={isMobile ? 26 : 30} />
          {!isMobile && (
            <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-.03em', color: 'var(--canvas-ink)' }}>Flowstarter</span>
          )}
          <span
            className="mono"
            style={{
              marginLeft: isMobile ? 0 : 6,
              padding: '4px 10px',
              borderRadius: 7,
              background: finished
                ? 'color-mix(in srgb, var(--pos) 22%, transparent)'
                : terminal
                  ? 'color-mix(in srgb, var(--neg) 22%, transparent)'
                  : 'color-mix(in srgb, var(--accent) 22%, transparent)',
              color: finished ? 'var(--pos)' : terminal ? 'var(--neg)' : 'var(--accent-2)',
              fontSize: 10.5,
              letterSpacing: '.08em',
            }}
          >
            {finished ? 'READY' : terminal ? 'FAILED' : retrying ? 'RETRYING' : 'BUILDING'}
          </span>
        </div>
        {!isMobile && <ProgressRail stage="build" light />}
        <div style={{ minWidth: isMobile ? 0 : 130, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          <ThemeToggle light />
          <div style={{ width: isMobile ? 44 : 70, height: 4, borderRadius: 99, background: 'var(--canvas-line)', overflow: 'hidden' }}>
            <div style={{ width: `${live.progress}%`, height: '100%', borderRadius: 99, background: 'var(--accent)', transition: 'width .6s var(--ease)' }} />
          </div>
          <span className="mono" style={{ fontSize: 13, color: 'var(--canvas-ink-2)' }}>{live.progress}%</span>
        </div>
      </header>

      {/* notice banners */}
      {retrying && !terminal && (
        <div style={{ padding: '10px 26px', background: 'color-mix(in srgb, var(--warn) 14%, transparent)', color: 'var(--warn)', fontSize: 13.5, fontWeight: 600 }}>
          The crew hit a snag — retrying automatically. Nothing needed from you.
        </div>
      )}
      {stuck && (
        <div style={{ padding: '10px 26px', background: 'color-mix(in srgb, var(--warn) 14%, transparent)', color: 'var(--warn)', fontSize: 13.5, fontWeight: 600 }}>
          This build is taking longer than expected. Our team has been notified — we’ll email you the moment it’s ready.
        </div>
      )}

      {terminal ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 26 }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', margin: '0 auto 16px', background: 'color-mix(in srgb, var(--neg) 18%, transparent)', color: 'var(--neg)', display: 'grid', placeItems: 'center' }}>
              <Icons.warn size={26} />
            </div>
            <h2 className="serif" style={{ fontSize: 28, margin: '0 0 10px', color: 'var(--canvas-ink)' }}>
              We couldn’t finish your build.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--canvas-ink-2)', lineHeight: 1.55 }}>
              Something went wrong on our side that we couldn’t recover from. Your build fee has been
              automatically refunded in full, and we’ve emailed you the details. We’re sorry.
            </p>
          </div>
        </div>
      ) : (
        <div className={isMobile ? 'scroll' : ''} style={{ flex: 1, display: isMobile ? 'block' : 'grid', gridTemplateColumns: '278px 1fr 250px', minHeight: 0 }}>
          {/* CREW */}
          {isMobile ? (
            <div style={{ borderBottom: '1px solid var(--canvas-line)', padding: '14px 16px' }}>
              <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 10 }}>Your crew</div>
              <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
                {AGENT_LIST.map((a) => (
                  <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 64 }}>
                    <AgentAvatar agent={a} size={40} active={statuses[a.id].status === 'active'} done={statuses[a.id].status === 'done'} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--canvas-ink)', whiteSpace: 'nowrap' }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="scroll" style={{ borderRight: '1px solid var(--canvas-line)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 4, paddingLeft: 4 }}>Your crew</div>
              {AGENT_LIST.map((a) => (
                <CrewCard key={a.id} agent={a} status={statuses[a.id].status} action={statuses[a.id].action} />
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 14, paddingLeft: 4 }}>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--canvas-ink-2)', lineHeight: 1.6 }}>
                  You direct. The crew executes — and pauses for your call on anything risky.
                </div>
              </div>
            </div>
          )}

          {/* STAGE */}
          <div className={isMobile ? '' : 'scroll'} style={{ padding: isMobile ? '18px 16px' : '22px 30px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16, minHeight: 30 }}>
              {finished ? (
                <>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--pos)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                    <Icons.check size={15} stroke={2.6} />
                  </div>
                  <span style={{ fontSize: 15, color: 'var(--canvas-ink)', fontWeight: 600 }}>Your site is built. Take a look.</span>
                </>
              ) : current ? (
                <>
                  <AgentAvatar agent={AGENTS[activeAgent]} size={26} active />
                  <span style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)' }}>
                    <span style={{ color: AGENTS[activeAgent].color, fontWeight: 600 }}>{AGENTS[activeAgent].name}</span>{' '}
                    {current.text}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)' }}>
                  Spinning up the crew <Dots />
                </span>
              )}
            </div>

            <BuildStage spec={demoSpec} unlocked={unlocked} finished={finished} />

            {finished && (
              <div
                className="fade-up"
                style={{
                  marginTop: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: 'var(--canvas-card)',
                  border: '1px solid var(--canvas-line)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--canvas-ink)' }}>Brand, copy & site — all wired.</div>
                  <div style={{ fontSize: 13, color: 'var(--canvas-ink-2)', marginTop: 2 }}>Review the full experience, then choose how to take it live.</div>
                </div>
                <Link href={`/p/${projectId}/preview`} className="btn btn-grad">
                  Review your site <Icons.arrow size={16} />
                </Link>
              </div>
            )}
          </div>

          {/* DELIVERABLES STEPPER */}
          <div className={isMobile ? '' : 'scroll'} style={{ borderLeft: isMobile ? 'none' : '1px solid var(--canvas-line)', borderTop: isMobile ? '1px solid var(--canvas-line)' : 'none', padding: isMobile ? '18px 16px' : '20px 18px' }}>
            <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 16, paddingLeft: 2 }}>Deliverables</div>
            <div>
              {BUILD_PLAN.map((p, i) => (
                <DeliverableStep key={p.id} artifact={p.artifact} state={finished || unlocked[p.artifact] ? 'done' : 'pending'} last={i === BUILD_PLAN.length - 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
