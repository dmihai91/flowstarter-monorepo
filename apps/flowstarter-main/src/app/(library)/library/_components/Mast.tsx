import Link from 'next/link';

interface MastProps {
  /** Relative URL to the library home from the current page context. */
  homeHref: string;
  issueLabel?: string;
}

/**
 * Editorial masthead — the running header that appears on every library page.
 * Fixed-metric typography, hairline rule above and below.
 */
export function Mast({ homeHref, issueLabel }: MastProps) {
  return (
    <header className="masthead-rule">
      <div className="frame frame--wide masthead-wrap">
        <div className="masthead-row">
          <Link href={homeHref} className="meta-strong masthead-brand">
            Flowstarter Library
          </Link>
          <div className="meta masthead-issue" aria-hidden="true">
            <span>{issueLabel ?? 'Issue 01 · 2026'}</span>
          </div>
          <Link
            href="https://flowstarter.net"
            className="meta masthead-backlink"
          >
            ← back to flowstarter.net
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footnote() {
  return (
    <footer className="library-footnote">
      <div className="frame frame--wide footnote-rule-wrap">
        <hr className="rule" />
      </div>
      <div className="frame frame--wide footnote-content-wrap">
        <div className="footnote-row">
          <p className="meta">
            Hand-crafted by Darius &amp; Dorin. Limited spots, by design.
          </p>
          <p className="meta">
            <Link className="link" href="https://flowstarter.net">
              flowstarter.net
            </Link>
            <span className="footnote-dot">·</span>
            <Link className="link" href="https://flowstarter.net#pricing">
              pricing
            </Link>
            <span className="footnote-dot">·</span>
            <Link className="link" href="https://flowstarter.net#faq">
              faq
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
