import React from 'react';
import { FlowBackground, Logo } from '@flowstarter/flow-design-system';
import { getCalendlyUrl, getMainPlatformHomepage } from '~/lib/config/domains';

/**
 * Shown to clients (non-team users) who land on the editor but have no project yet.
 * Directs them to book a discovery call so the Flowstarter team can build their site first.
 */
export function ClientNoProjectScreen() {
  const calendlyUrl = getCalendlyUrl();
  const homeUrl = getMainPlatformHomepage();

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      <FlowBackground
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        variant="landing"
      />

      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(77,93,217,0.18) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '520px',
          width: '90%',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '20px',
          padding: '48px 40px',
          backdropFilter: 'blur(24px)',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
          <Logo size="md" />
        </div>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(77,93,217,0.3) 0%, rgba(193,200,255,0.15) 100%)',
            border: '1px solid rgba(193,200,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '28px',
          }}
        >
          📅
        </div>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.3,
          }}
        >
          Your site is being built
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.65,
            marginBottom: '32px',
          }}
        >
          We build your website for you — no guesswork, no templates to wrestle with.
          Book a discovery call and our team will have your site ready in 1–2 weeks.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginBottom: '36px',
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { value: '1', label: 'call needed' },
            { value: '1–2', label: 'weeks to launch' },
            { value: '0', label: 'tech skills required' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #C1C8FF 0%, #4D5DD9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
            marginBottom: '12px',
            boxShadow: '0 4px 16px rgba(77,93,217,0.35)',
            cursor: 'pointer',
          }}
        >
          Book your discovery call
        </a>

        <a
          href={homeUrl}
          style={{
            display: 'block',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            marginTop: '4px',
          }}
        >
          ← Back to Flowstarter
        </a>
      </div>
    </div>
  );
}
