export function LandingHero() {
  const calLink = 'https://cal.com/flowstarter/intro';

  return (
    <section
      className="ls-scope ls-section ls-section--pad-lg ls-fade-bottom"
      style={{
        minHeight: '96svh',
        paddingTop: 'clamp(5.25rem, 10vh, 7.75rem)',
      }}
    >
      <div className="ls-container">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14 lg:gap-20">
          <div className="ls-hero-content">
            <div className="ls-eyebrow flex flex-wrap items-center gap-2">
              <span className="num">01</span>
              <span>Concierge website service</span>
            </div>

            <h1 className="ls-display ls-display--hero mt-9">
              <span className="line">
                Premium websites for service businesses.
              </span>
              <span className="line flourish mt-2">Live in 5 days.</span>
            </h1>

            <p className="ls-body ls-body--lead mt-8">
              Handcrafted by our team. Updated by you with AI assistance. Fully
              managed, end to end.
            </p>

            <p className="mt-4 text-sm text-[var(--ls-ink-dim)]">
              Built for owner-operated service businesses with 1-15 team
              members: coaches, consultants, therapists, nutritionists,
              professional services, and small studios.
            </p>

            <div className="mt-10 flex w-full flex-wrap items-center gap-3 sm:gap-6">
              <a
                href={calLink}
                className="ls-cta-hero inline-flex h-14 w-full items-center justify-center px-8 text-[1.02rem] sm:w-auto sm:text-[1.08rem]"
              >
                Book a free 20-min call
                <svg
                  className="arrow ml-2 h-4 w-4"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.4}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14m-5-6l6 6-6 6"
                  />
                </svg>
              </a>
              <a
                href="#pricing"
                className="ls-link ls-link--hero w-full sm:w-auto"
              >
                See pricing
              </a>
            </div>

            <p
              style={{
                color: 'var(--ls-ink-faint)',
                fontFamily: 'var(--ls-mono)',
              }}
              className="mt-5 text-[10.5px] uppercase tracking-[0.18em]"
            >
              Limited to 4 new projects per month.
            </p>
          </div>

          <aside className="ls-card p-6 md:p-7">
            <div className="flex items-center justify-between border-b border-[var(--ls-rule)] pb-3">
              <p className="text-xs uppercase tracking-[0.13em] text-[var(--ls-ink-faint)]">
                Website mockup
              </p>
              <span className="rounded-full border border-[var(--ls-rule-strong)] px-3 py-1 text-[11px] text-[var(--ls-ink-dim)]">
                Smart Editor connected
              </span>
            </div>
            {/* TODO: Replace with final production mockup visual. */}
            <div className="mt-4 rounded-2xl border border-[var(--ls-rule)] bg-[var(--ls-surface-2)] p-4">
              <div className="mb-3 h-2.5 w-28 rounded-full bg-[var(--ls-rule)]" />
              <div className="mb-2 h-7 rounded-lg bg-[var(--ls-surface-3)]" />
              <div className="mb-4 h-7 w-4/5 rounded-lg bg-[var(--ls-surface-3)]" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-28 rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-surface-1)]" />
                <div className="h-28 rounded-xl border border-[var(--ls-rule)] bg-[var(--ls-surface-1)]" />
              </div>
              <div className="mt-3 h-10 w-full rounded-lg bg-[var(--ls-surface-3)]" />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
