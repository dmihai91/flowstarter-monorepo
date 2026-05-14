import type { ReactNode } from 'react';

interface PageHeroProps {
  /** Small uppercase label rendered above the headline (e.g. "About"). */
  eyebrow?: string;
  /** Main editorial headline — the sharp prefix line. */
  headlinePrefix: string;
  /**
   * Optional flourish line rendered under the prefix in the landing's
   * coloured-flourish style. Omit for single-line page heros.
   */
  headlineFlourish?: string;
  /** Lead paragraph rendered under the headline. */
  sub?: ReactNode;
  /**
   * Optional small meta strip rendered under the lead (e.g.
   * "Last updated · Feb 27, 2026").
   */
  meta?: ReactNode;
  /** Optional action area rendered under the lead. */
  actions?: ReactNode;
  /** Centered hero (matches landing's section heads). Defaults to true. */
  centered?: boolean;
}

/**
 * The hairline-eyebrow + editorial display heading + lead paragraph that
 * sits at the top of every marketing page. Same visual language as the
 * landing's section heads — keeps every page in family.
 */
export function PageHero({
  eyebrow,
  headlinePrefix,
  headlineFlourish,
  sub,
  meta,
  actions,
  centered = true,
}: PageHeroProps) {
  return (
    <section className="ls-section ls-page-hero">
      <div className="ls-container">
        <div
          className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}
        >
          {eyebrow && (
            <div
              className={`ls-eyebrow inline-flex items-center gap-2 ${
                centered ? 'justify-center' : ''
              }`}
            >
              <span>{eyebrow}</span>
            </div>
          )}

          <h1
            className="ls-display mt-6 sm:mt-7"
            style={{ textWrap: 'balance' }}
          >
            <span className="line">{headlinePrefix}</span>
            {headlineFlourish && (
              <span className="line flourish mt-2">{headlineFlourish}</span>
            )}
          </h1>

          {sub && (
            <p
              className={`ls-body ls-body--lead mt-6 sm:mt-7 ${
                centered ? 'mx-auto' : ''
              }`}
            >
              {sub}
            </p>
          )}

          {meta && (
            <div className={`mt-6 flex ${centered ? 'justify-center' : ''}`}>
              {meta}
            </div>
          )}

          {actions && (
            <div
              className={`mt-8 flex flex-wrap items-center gap-3 ${
                centered ? 'justify-center' : ''
              }`}
            >
              {actions}
            </div>
          )}
        </div>

        <hr className="ls-page-rule ls-page-hero__rule" aria-hidden="true" />
      </div>
    </section>
  );
}
