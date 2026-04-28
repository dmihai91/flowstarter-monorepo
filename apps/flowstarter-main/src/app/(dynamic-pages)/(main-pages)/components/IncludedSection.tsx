export function IncludedSection() {
  return (
    <section id="included" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />{' '}
      <div className="ls-grain" aria-hidden />
      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div className="ls-eyebrow inline-flex items-center justify-center gap-3">
            <span className="num">05</span>
            <span>What&apos;s included</span>
          </div>

          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">Everything needed to launch fast</span>
            <span className="line flourish mt-2">and stay up to date.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <article className="ls-card p-6 md:p-7">
            <h3 className="text-lg font-semibold text-[var(--ls-ink)]">
              Every website includes
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ls-ink-dim)]">
              <li>Custom design</li>
              <li>Up to 8 pages</li>
              <li>Mobile responsive build</li>
              <li>Cal.com integration</li>
              <li>Contact forms</li>
              <li>SEO setup</li>
              <li>GDPR banner</li>
              <li>Google Analytics setup</li>
              <li>Smart Editor access</li>
            </ul>
          </article>
          <article className="ls-card p-6 md:p-7">
            <h3 className="text-lg font-semibold text-[var(--ls-ink)]">
              Monthly plan includes
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ls-ink-dim)]">
              <li>Hosting</li>
              <li>SSL certificate</li>
              <li>Daily backups</li>
              <li>Smart Editor access</li>
              <li>Team review for changes</li>
              <li>Support</li>
              <li>Performance monitoring</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
