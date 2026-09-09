'use client';

// Build-theater sub-components ported from screen_build_parts.jsx /
// screen_build_stage.jsx, driven by live SiteSpec + feed data.
import React from 'react';
import type { SiteSpec, BuildFeedEvent } from '@flowstarter/build-engine';
import { AGENTS, BUILD_PLAN, ARTIFACT_META, type AgentId, type AgentMeta } from '@/lib/agents';
import { AgentAvatar } from './ui';
import { Icons } from './icons';
import { Sk, Reveal } from './ui';

export function CrewCard({ agent, status, action }: { agent: AgentMeta; status: string; action?: string }) {
  const active = status === 'active';
  const done = status === 'done';
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '13px 13px',
        borderRadius: 16,
        background: active
          ? `color-mix(in srgb, ${agent.color} 13%, var(--canvas-card))`
          : 'var(--canvas-card)',
        border: `1px solid ${active ? `color-mix(in srgb, ${agent.color} 45%, transparent)` : 'var(--canvas-line)'}`,
        transition: 'all .35s var(--ease)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {active && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: agent.color }} />}
      <AgentAvatar agent={agent} size={38} active={active} done={done} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--canvas-ink)' }}>{agent.name}</span>
          <span
            className="mono"
            style={{ fontSize: 9.5, letterSpacing: '.07em', textTransform: 'uppercase', color: agent.color }}
          >
            {agent.role}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--canvas-ink-2)',
            lineHeight: 1.4,
            marginTop: 3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {done && !active ? <span style={{ color: 'var(--pos)' }}>✓ Done</span> : action || agent.blurb}
        </div>
        {active && (
          <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: 'var(--canvas-line)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: '40%',
                borderRadius: 99,
                background: agent.color,
                animation: 'indet 1.4s var(--ease) infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function FeedLine({ line }: { line: BuildFeedEvent }) {
  const agent = AGENTS[line.agent];
  if (!agent) return null;
  return (
    <div className="fade-up" style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          flexShrink: 0,
          marginTop: 1,
          background: `color-mix(in srgb, ${agent.color} 16%, transparent)`,
          color: agent.color,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          fontWeight: 600,
          border: `1px solid color-mix(in srgb, ${agent.color} 40%, transparent)`,
        }}
      >
        {agent.name[0]}
      </div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <span style={{ fontSize: 14.5, color: 'var(--canvas-ink)', lineHeight: 1.45 }}>
          <span style={{ color: agent.color, fontWeight: 600 }}>{agent.name}</span>
          <span style={{ color: 'var(--canvas-ink-2)' }}> · {agent.role}</span>
        </span>
        <div style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)', lineHeight: 1.45, marginTop: 2 }}>{line.text}</div>
        {line.artifact && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 7,
              padding: '4px 10px',
              borderRadius: 99,
              background: 'color-mix(in srgb, var(--pos) 16%, transparent)',
              color: 'var(--pos)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Icons.check size={12} stroke={2.6} /> Artifact ready
          </div>
        )}
      </div>
    </div>
  );
}

export function DeliverableStep({
  artifact,
  state,
  last,
}: {
  artifact: string;
  state: 'done' | 'pending';
  last: boolean;
}) {
  const meta = ARTIFACT_META[artifact];
  if (!meta) return null;
  const agent = AGENTS[meta.agent];
  const RoleIcon = (Icons as Record<string, (p: { size?: number; stroke?: number }) => React.JSX.Element>)[meta.icon] ?? Icons.spark;
  const done = state === 'done';
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {!last && (
        <div
          style={{
            position: 'absolute',
            left: 15,
            top: 30,
            bottom: -14,
            width: 2,
            background: done ? agent.color : 'var(--canvas-line)',
            opacity: done ? 0.5 : 1,
          }}
        />
      )}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          zIndex: 1,
          background: done ? agent.color : 'var(--canvas-card)',
          border: `1.5px solid ${done ? agent.color : 'var(--canvas-line)'}`,
          color: done ? '#fff' : 'var(--canvas-ink-2)',
          transition: 'all .4s var(--ease)',
        }}
      >
        {done ? <Icons.check size={15} stroke={2.6} /> : <RoleIcon size={14} />}
      </div>
      <div style={{ flex: 1, padding: '4px 0 14px', opacity: done ? 1 : 0.5 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--canvas-ink)' }}>{meta.label}</div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color: done ? agent.color : 'var(--canvas-ink-2)',
          }}
        >
          {done ? 'Ready' : 'Pending'}
        </div>
      </div>
    </div>
  );
}

