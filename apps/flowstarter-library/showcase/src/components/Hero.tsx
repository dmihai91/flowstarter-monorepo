import React, { useState, useEffect } from 'react';

interface HeroProps {
  templateCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Hero({ templateCount, searchQuery, setSearchQuery }: HeroProps): React.ReactElement {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  const fade = (delay: string): React.CSSProperties => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}, transform 0.7s ease ${delay}`,
  });

  const stats = [
    { value: `${templateCount}`, label: 'templates' },
    { value: '6', label: 'colour palettes' },
    { value: '4', label: 'font pairings' },
  ];

  return (
    <section style={{ position: 'relative', paddingTop: '6rem', paddingBottom: '4rem', overflow: 'hidden' }}>

      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-8rem', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '500px', borderRadius: '9999px',
          background: 'var(--purple-primary)', opacity: 0.07, filter: 'blur(100px)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '-8rem',
          width: '350px', height: '350px', borderRadius: '9999px',
          background: 'hsl(211 93% 61%)', opacity: 0.04, filter: 'blur(80px)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Label */}
        <div style={{ ...fade('0s'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ height: '1px', width: '1.5rem', background: 'var(--purple-primary)', opacity: 0.6 }} />
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--purple-primary)',
          }}>
            Handcrafted templates
          </span>
          <div style={{ height: '1px', width: '1.5rem', background: 'var(--purple-primary)', opacity: 0.6 }} />
        </div>

        {/* Headline */}
        <div style={{ ...fade('0.1s'), textAlign: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
            <span style={{
              display: 'block', fontWeight: 300,
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              color: 'var(--ui-text-primary, #111)',
            }}>
              Every expert deserves a site
            </span>
            <span style={{
              display: 'block', fontWeight: 900,
              fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
              background: 'linear-gradient(135deg, #4D5DD9, #7C3AED, #5b21b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              this good.
            </span>
          </h1>
        </div>

        {/* Subheadline */}
        <p style={{
          ...fade('0.2s'),
          textAlign: 'center',
          fontSize: '1rem',
          lineHeight: 1.7,
          color: 'var(--ui-text-secondary, #6b7280)',
          maxWidth: '36rem',
          margin: '0 auto 2.5rem',
        }}>
          Every template is built for coaches, consultants, and service professionals.
          Pick a palette, pick a font, hand it off. Done.
        </p>

        {/* Stats */}
        <div style={{
          ...fade('0.3s'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'clamp(2rem, 6vw, 3.5rem)',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(128,128,128,0.12)',
          marginBottom: '2rem',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700, margin: 0, color: 'var(--ui-text-primary, #111)' }}>{s.value}</p>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ui-text-secondary, #9ca3af)', marginTop: '0.125rem' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mobile search */}
        <div style={{ ...fade('0.4s'), display: 'block' }} className="sm:hidden">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', zIndex: 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', borderRadius: '0.75rem',
                border: '1px solid rgba(128,128,128,0.25)',
                background: 'transparent',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                fontSize: '0.875rem', outline: 'none',
                color: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
