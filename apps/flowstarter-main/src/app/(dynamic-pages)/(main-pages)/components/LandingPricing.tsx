export function LandingPricing() {
  const calLink = 'https://cal.com/flowstarter/intro';

  return (
    <section id="pricing" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />
      <div className="ls-orb ls-orb--violet ls-orb--c" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div className="ls-eyebrow inline-flex items-center justify-center gap-3">
            <span className="num">06</span>
            <span>Pricing</span>
          </div>

          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">Simple pricing for service businesses.</span>
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <article className="ls-card p-7 md:p-8">
            <h3 className="text-2xl font-semibold text-[var(--ls-ink)]">
              Premium Website - from EUR 899 + EUR 39/month
            </h3>
            <ul className="mt-6 space-y-2 text-sm text-[var(--ls-ink-dim)]">
              <li>Custom design and build</li>
              <li>Up to 8 pages</li>
              <li>Smart Editor access with team review</li>
              <li>Technical setup, launch, and ongoing management</li>
            </ul>
            <p className="mt-6 text-sm text-[var(--ls-ink-dim)]">
              Payment terms: 50% deposit to reserve your slot (EUR 200 is
              refundable before build begins), 50% on launch.
            </p>
            <p className="mt-3 text-sm text-[var(--ls-ink-dim)]">
              Final price depends on scope.
            </p>
            <a
              href={calLink}
              className="ls-cta-hero mt-7 inline-flex h-12 items-center justify-center px-6 text-sm"
            >
              Book a free 20-min call
            </a>
            <div className="mt-7 rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.13em] text-[var(--ls-ink-faint)]">
                Payments - Coming Q3 2026
              </p>
              {/* TODO: Add final payments product details after legal and product review. */}
              <p className="mt-2 text-sm text-[var(--ls-ink-dim)]">
                Accept payments on your site. This feature is currently in
                development.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
