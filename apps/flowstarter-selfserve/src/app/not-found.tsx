import type { Metadata } from 'next';
import { StaticShell, CONTACT_EMAIL } from '@/components/static-shell';

export const metadata: Metadata = {
  title: 'Page not found — Flowstarter',
};

export default function NotFound() {
  return (
    <StaticShell>
      <div className="static-hero">
        <div>
          <div className="static-code">404</div>
          <h1>This page doesn&rsquo;t exist.</h1>
          <p>
            The crew checked everywhere. If you typed the address, double-check it; if a link
            brought you here, <a href={`mailto:${CONTACT_EMAIL}`}>tell us</a> and we&rsquo;ll fix
            it.
          </p>
          <div className="static-hero-actions">
            <a className="btn btn-primary" href="/">
              Back home
            </a>
            <a className="btn" href="/#pricing">
              See pricing
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
