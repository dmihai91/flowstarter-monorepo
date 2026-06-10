'use client';

// Branded auth pages — selfserve design language (logo, serif headline, glass
// card, ambient bg) wrapping Clerk's hardened flows, deeply themed via the
// appearance API so they read as Flowstarter, not stock Clerk.
import React from 'react';
import type { SignInProps } from '@clerk/types';
import { Logo } from '@/components/ui';
import { Icons } from '@/components/icons';

export const clerkAppearance: SignInProps['appearance'] = {
  variables: {
    colorPrimary: '#3D3FE0',
    colorText: 'var(--ink)',
    colorTextSecondary: 'var(--ink-2)',
    colorBackground: 'transparent',
    colorInputBackground: 'var(--card)',
    colorInputText: 'var(--ink)',
    borderRadius: '12px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', boxShadow: 'none', border: 'none', background: 'transparent' },
    card: { background: 'transparent', boxShadow: 'none', padding: '8px 4px' },
    headerTitle: {
      fontFamily: "'General Sans', 'Inter', system-ui, sans-serif",
      fontWeight: 600,
      letterSpacing: '-.022em',
      fontSize: '22px',
    },
    headerSubtitle: { color: 'var(--ink-3)' },
    formButtonPrimary: {
      background: 'var(--primary)',
      boxShadow: '0 8px 20px -10px var(--primary)',
      fontWeight: 600,
      fontSize: '14px',
      textTransform: 'none',
      '&:hover': { background: 'var(--primary)', transform: 'translateY(-1px)' },
    },
    formFieldInput: {
      border: '1.5px solid var(--line)',
      background: 'var(--card)',
      '&:focus': { borderColor: 'var(--accent)', boxShadow: '0 0 0 4px var(--accent-soft)' },
    },
    socialButtonsBlockButton: { border: '1px solid var(--line)', background: 'var(--card)' },
    dividerLine: { background: 'var(--line)' },
    dividerText: { color: 'var(--ink-3)' },
    footer: { background: 'transparent', '& *': { background: 'transparent' } },
    footerActionText: { color: 'var(--ink-3)' },
    footerActionLink: { color: 'var(--accent)', fontWeight: 600 },
    logoBox: { display: 'none' },
  },
};

export function AuthShell({
  headline,
  sub,
  bullets,
  children,
}: {
  headline: React.ReactNode;
  sub: string;
  bullets: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '22px 30px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <Logo size={22} />
        </a>
      </div>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '10px 22px 50px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: 34,
            alignItems: 'center',
            width: 'min(880px, 100%)',
          }}
        >
          {/* brand side */}
          <div className="fade-up">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Flowstarter</div>
            <h1 className="serif" style={{ fontSize: 'clamp(30px, 4vw, 42px)', lineHeight: 1.06, margin: '0 0 12px', letterSpacing: '-.02em' }}>
              {headline}
            </h1>
            <p style={{ fontSize: 15.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 18px', maxWidth: 380 }}>{sub}</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
              {bullets.map((b) => (
                <li key={b} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 14, color: 'var(--ink-2)' }}>
                  <Icons.check size={15} stroke={2.4} style={{ color: 'var(--pos)' }} /> {b}
                </li>
              ))}
            </ul>
          </div>
          {/* form side */}
          <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: '18px 20px', animationDelay: '.08s' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
