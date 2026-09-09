'use client';

// Last-resort boundary: replaces the root layout, so no app CSS is available.
// Styles are inline on purpose.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f4f4f6',
          color: '#18181f',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div>
          <div style={{ fontFamily: 'monospace', letterSpacing: '0.3em', color: '#3d4ff0', fontSize: 13 }}>500</div>
          <h1 style={{ fontSize: 32, margin: '12px 0 10px' }}>Something broke on our side.</h1>
          <p style={{ color: '#56565f', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.65 }}>
            Not you, us. Try again in a moment.
            {error?.digest ? ` Error code: ${error.digest}.` : ''}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#3d4ff0',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
