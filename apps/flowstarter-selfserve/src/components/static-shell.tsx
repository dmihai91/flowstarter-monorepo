// Shared chrome for the static pages (about, privacy, terms, 404, 500):
// slim header, prose column, the landing footer with legal links.
import React from 'react';
import { Logo, ThemeToggle } from '@/components/ui';

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'hello@flowstarter.app';

export function StaticShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing static-shell">
      <header className="static-head">
        <div className="wrap static-head-inner">
          <a href="/" aria-label="Flowstarter home" style={{ display: 'inline-flex' }}>
            <Logo size={17} />
          </a>
          <nav className="static-head-links">
            <a href="/about">About</a>
            <a href="/#pricing">Pricing</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <a className="btn btn-primary static-head-cta" href="/">
              Try it free
            </a>
          </div>
        </div>
      </header>

      <main className="static-main">{children}</main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div className="logo-row">
            <Logo size={15} />
          </div>
          <nav className="footer-links">
            <a href="/about">About</a>
            <a href="/#pricing">Pricing</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          </nav>
          <a className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 14 }} href="/">
            Try it free
          </a>
        </div>
      </footer>
    </div>
  );
}

/** Prose column for legal/info pages. */
export function Prose({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="wrap static-prose">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {updated && <p className="static-updated mono">Last updated: {updated}</p>}
      {children}
    </article>
  );
}