// THE STAGE: a browser frame where the site assembles itself as artifacts unlock.
export function BuildStage({
  spec,
  unlocked,
  finished,
}: {
  spec: SiteSpec | null;
  unlocked: Record<string, boolean>;
  finished: boolean;
}) {
  const has = (k: string) => finished || !!unlocked[k];
  const c1 = spec?.brand.palette[0] ?? '#C2683F';
  const c2 = spec?.brand.palette[1] ?? '#E8B07A';
  const ink = '#2E2A24';
  const paper = '#FBF7EF';

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--canvas-line)',
        boxShadow: '0 30px 80px -40px rgba(0,0,0,.8)',
        background: paper,
      }}
    >
      {/* browser chrome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: '#ECE5D8',
          borderBottom: '1px solid rgba(0,0,0,.06)',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {['#E0655A', '#E8B14C', '#5FB97A'].map((c) => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c }} />
          ))}
        </div>
        <div className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#8A8270' }}>
          {has('brand') && spec ? `${spec.brand.name.toLowerCase().replace(/\s+/g, '')}.com` : 'assembling…'}
        </div>
      </div>

      {/* viewport */}
      <div style={{ padding: '20px 26px 26px', minHeight: 420, position: 'relative' }}>
        {!finished && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              top: 0,
              zIndex: 4,
              background: `linear-gradient(90deg, transparent, ${c1}, transparent)`,
              animation: 'scan 2.6s var(--ease) infinite',
              opacity: 0.8,
            }}
          />
        )}

        {/* nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          {has('brand') && spec ? (
            <Reveal on>
              <span className="serif" style={{ fontSize: 22, color: ink, fontWeight: 600 }}>
                {spec.brand.name}
              </span>
            </Reveal>
          ) : (
            <Sk w={104} h={20} r={6} />
          )}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {has('site') && spec ? (
              <Reveal on>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12.5, color: ink }}>
                  <span>About</span>
                  <span
                    style={{
                      background: has('booking') ? c1 : '#D9CFBD',
                      color: has('booking') ? paper : '#8A8270',
                      padding: '7px 14px',
                      borderRadius: 99,
                      fontWeight: 600,
                      transition: 'all .5s',
                    }}
                  >
                    {spec.copy.cta}
                  </span>
                </div>
              </Reveal>
            ) : (
              <>
                <Sk w={48} h={11} /> <Sk w={96} h={28} r={99} />
              </>
            )}
          </div>
        </div>

        {/* hero */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 22,
            alignItems: 'center',
          }}
        >
          <div>
            {has('positioning') && spec ? (
              <Reveal on>
                <div
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: c1,
                    marginBottom: 12,
                  }}
                >
                  {spec.brand.tagline}
                </div>
              </Reveal>
            ) : (
              <Sk w={150} h={11} mb={14} />
            )}
            {has('copy') && spec ? (
              <Reveal on>
                <h2
                  className="serif"
                  style={{ fontSize: 34, lineHeight: 1.1, margin: '0 0 12px', color: ink, fontWeight: 600 }}
                >
                  {spec.copy.hero}
                </h2>
              </Reveal>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <Sk h={26} mb={8} />
                <Sk w="70%" h={26} />
              </div>
            )}
            {has('copy') && spec ? (
              <Reveal on delay={0.1}>
                <p style={{ fontSize: 13.5, color: ink, opacity: 0.72, lineHeight: 1.55, margin: '0 0 20px' }}>
                  {spec.copy.sub}
                </p>
              </Reveal>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <Sk h={10} mb={7} />
                <Sk h={10} mb={7} />
                <Sk w="80%" h={10} />
              </div>
            )}
            {has('booking') && spec ? (
              <Reveal on>
                <span
                  style={{
                    display: 'inline-block',
                    background: c1,
                    color: paper,
                    padding: '11px 20px',
                    borderRadius: 99,
                    fontWeight: 600,
                    fontSize: 13.5,
                  }}
                >
                  {spec.copy.cta}
                </span>
              </Reveal>
            ) : (
              <Sk w={170} h={40} r={99} />
            )}
          </div>
          {/* hero art block — paints once brand exists */}
          <div
            style={{
              aspectRatio: '4/5',
              borderRadius: 16,
              position: 'relative',
              overflow: 'hidden',
              background: has('brand') ? `linear-gradient(150deg, ${c2}, ${c1})` : 'var(--canvas-line)',
              transition: 'background .8s var(--ease)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {has('brand') ? (
              <Reveal on delay={0.15}>
                <div style={{ color: paper, opacity: 0.9 }}>
                  <Icons.brush size={56} stroke={1.3} />
                </div>
              </Reveal>
            ) : (
              <div style={{ position: 'absolute', inset: 0 }}>
                <Sk h="100%" r={16} />
              </div>
            )}
          </div>
        </div>

        {/* sections */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginTop: 26,
          }}
        >
          {(spec?.copy.sections ?? [0, 1, 2].map(() => null)).map((s, i) =>
            has('site') && s ? (
              <Reveal key={i} on delay={i * 0.12}>
                <div
                  style={{
                    background: paper,
                    border: `1px solid ${c2}`,
                    borderRadius: 12,
                    padding: '14px 15px',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: c1,
                      color: paper,
                      display: 'grid',
                      placeItems: 'center',
                      marginBottom: 9,
                    }}
                  >
                    {[<Icons.spark size={14} key="a" />, <Icons.cal size={14} key="b" />, <Icons.user size={14} key="c" />][i]}
                  </div>
                  <div className="serif" style={{ fontSize: 15, color: ink, marginBottom: 4, fontWeight: 600 }}>{s.h}</div>
                  <div style={{ fontSize: 11.5, color: ink, opacity: 0.68, lineHeight: 1.45 }}>{s.p}</div>
                </div>
              </Reveal>
            ) : (
              <div key={i} style={{ background: '#F3EEE2', border: '1px solid #E6DECC', borderRadius: 12, padding: '14px 15px' }}>
                <Sk w={26} h={26} r={7} mb={10} />
                <Sk w="70%" h={12} mb={8} />
                <Sk h={9} mb={5} />
                <Sk w="85%" h={9} />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/** Derive each agent's status from the feed (active = last line's agent). */
export function agentStatuses(
  feed: BuildFeedEvent[],
  finished: boolean,
): Record<AgentId, { status: string; action?: string }> {
  const unlocked: Record<string, boolean> = {};
  const lastAction: Partial<Record<AgentId, string>> = {};
  let activeAgent: AgentId | null = null;
  for (const line of feed) {
    if (line.artifact) unlocked[line.artifact] = true;
    lastAction[line.agent] = line.text;
    activeAgent = line.agent;
  }
  const out = {} as Record<AgentId, { status: string; action?: string }>;
  for (const a of Object.keys(AGENTS) as AgentId[]) {
    const planDone = BUILD_PLAN.filter((p) => p.agent === a).every((p) => unlocked[p.artifact]);
    const hasPlan = BUILD_PLAN.some((p) => p.agent === a);
    let status = 'idle';
    if (finished) status = 'done';
    else if (activeAgent === a && !planDone) status = 'active';
    else if (planDone && hasPlan) status = 'done';
    out[a] = { status, action: lastAction[a] };
  }
  return out;
}
