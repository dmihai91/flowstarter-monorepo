'use client';

// Shared UI ported from the prototype: logo, agent avatars, progress rail,
// top bar, skeleton/reveal primitives. Inline styles kept to match the
// design bundle's visual output exactly.
import React from 'react';
import { Icons, ROLE_ICON } from './icons';
import { ThemeCtx, useIsMobile } from './theme';
import type { AgentMeta } from '@/lib/agents';

// Logo ported from the main flowstarter app (flow-design-system Logo.tsx):
// indigo→cyan gradient rounded square with the stylized flowing F, and the
// "Flow{starter}" wordmark with a gradient tail.
export function LogoMark({ size = 34 }: { size?: number }) {
  const id = React.useId();
  return (
    <div style={{ width: size, height: size, flexShrink: 0, position: 'relative' }}>
      <svg viewBox="-2 -2 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent)" />
            <stop offset="0.5" stopColor="var(--accent)" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {/* Stylized "F" — centered at x=13, arms balanced around the optical center */}
        <path d="M13 10 L13 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M13 11 C17 10, 22 10, 27 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M13 20 C16 19, 20 19, 24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M13 30 C16 30, 20 29, 25 28" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

export function Logo({ size = 22, light = false }: { size?: number; light?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size + 8} />
      <span
        style={{
          fontFamily: 'var(--sans)',
          fontWeight: 700,
          fontSize: size,
          letterSpacing: '-.02em',
          lineHeight: 1,
          color: light ? 'var(--canvas-ink)' : 'var(--ink)',
        }}
      >
        Flow
        <span
          style={{
            background: 'linear-gradient(to right, var(--accent), #06B6D4)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          starter
        </span>
      </span>
    </div>
  );
}

export function ThemeToggle({ light = false }: { light?: boolean }) {
  const { mode, setMode } = React.useContext(ThemeCtx);
  const order = ['auto', 'studio', 'midnight'] as const;
  const meta = {
    auto: { icon: Icons.auto, label: 'Auto (system)' },
    studio: { icon: Icons.sun, label: 'Light' },
    midnight: { icon: Icons.moon, label: 'Dark' },
  } as const;
  const next = order[(order.indexOf(mode) + 1) % order.length];
  const Cur = meta[mode].icon;
  return (
    <button
      onClick={() => setMode(next)}
      title={`Theme: ${meta[mode].label} · tap for ${meta[next].label}`}
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        background: 'transparent',
        border: `1px solid ${light ? 'var(--canvas-line)' : 'var(--line)'}`,
        color: light ? 'var(--canvas-ink-2)' : 'var(--ink-2)',
        transition: 'all .2s var(--ease)',
      }}
    >
      <Cur size={17} />
    </button>
  );
}

export function AgentAvatar({
  agent,
  size = 40,
  active = false,
  done = false,
  ring = true,
}: {
  agent: AgentMeta;
  size?: number;
  active?: boolean;
  done?: boolean;
  ring?: boolean;
}) {
  const RoleIcon = ROLE_ICON[agent.id] ?? Icons.spark;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {active && ring && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid ${agent.color}`,
            opacity: 0.5,
            animation: 'breathe 1.8s var(--ease) infinite',
          }}
        />
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `color-mix(in srgb, ${agent.color} 16%, transparent)`,
          border: `1.5px solid ${
            active || done ? agent.color : `color-mix(in srgb, ${agent.color} 40%, transparent)`
          }`,
          color: agent.color,
          display: 'grid',
          placeItems: 'center',
          transition: 'all .3s var(--ease)',
        }}
      >
        {done ? <Icons.check size={size * 0.5} stroke={2.4} /> : <RoleIcon size={size * 0.48} stroke={2} />}
      </div>
    </div>
  );
}

export function AgentLabel({ agent, sub = true, light = false }: { agent: AgentMeta; sub?: boolean; light?: boolean }) {
  return (
    <div style={{ lineHeight: 1.25 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: light ? 'var(--canvas-ink)' : 'var(--ink)' }}>
        {agent.name}
      </div>
      {sub && (
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: agent.color,
          }}
        >
          {agent.role}
        </div>
      )}
    </div>
  );
}

// Funnel progress rail: Describe → Demo → Build → Launch
export type FunnelStage = 'describe' | 'demo' | 'build' | 'launch';

export function ProgressRail({ stage, light = false }: { stage: FunnelStage; light?: boolean }) {
  const order: Record<FunnelStage, number> = { describe: 1, demo: 2, build: 3, launch: 4 };
  const at = order[stage] ?? 1;
  const steps = [
    { id: 1, label: 'Describe', icon: Icons.pen },
    { id: 2, label: 'Demo', icon: Icons.eye },
    { id: 3, label: 'Build', icon: Icons.spark },
    { id: 4, label: 'Launch', icon: Icons.rocket },
  ];
  const ink = light ? 'var(--canvas-ink)' : 'var(--ink)';
  const ink2 = light ? 'var(--canvas-ink-2)' : 'var(--ink-3)';
  const line = light ? 'var(--canvas-line)' : 'var(--line)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {steps.map((s, i) => {
        const state = at > s.id ? 'done' : at === s.id ? 'now' : 'next';
        const S = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                opacity: state === 'next' ? 0.5 : 1,
                transition: 'opacity .4s',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background:
                    state === 'done'
                      ? 'var(--accent)'
                      : state === 'now'
                        ? 'color-mix(in srgb, var(--accent) 16%, transparent)'
                        : 'transparent',
                  border: state === 'next' ? `1.5px solid ${line}` : '1.5px solid var(--accent)',
                  color: state === 'done' ? 'var(--accent-ink)' : state === 'now' ? 'var(--accent)' : ink2,
                  transition: 'all .4s var(--ease)',
                }}
              >
                {state === 'done' ? <Icons.check size={13} stroke={2.6} /> : <S size={12} stroke={2.2} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: state === 'now' ? ink : ink2 }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 22,
                  height: 1.5,
                  borderRadius: 2,
                  background: at > s.id ? 'var(--accent)' : line,
                  transition: 'background .4s',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function TopBar({
  stage,
  right,
  light = false,
}: {
  stage: FunnelStage;
  right?: React.ReactNode;
  light?: boolean;
}) {
  const isMobile = useIsMobile();
  return (
    <header
      className={light ? '' : 'glass-2'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 26px',
        borderBottom: `1px solid ${light ? 'var(--canvas-line)' : 'var(--line)'}`,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 5,
        gap: 10,
      }}
    >
      <a href="/" style={{ textDecoration: 'none', transform: 'scale(.86)', transformOrigin: 'left center', flexShrink: 0 }}>
        <Logo size={20} light={light} />
      </a>
      {!isMobile && <ProgressRail stage={stage} light={light} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 7 : 10, justifyContent: 'flex-end' }}>
        <ThemeToggle light={light} />
        {right}
      </div>
    </header>
  );
}

// skeleton shimmer block (build stage)
export function Sk({
  w = '100%',
  h = 12,
  r = 6,
  mb = 0,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  mb?: number;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        marginBottom: mb,
        background: 'var(--canvas-line)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s infinite',
        }}
      />
    </div>
  );
}

// reveal wrapper — fades/slides content in when `on` flips true
export function Reveal({ on, children, delay = 0 }: { on: boolean; children: React.ReactNode; delay?: number }) {
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(10px)',
        transition: `opacity .6s var(--ease-out) ${delay}s, transform .6s var(--ease-out) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function Dots() {
  return (
    <span className="dots">
      <span /> <span /> <span />
    </span>
  );
}
