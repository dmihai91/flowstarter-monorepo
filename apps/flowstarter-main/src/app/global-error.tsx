'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import en from '@/locales/en';
import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';

// global-error renders outside all providers — inline styles only, no CSS tokens

function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "'Outfit', system-ui, sans-serif",
          backgroundColor: '#fbf7ef',
          color: '#120a22',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Indigo bloom background */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(78,94,218,0.14) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(140,100,218,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Header */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'rgba(251,247,239,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(18,10,34,0.08)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" />
          </Link>
          <Link
            href="/"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(18,10,34,0.45)',
              textDecoration: 'none',
            }}
          >
            ← Back to home
          </Link>
        </header>

        {/* Centered content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7rem 1.5rem 4rem',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

            {/* F logo mark hero */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(18,10,34,0.10)',
                  boxShadow: '0 0 0 1px rgba(18,10,34,0.06), 0 8px 40px rgba(78,94,218,0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Logo size="lg" showText={false} />
              </div>
            </div>

            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: '0.75rem',
                lineHeight: 1.2,
              }}
            >
              We hit a snag.
            </h1>
            <p
              style={{
                color: 'rgba(18,10,34,0.55)',
                marginBottom: '2rem',
                lineHeight: 1.65,
                fontSize: 14,
                maxWidth: 300,
                margin: '0 auto 2rem',
              }}
            >
              Our team has been notified. Try reloading — it usually fixes it.
            </p>

            {/* Glass card */}
            <div
              style={{
                borderRadius: 20,
                border: '1px solid rgba(18,10,34,0.10)',
                background: 'rgba(255,255,255,0.72)',
                padding: '1.25rem 1.5rem',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                marginBottom: '2rem',
                textAlign: 'left',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <p style={{ fontSize: 13, color: 'rgba(18,10,34,0.5)', lineHeight: 1.65, margin: 0 }}>
                This is usually a temporary blip. Give it a moment and reload — or head home and come back.
              </p>

              {error?.digest && (
                <div style={{ marginTop: '0.875rem', display: 'flex', justifyContent: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      letterSpacing: '0.03em',
                      background: 'rgba(18,10,34,0.05)',
                      color: 'rgba(18,10,34,0.45)',
                      border: '1px solid rgba(18,10,34,0.10)',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'hsl(233,65%,50%)',
                        opacity: 0.7,
                        display: 'inline-block',
                      }}
                    />
                    {error.digest}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.625rem 1.375rem',
                  background: 'hsl(233,65%,44%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                }}
              >
                <RefreshCw style={{ width: 15, height: 15 }} />
                Reload
              </button>
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.625rem 1.375rem',
                  background: 'rgba(255,255,255,0.72)',
                  color: 'rgba(18,10,34,0.75)',
                  border: '1px solid rgba(18,10,34,0.12)',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                }}
              >
                <Home style={{ width: 15, height: 15 }} />
                Go Home
              </a>
            </div>

          </div>
        </div>

        {/* Minimal footer */}
        <footer style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '1.5rem', fontSize: 12, color: 'rgba(18,10,34,0.35)' }}>
          © {new Date().getFullYear()} Flowstarter. All rights reserved.
        </footer>
      </body>
    </html>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <I18nProvider translations={en}>
      <ThemeProvider>
        <GlobalErrorContent error={error} reset={reset} />
      </ThemeProvider>
    </I18nProvider>
  );
}
