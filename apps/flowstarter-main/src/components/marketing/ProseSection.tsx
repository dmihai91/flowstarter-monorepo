import type { ReactNode } from 'react';

interface ProseSectionProps {
  children: ReactNode;
  /** Center the prose column (defaults to true to match landing aesthetic). */
  centered?: boolean;
  /** Hide bottom padding when used inline with other sections. */
  flush?: boolean;
}

/**
 * Long-form prose wrapper for legal, policy, and informational pages.
 * Provides the right typography, line-height and max-width so paragraphs,
 * h2s, and lists read like an editorial document inside the ls-* system.
 */
export function ProseSection({
  children,
  centered = true,
  flush = false,
}: ProseSectionProps) {
  return (
    <section className={`ls-section ${flush ? '' : 'ls-section--pad'}`}>
      <div className="ls-container">
        <div className={`ls-prose ${centered ? 'mx-auto' : ''}`}>
          {children}
        </div>
      </div>
    </section>
  );
}
