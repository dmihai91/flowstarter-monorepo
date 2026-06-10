'use client';

// The demo preview frame: browser chrome, fully-visible hero, blurred/locked
// lower sections. Shared by the landing sneak peek and the project demo page.
import React from 'react';
import type { SiteSpec } from '@flowstarter/build-engine';
import { Icons } from '@/components/icons';

export function DemoFrame({ spec, lockNote }: { spec: SiteSpec; lockNote?: string }) {
  const [c1, c2] = spec.brand.palette;
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* browser chrome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 16px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper-2)',
        }}
      >
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
        <div
          style={{
            padding: '36px 26px 42px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            alignItems: 'center',
          }}
        >
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
        <div
          className="demo-locked"
          aria-hidden
          style={{ background: spec.brand.palette[3], color: spec.brand.palette[2], padding: '8px 26px 36px' }}
        >
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
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icons.lock size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>The rest unlocks with the build</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                {lockNote ?? 'Full sections, contact & booking, mobile layout — built by the crew.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
