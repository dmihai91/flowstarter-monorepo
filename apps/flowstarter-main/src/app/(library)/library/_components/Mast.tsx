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
      <div className="frame frame--wide" style={{ paddingBlock: '0.85rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '1.5rem',
          }}
        >
          <Link
            href={homeHref}
            className="meta-strong"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              letterSpacing: '0.02em',
            }}
          >
            Flowstarter Library
          </Link>
          <div className="meta" aria-hidden="true">
            <span>{issueLabel ?? 'Issue 01 · 2026'}</span>
          </div>
          <Link
            href="https://flowstarter.net"
            className="meta"
            style={{ textDecoration: 'none' }}
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
    <footer style={{ marginTop: 'clamp(6rem, 12vw, 10rem)' }}>
      <div
        className="frame frame--wide"
        style={{ paddingBlock: '2.5rem 1.25rem' }}
      >
        <hr className="rule" />
      </div>
      <div className="frame frame--wide" style={{ paddingBlock: '0 3rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <p className="meta">
            Hand-built by Darius &amp; Dorin. Eight clients per month.
          </p>
          <p className="meta">
            <Link className="link" href="https://flowstarter.net">
              flowstarter.net
            </Link>
            <span
              style={{ margin: '0 0.6em', color: 'var(--color-rule-strong)' }}
            >
              ·
            </span>
            <Link className="link" href="https://flowstarter.net#pricing">
              pricing
            </Link>
            <span
              style={{ margin: '0 0.6em', color: 'var(--color-rule-strong)' }}
            >
              ·
            </span>
            <Link className="link" href="https://flowstarter.net#faq">
              faq
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
