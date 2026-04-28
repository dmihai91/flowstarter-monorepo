export function ProcessSection() {
  return (
    <section
      id="process"
      data-section="process"
      className="ls-scope ls-section ls-section--pad"
    >
      <div className="ls-mesh" aria-hidden />{' '}
      <div className="ls-grain" aria-hidden />
      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div className="ls-eyebrow inline-flex items-center justify-center gap-3">
            <span className="num">03</span>
            <span>How it works</span>
          </div>

          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">A simple process, clear deadlines.</span>
          </h2>

          <p className="ls-body ls-body--lead mt-7 mx-auto">
            We keep decisions lightweight and execution fast so you can launch
            quickly without micromanaging the project.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          <article className="ls-card p-6">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
              Step 1
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--ls-ink)]">
              Discovery call (30 min)
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ls-ink-dim)]">
              We clarify your goals, services, pages, and tone. You leave the
              call with a clear delivery plan.
            </p>
          </article>
          <article className="ls-card p-6">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
              Step 2
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--ls-ink)]">
              We build (3-4 days)
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ls-ink-dim)]">
              Our team designs and builds the full site: structure, copy
              placement, forms, calendar, and mobile polish.
            </p>
          </article>
          <article className="ls-card p-6">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
              Step 3
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--ls-ink)]">
              Launch and managed updates (day 5+)
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ls-ink-dim)]">
              We launch and keep managing your site. You request updates in
              plain language and we review every change.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
