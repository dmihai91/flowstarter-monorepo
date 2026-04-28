export function ProblemSection() {
  return (
    <section
      id="problem"
      className="ls-scope ls-section ls-section--pad ls-fade-top"
    >
      <div className="ls-mesh" aria-hidden />{' '}
      <div className="ls-grain" aria-hidden />
      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div className="ls-eyebrow inline-flex items-center justify-center gap-3">
            <span className="num">02</span>
            <span>The problem</span>
          </div>

          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">Most service businesses lose clients</span>
            <span className="line flourish mt-2">before the first call.</span>
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3 md:gap-6">
          <article className="ls-card p-6">
            <h3 className="text-base font-semibold text-[var(--ls-ink)]">
              Amateur first impression
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ls-ink-dim)]">
              Most sites look outdated, slow, or hard to trust. Visitors leave
              in seconds, even if your service is excellent.
            </p>
          </article>
          <article className="ls-card p-6">
            <h3 className="text-base font-semibold text-[var(--ls-ink)]">
              Agencies move too slowly
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ls-ink-dim)]">
              Traditional agencies often take weeks just to start. You spend too
              much time waiting, reviewing, and chasing updates.
            </p>
          </article>
          <article className="ls-card p-6">
            <h3 className="text-base font-semibold text-[var(--ls-ink)]">
              Freelancer risk
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ls-ink-dim)]">
              A single freelancer can disappear, get overloaded, or move on.
              Then your website becomes hard to maintain.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
