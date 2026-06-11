'use client';

// Route error boundary (the "500 page" for anything under the root layout).
import React from 'react';
import { StaticShell, CONTACT_EMAIL } from '@/components/static-shell';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error('[selfserve error boundary]', error);
  }, [error]);

  return (
    <StaticShell>
      <div className="static-hero">
        <div>
          <div className="static-code">500</div>
          <h1>Something broke on our side.</h1>
          <p>
            Not you, us. Your work is saved. Try again in a moment, and if it keeps happening,
            email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            {error?.digest ? <> and mention the code <span className="mono">{error.digest}</span></> : null}.
          </p>
          <div className="static-hero-actions">
            <button className="btn btn-primary" onClick={() => reset()}>
              Try again
            </button>
            <a className="btn" href="/">
              Back home
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
